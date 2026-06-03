

// Middleware global: injeta usuário na sessão em res.locals
// Assim todas as views (header, sidebar) têm acesso a `usuario`
const attachUser = ((req, res, next) => {
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
    return res.redirect("/adm-login");
  }
  next();
}

module.exports = { attachUser, requireLogin, requireVendedor, requireAdmin };