const { disponivel: webauthnDisponivel } = require('../helpers/webauthn');

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireVendedor(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.perfil !== 'vendedor') return res.redirect('/?erro=acesso_restrito');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/adm-login');
  }
  next();
}

function requireWebauthn(req, res, next) {
  if (!webauthnDisponivel) {
    return res.status(503).json({ error: 'Biometria indisponível: rode "npm install" no servidor para habilitar este recurso.' });
  }
  next();
}

module.exports = { requireLogin, requireVendedor, requireAdmin, requireWebauthn };
