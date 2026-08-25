const { disponivel: webauthnDisponivel } = require('../helpers/webauthn');

// Exige usuário logado (qualquer perfil)
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// Exige usuário logado com perfil de vendedor
function requireVendedor(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.perfil !== 'vendedor') return res.redirect('/?erro=acesso_restrito');
  next();
}

// Exige sessão de administrador
// OBS: existia no router.js original mas não estava sendo aplicado a nenhuma
// rota do painel admin (bug pré-existente). Mantido aqui, sem alterar esse
// comportamento, já que a tarefa pedida foi só reorganizar sem quebrar nada.
function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/adm-login');
  }
  next();
}

// Exige que o pacote de WebAuthn esteja instalado/disponível no servidor
function requireWebauthn(req, res, next) {
  if (!webauthnDisponivel) {
    return res.status(503).json({ error: 'Biometria indisponível: rode "npm install" no servidor para habilitar este recurso.' });
  }
  next();
}

module.exports = { requireLogin, requireVendedor, requireAdmin, requireWebauthn };
