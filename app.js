const express = require('express');
const app = express();
require('dotenv').config();

const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'app', 'public')));
app.use('/imagem', express.static('app/public/imagem'));

const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'clean-energy-secret-key',
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
    };
  } else {
    res.locals.usuario = null;
  }
  next();
});

const rotas = require('./app/routes/router');
const rotasAdm = require('./app/routes/router-adm');
app.use('/', rotas);
app.use('/adm', rotasAdm);

const porta = process.env.PORT || process.env.APP_PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor ouvindo na porta ${porta} - http://localhost:${porta}/`);
});
