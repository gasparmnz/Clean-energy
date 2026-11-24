const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const models = require('../models/models');
const { usuarioModel } = models;
const { validarCPF } = require('../helpers/validacao');
const SenhaRegras = require('../public/js/senha-regras');

const regraSenha = () => body('senha')
  .notEmpty().withMessage('*Campo obrigatório!').bail()
  .isStrongPassword(SenhaRegras.OPCOES_VALIDATOR)
  .withMessage((value) => '*' + (SenhaRegras.mensagemErro(value) || 'Senha inválida!')).bail()
  .custom((value) => {
    const msg = SenhaRegras.mensagemErro(value);
    if (msg) throw new Error('*' + msg);
    return true;
  });
const { sendResetPasswordEmail } = require('../helpers/mailer');

const RESET_TOKEN_VALIDADE_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getCadastro(req, res) {
  res.render('pages/cadastro', {
    valoresPessoaFisica: { nome: '', cpf: '', email: '', senha: '', confirmarSenha: '' },
    erroValidacaoPessoaFisica: {}, msgErroPessoaFisica: {},
    valoresEmpresa: { nome: '', cpf: '', email: '', senha: '', confirmarSenha: '' },
    erroValidacaoEmpresa: {}, msgErroEmpresa: {},
    retorno: null,
  });
}

function getCadastroVendedorForm(req, res) {
  res.render('pages/cadastro_vendedor', { valoresEmpresa: { nome: '', cnpj: '', email: '', senha: '', confirmarSenha: '' }, erroValidacaoEmpresa: {}, msgErroEmpresa: {}, retorno: null });
}

function getLogin(req, res) {
  if (req.session.userId) return res.redirect('/perfil');
  res.render('pages/login', { erro: null, valores: { usuarioDigitado: '', senhaDigitada: '' }, sucesso: false });
}

function getLogout(req, res) {
  req.session.destroy(() => res.redirect('/login'));
}

const validarCadastroUsuario = [
  body('nome').trim().notEmpty().withMessage('*Campo obrigatório!').isLength({ min: 3, max: 50 }).withMessage('*O Nome deve conter entre 3 e 50 caracteres!'),
  body('cpf').custom((value) => { if (validarCPF(value)) return true; throw new Error('CPF inválido!'); }),
  body('email').notEmpty().withMessage('*Campo obrigatório!').isEmail().withMessage('*Endereço de email inválido!'),
  regraSenha(),
  body('confirmarSenha').notEmpty().withMessage('*Campo obrigatório!').custom((value, { req }) => { if (value !== req.body.senha) throw new Error('*As senhas não conferem!'); return true; })
];

async function postCadastroUsuario(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const erroValidacaoPessoaFisica = {}, msgErroPessoaFisica = {};
    errors.array().forEach(e => { erroValidacaoPessoaFisica[e.path] = 'erro'; msgErroPessoaFisica[e.path] = e.msg; });
    return res.render('pages/cadastro', {
      valoresPessoaFisica: req.body, erroValidacaoPessoaFisica, msgErroPessoaFisica,
      valoresEmpresa: { nome: '', cnpj: '', email: '', senha: '', confirmarSenha: '' },
      erroValidacaoEmpresa: {}, msgErroEmpresa: {}, formularioAtivo: 'farmacia', retorno: null
    });
  }
  try {
    const existing = await usuarioModel.findByEmail(req.body.email);
    if (existing) {
      return res.render('pages/cadastro', {
        valoresPessoaFisica: req.body,
        erroValidacaoPessoaFisica: { email: 'erro' }, msgErroPessoaFisica: { email: '*Este e-mail já está cadastrado!' },
        valoresEmpresa: { nome: '', cnpj: '', email: '', senha: '', confirmarSenha: '' },
        erroValidacaoEmpresa: {}, msgErroEmpresa: {}, retorno: null
      });
    }
    const senhaHash = await bcrypt.hash(req.body.senha, 10);
    const result = await usuarioModel.createPF({ nome: req.body.nome, email: req.body.email, senhaHash });
    const cpfNumeros = req.body.cpf.replace(/\D/g, '');
    await usuarioModel.createPessoaFisica(result.insertId, cpfNumeros);
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).send('Erro ao cadastrar. Tente novamente.');
  }
}

const validarCadastroEmpresa = [
  body('nome').trim().notEmpty().withMessage('*Campo obrigatório!').isLength({ min: 3, max: 50 }).withMessage('*O Nome da empresa deve conter entre 3 e 50 caracteres!'),
  body('cnpj').notEmpty().withMessage('*Campo obrigatório!').custom((value) => { if (value.replace(/\D/g, '').length !== 14) throw new Error('*O CNPJ deve conter 14 números!'); return true; }),
  body('email').notEmpty().withMessage('*Campo obrigatório!').isEmail().withMessage('*Endereço de email inválido!'),
  regraSenha(),
  body('confirmarSenha').notEmpty().withMessage('*Campo obrigatório!').custom((value, { req }) => { if (value !== req.body.senha) throw new Error('*As senhas não conferem!'); return true; })
];

async function postCadastroEmpresa(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const erroValidacaoEmpresa = {}, msgErroEmpresa = {};
    errors.array().forEach(e => { erroValidacaoEmpresa[e.path] = 'erro'; msgErroEmpresa[e.path] = e.msg; });
    return res.render('pages/cadastro_vendedor', { valoresEmpresa: req.body, erroValidacaoEmpresa, msgErroEmpresa, retorno: null });
  }
  try {
    const existing = await usuarioModel.findByEmail(req.body.email);
    if (existing) {
      return res.render('pages/cadastro_vendedor', {
        valoresEmpresa: req.body,
        erroValidacaoEmpresa: { email: 'erro' }, msgErroEmpresa: { email: '*Este e-mail já está cadastrado!' }, retorno: null
      });
    }
    const senhaHash = await bcrypt.hash(req.body.senha, 10);
    const result = await usuarioModel.createPJ({ nome: req.body.nome, email: req.body.email, senhaHash });
    const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');
    await usuarioModel.createPessoaJuridica(result.insertId, cnpjNumeros);
    res.redirect('/login');
  } catch (err) {
    console.error('Erro ao cadastrar empresa:', err);
    res.status(500).send('Erro ao cadastrar. Tente novamente.');
  }
}

async function postLogin(req, res) {
  const { usuarioDigitado, senhaDigitada } = req.body;
  try {
    const usuario = await usuarioModel.findByEmail(usuarioDigitado);
    if (!usuario || !(await bcrypt.compare(senhaDigitada, usuario.Senha))) {
      return res.render('pages/login', {
        erro: '*Não reconhecemos estas credenciais. Tente novamente.',
        sucesso: false, valores: { usuarioDigitado, senhaDigitada: '' }
      });
    }

    if (usuario.status === 'suspended') {
      return res.render('pages/login', {
        erro: 'Sua conta foi suspensa pelo administrador. Entre em contato com o suporte para mais informações.',
        sucesso: false, valores: { usuarioDigitado, senhaDigitada: '' }
      });
    }

    req.session.userId = usuario.Usuario_ID;
    req.session.nomeUsuario = usuario.Nome;
    req.session.emailUsuario = usuario.Email;
    req.session.perfil = usuario.Tipo === 'PJ' ? 'vendedor' : 'comprador';
    req.session.tipo = usuario.Tipo;
    req.session.fotoUsuario = usuario.foto || null;
    await usuarioModel.updateUltimoLogin(usuario.Usuario_ID);
    return res.redirect('/perfil');
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro interno. Tente novamente.');
  }
}

function getRecuperarSenha(req, res) {
  res.render('pages/recuperar-senha', { erro: null, sucesso: false, email: '' });
}

async function postRecuperarSenha(req, res) {
  const { email } = req.body;
  try {
    const usuario = await usuarioModel.findByEmail(email);
    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashToken(token);
      const expiraEm = new Date(Date.now() + RESET_TOKEN_VALIDADE_MS);
      await usuarioModel.setResetToken(usuario.Usuario_ID, tokenHash, expiraEm);

      const link = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/redefinir-senha/${token}`;
      try {
        await sendResetPasswordEmail(usuario.Email, link);
      } catch (mailErr) {
        console.error('Erro ao enviar e-mail de redefinição de senha:', mailErr.response?.body || mailErr);
      }
    }

    return res.render('pages/recuperar-senha', {
      erro: null, sucesso: true, email: ''
    });
  } catch (err) {
    console.error('Erro ao solicitar redefinição de senha:', err);
    return res.render('pages/recuperar-senha', {
      erro: 'Erro ao processar a solicitação. Tente novamente.', sucesso: false, email
    });
  }
}

async function getRedefinirSenha(req, res) {
  const { token } = req.params;
  const usuario = await usuarioModel.findByResetTokenHash(hashToken(token));
  if (!usuario) {
    return res.render('pages/redefinir-senha', {
      erro: 'Este link de redefinição é inválido ou já expirou. Solicite um novo.',
      tokenValido: false, token, sucesso: false
    });
  }
  res.render('pages/redefinir-senha', { erro: null, tokenValido: true, token, sucesso: false });
}

async function postRedefinirSenha(req, res) {
  const { token } = req.params;
  const { senha, confirmarSenha } = req.body;

  const usuario = await usuarioModel.findByResetTokenHash(hashToken(token));
  if (!usuario) {
    return res.render('pages/redefinir-senha', {
      erro: 'Este link de redefinição é inválido ou já expirou. Solicite um novo.',
      tokenValido: false, token, sucesso: false
    });
  }

  const erroSenha = SenhaRegras.mensagemErro(senha);
  if (erroSenha) {
    return res.render('pages/redefinir-senha', {
      erro: '*' + erroSenha, tokenValido: true, token, sucesso: false
    });
  }
  if (senha !== confirmarSenha) {
    return res.render('pages/redefinir-senha', {
      erro: '*As senhas não conferem!', tokenValido: true, token, sucesso: false
    });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    await usuarioModel.updateSenhaELimparToken(usuario.Usuario_ID, senhaHash);
    return res.render('pages/redefinir-senha', { erro: null, tokenValido: true, token, sucesso: true });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    return res.render('pages/redefinir-senha', {
      erro: 'Erro ao redefinir a senha. Tente novamente.', tokenValido: true, token, sucesso: false
    });
  }
}

module.exports = {
  getCadastro,
  getCadastroVendedorForm,
  getLogin,
  getLogout,
  validarCadastroUsuario,
  postCadastroUsuario,
  validarCadastroEmpresa,
  postCadastroEmpresa,
  postLogin,
  getRecuperarSenha,
  postRecuperarSenha,
  getRedefinirSenha,
  postRedefinirSenha
};
