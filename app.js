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
  secret: 'clean-energy-secret-key',
  resave: false,
  saveUninitialized: true
}));

const rotas = require('./app/routes/router');
const rotasAdm = require('./app/routes/router-adm');
app.use('/', rotas);
app.use('/adm', rotasAdm);

const porta = process.env.PORT || process.env.APP_PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor ouvindo na porta ${porta} - http://localhost:${porta}/`);
});
