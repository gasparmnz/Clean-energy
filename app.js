const express = require('express');
const app = express();
require('dotenv').config();

process.on('unhandledRejection', (motivo) => {
  console.error('[processo] Promise rejeitada sem tratamento:', motivo && (motivo.code || motivo.message) ? `${motivo.code || ''} ${motivo.message || ''}`.trim() : motivo);
});

const CODIGOS_BANCO_INDISPONIVEL = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_SEQUENCE_TIMEOUT', 'ER_CON_COUNT_ERROR',
  'ER_USER_LIMIT_REACHED', 'ER_TOO_MANY_USER_CONNECTIONS'
]);
function erroDeBancoIndisponivel(err) {
  return !!err && (CODIGOS_BANCO_INDISPONIVEL.has(err.code) || /max_user_connections/i.test(err.message || ''));
}

function responderServicoIndisponivel(req, res) {
  if (res.headersSent) return;
  res.status(503).set('Retry-After', '30').set('Cache-Control', 'no-store');
  const querJson = req.xhr || (req.get('Accept') || '').includes('application/json') || req.is('application/json');
  if (querJson) {
    return res.json({ sucesso: false, erro: 'Serviço temporariamente indisponível. Tente novamente em instantes.' });
  }
  res.type('html').send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Serviço indisponível - Clean Energy</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#f4f7f5;color:#1f2937;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
main{max-width:460px;background:#fff;border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,.08);padding:32px;text-align:center}
h1{color:#085847;font-size:1.4rem}button{background:#1b814e;color:#fff;border:0;border-radius:8px;padding:10px 22px;font-size:1rem;cursor:pointer}</style></head>
<body><main><h1>Estamos com instabilidade no momento</h1>
<p>Não conseguimos acessar nosso banco de dados agora. Sua internet está funcionando; o problema é do nosso lado e costuma se resolver em instantes.</p>
<button onclick="location.reload()">Tentar novamente</button></main></body></html>`);
}

const { helmetMiddleware, compressionMiddleware } = require('./app/middlewares/security');

function linhasDoProjeto(stack, limite = 4) {
  const linhas = (stack || '').split('\n').slice(1);
  const doProjeto = linhas.filter(l => !l.includes('node_modules') && !l.includes('node:') && !l.includes(__filename));
  return (doProjeto.length ? doProjeto : linhas).slice(0, limite).join('\n');
}

app.use((req, res, next) => {
  const writeHeadOriginal = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.locals.__origemPrimeiraResposta) {
      res.locals.__origemPrimeiraResposta = res.locals.__renderEmAndamento
        ? `res.render('${res.locals.__renderEmAndamento.view}') chamado em:\n${res.locals.__renderEmAndamento.local}`
        : linhasDoProjeto(new Error('primeira resposta').stack);
    }
    return writeHeadOriginal.apply(this, args);
  };

  const renderOriginal = res.render;
  res.render = function (view, options, callback) {
    if (typeof options === 'function') { callback = options; options = undefined; }
    if (typeof callback === 'function') return renderOriginal.call(this, view, options, callback);

    const local = linhasDoProjeto(new Error('res.render').stack, 3);

    return renderOriginal.call(this, view, options, (err, html) => {
      if (err) return req.next(err);
      if (res.headersSent) {
        console.error(
          `[resposta duplicada] ${req.method} ${req.originalUrl}: res.render('${view}') terminou, ` +
          'mas outra resposta já tinha sido enviada para esta requisição.\n' +
          `  Este res.render foi chamado em:\n${local}\n` +
          `  A primeira resposta veio de:\n${res.locals.__origemPrimeiraResposta || '(desconhecida)'}`
        );
        return;
      }
      res.locals.__renderEmAndamento = { view, local };
      try {
        res.send(html);
      } finally {
        res.locals.__renderEmAndamento = null;
      }
    });
  };
  next();
});

app.use(helmetMiddleware);
app.use(compressionMiddleware);

app.set('trust proxy', 1);

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/sw.js', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});
app.use('/manifest.json', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});

app.use(express.static(path.join(__dirname, 'app', 'public'), {
  maxAge: '0',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));
app.use('/imagem', express.static('app/public/imagem', { maxAge: '7d' }));

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysqlSessao = require('mysql2');
const { opcoesPool, validarConexoesOciosas, erroDeConexaoPerdida } = require('./config/mysql_resiliente');

const poolSessao = mysqlSessao.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: (process.env.DB_NAME || 'produtos').toLowerCase(),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: { rejectUnauthorized: false },
  ...opcoesPool(2),
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});
validarConexoesOciosas(poolSessao);

const INTERVALO_LIMPEZA_SESSOES = 900000;

const sessionStore = new MySQLStore({
  clearExpired: false,
  expiration: 86400000
}, poolSessao);

['get', 'set', 'touch', 'destroy', 'length', 'all', 'clear'].forEach((metodo) => {
  const original = sessionStore[metodo];
  if (typeof original !== 'function') return;
  sessionStore[metodo] = function (...args) {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    const promessa = original.apply(this, args).catch((erro) => {
      if (!erroDeConexaoPerdida(erro)) throw erro;
      return original.apply(this, args);
    });
    if (!callback) return promessa;
    promessa.then(
      (resultado) => process.nextTick(callback, null, resultado),
      (erro) => process.nextTick(callback, erro)
    );
    return promessa.catch(() => {});
  };
});

sessionStore.onReady().catch(err => {
  console.error('Erro ao iniciar o store de sessão (MySQL):', err.code || '', err.message);
});

setInterval(() => {
  sessionStore.clearExpiredSessions().catch(err => {
    console.error('[sessão] Falha ao limpar sessões expiradas:', err.code || '', err.message);
  });
}, INTERVALO_LIMPEZA_SESSOES).unref();

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'clean-energy-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: true
});

app.use((req, res, next) => {
  sessionMiddleware(req, res, (err) => {
    if (!err) return next();
    console.error('[sessão] Falha ao acessar o store de sessões (MySQL):', err.code || '', err.message);
    responderServicoIndisponivel(req, res);
  });
});

app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.usuario = {
      id: req.session.userId,
      nome: req.session.nomeUsuario,
      email: req.session.emailUsuario,
      perfil: req.session.perfil,
      Tipo: req.session.tipo,
      tipo: req.session.tipo,
      Nome: req.session.nomeUsuario,
      Email: req.session.emailUsuario,
       foto: req.session.fotoUsuario
    };
  } else {
    res.locals.usuario = null;
  }
  next();
});

const rotas = require('./app/routes/router');
const rotasAdm = require('./app/routes/router-adm');
const sitemapRoutes = require('./app/routes/sitemapRoutes');
app.use('/', sitemapRoutes);
app.use('/', rotas);
app.use('/adm', rotasAdm);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    console.error(
      `[erro após resposta] ${req.method} ${req.originalUrl}:`, err && (err.stack || err),
      '\nOrigem da primeira resposta:\n' + (res.locals.__origemPrimeiraResposta || '(desconhecida)')
    );
    return next(err);
  }
  if (erroDeBancoIndisponivel(err)) {
    console.error(`[erro] Banco indisponível em ${req.method} ${req.originalUrl}:`, err.code, err.message);
    return responderServicoIndisponivel(req, res);
  }
  console.error(`[erro] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).send('Ocorreu um erro inesperado. Tente novamente.');
});

const porta = process.env.PORT || process.env.APP_PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor ouvindo na porta ${porta} - http://localhost:${porta}/`);
});