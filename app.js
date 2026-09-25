const express = require('express');
const app = express();
require('dotenv').config();

// Rede de segurança: uma Promise rejeitada sem .catch() não pode derrubar o
// servidor inteiro (no Node >= 15 isso encerra o processo). Foi exatamente
// isso que acontecia com o erro "getaddrinfo ENOTFOUND ...clever-cloud.com"
// do session store — ver o comentário em "SESSÕES" abaixo. O erro continua
// sendo registrado no log.
process.on('unhandledRejection', (motivo) => {
  console.error('[processo] Promise rejeitada sem tratamento:', motivo && (motivo.code || motivo.message) ? `${motivo.code || ''} ${motivo.message || ''}`.trim() : motivo);
});

// Erros típicos de banco inacessível (DNS, rede, limite de conexões...).
const CODIGOS_BANCO_INDISPONIVEL = new Set([
  'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_SEQUENCE_TIMEOUT', 'ER_CON_COUNT_ERROR',
  'ER_USER_LIMIT_REACHED', 'ER_TOO_MANY_USER_CONNECTIONS'
]);
function erroDeBancoIndisponivel(err) {
  return !!err && (CODIGOS_BANCO_INDISPONIVEL.has(err.code) || /max_user_connections/i.test(err.message || ''));
}

// Resposta 503 (serviço temporariamente indisponível). Não é "offline": o
// navegador recebe uma página de verdade do servidor, e o Service Worker a
// repassa como está (só mostra offline.html quando o servidor não responde).
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

app.use(helmetMiddleware);
app.use(compressionMiddleware);

app.set('trust proxy', 1);

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// O service worker precisa ser sempre revalidado para que atualizações
// (novas versões do cache/app shell) cheguem aos usuários rapidamente.
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

// ── SESSÕES (persistentes no MySQL) ──────────────────────────────────
// Por que o servidor caía com "getaddrinfo ENOTFOUND ...clever-cloud.com":
//  1. Com clearExpired: true, o express-mysql-session faz
//     setInterval(clearExpiredSessions, 15 min). Essa função devolve uma
//     Promise e o próprio pacote NÃO trata a rejeição. Quando o DNS/rede do
//     banco falha, a rejeição fica sem tratamento e o Node encerra o
//     processo (termina com "Node.js v22.x" no terminal).
//  2. Com o servidor fora do ar, o navegador não recebe resposta nenhuma;
//     o Service Worker cai no fallback e mostra offline.html (ou uma cópia
//     antiga da página em cache) — por isso /cadastro "aparecia offline".
// Correção: a limpeza de sessões expiradas é agendada aqui, com .catch();
// erros do store viram uma resposta 503 (ver middleware de sessão abaixo);
// e há uma rede de segurança para rejeições não tratadas (topo do arquivo).
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysqlSessao = require('mysql2');

// O express-mysql-session só repassa host/port/user/password/database e
// opções de pool para o mysql2 — `ssl` e timeouts eram ignorados em
// silêncio. Criando o pool aqui, as mesmas opções de config/pool_conexoes.js
// passam a valer também para o store de sessão.
const poolSessao = mysqlSessao.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: (process.env.DB_NAME || 'produtos').toLowerCase(),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: { rejectUnauthorized: false },
  // O banco (plano gratuito) só permite 5 conexões simultâneas NO TOTAL
  // para este usuário, e config/pool_conexoes.js já abre seu próprio pool
  // (limitado a 3) apontando pro mesmo banco. 3 (app) + 2 (sessão) = 5.
  // Sem isso, os dois pools competem pelo limite e o MySQLStore passa a
  // falhar com "max_user_connections exceeded".
  connectionLimit: 2,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const INTERVALO_LIMPEZA_SESSOES = 900000; // 15 min

const sessionStore = new MySQLStore({
  clearExpired: false, // a limpeza é agendada manualmente abaixo, com tratamento de erro
  expiration: 86400000 // 24h
}, poolSessao);

sessionStore.onReady().catch(err => {
  console.error('Erro ao iniciar o store de sessão (MySQL):', err.code || '', err.message);
});

// Limpeza periódica das sessões expiradas — mesma função do pacote, mas com
// .catch(): se o banco estiver inacessível, só registra e tenta de novo no
// próximo ciclo, sem derrubar o servidor.
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

// Se o store de sessão falhar (banco inacessível), o express-session chama
// next(err). Em vez de uma página de erro genérica (ou de o processo cair),
// o usuário recebe um 503 claro, e o próximo acesso tenta de novo.
app.use((req, res, next) => {
  sessionMiddleware(req, res, (err) => {
    if (!err) return next();
    console.error('[sessão] Falha ao acessar o store de sessões (MySQL):', err.code || '', err.message);
    responderServicoIndisponivel(req, res);
  });
});

// Helper global para montar o src das imagens de produto nas views
app.locals.srcImagem = require('./app/helpers/imagem').srcImagem;

// Middleware global: injeta usuário na sessão em res.locals
// Assim todas as views (header, sidebar) têm acesso a `usuario`
app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.usuario = {
      id: req.session.userId,
      nome: req.session.nomeUsuario,
      email: req.session.emailUsuario,
      perfil: req.session.perfil,       // 'comprador' | 'vendedor'
      Tipo: req.session.tipo,           // 'PF' | 'PJ'
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

// Tratamento central de erros (Express 5 também encaminha para cá os erros
// de handlers async). Banco inacessível -> 503; demais erros -> 500.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
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