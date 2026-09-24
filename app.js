const express = require('express');
const app = express();
require('dotenv').config();

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

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: (process.env.DB_NAME || 'produtos').toLowerCase(),
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: { rejectUnauthorized: false },
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 min
  expiration: 86400000 // 24h
});

sessionStore.onReady().catch(err => {
  console.error('Erro ao iniciar o store de sessão (MySQL):', err.message);
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'clean-energy-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: true
}));

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

const porta = process.env.PORT || process.env.APP_PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor ouvindo na porta ${porta} - http://localhost:${porta}/`);
});
