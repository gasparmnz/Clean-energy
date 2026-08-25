const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const models = require('../models/models');
const { usuarioModel } = models;
const { validarCPF } = require('../helpers/validacao');

// GET /cadastro
function getCadastro(req, res) {
  res.render('pages/cadastro', {
    valoresPessoaFisica: { nome: '', cpf: '', email: '', senha: '', confirmarSenha: '' },
    erroValidacaoPessoaFisica: {}, msgErroPessoaFisica: {},
    valoresEmpresa: { nome: '', cpf: '', email: '', senha: '', confirmarSenha: '' },
    erroValidacaoEmpresa: {}, msgErroEmpresa: {},
    retorno: null,
  });
}

// GET /cadastro_vendedor
function getCadastroVendedorForm(req, res) {
  res.render('pages/cadastro_vendedor', { valoresEmpresa: { nome: '', cnpj: '', email: '', senha: '', confirmarSenha: '' }, erroValidacaoEmpresa: {}, msgErroEmpresa: {}, retorno: null });
}

// GET /login
function getLogin(req, res) {
  if (req.session.userId) return res.redirect('/perfil');
  res.render('pages/login', { erro: null, valores: { usuarioDigitado: '', senhaDigitada: '' }, sucesso: false });
}

// GET /logout
function getLogout(req, res) {
  req.session.destroy(() => res.redirect('/login'));
}

// Regras de validação do cadastro de comprador (PF)
const validarCadastroUsuario = [
  body('nome').trim().notEmpty().withMessage('*Campo obrigatório!').isLength({ min: 3, max: 50 }).withMessage('*O Nome deve conter entre 3 e 50 caracteres!'),
  body('cpf').custom((value) => { if (validarCPF(value)) return true; throw new Error('CPF inválido!'); }),
  body('email').notEmpty().withMessage('*Campo obrigatório!').isEmail().withMessage('*Endereço de email inválido!'),
  body('senha').notEmpty().withMessage('*Campo obrigatório!').isStrongPassword({ minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1, minLength: 8 }).withMessage('*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!'),
  body('confirmarSenha').notEmpty().withMessage('*Campo obrigatório!').custom((value, { req }) => { if (value !== req.body.senha) throw new Error('*As senhas não conferem!'); return true; })
];

// POST /cadastroUsuario — CADASTRO COMPRADOR (PF)
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

// Regras de validação do cadastro de vendedor (PJ)
const validarCadastroEmpresa = [
  body('nome').trim().notEmpty().withMessage('*Campo obrigatório!').isLength({ min: 3, max: 50 }).withMessage('*O Nome da empresa deve conter entre 3 e 50 caracteres!'),
  body('cnpj').notEmpty().withMessage('*Campo obrigatório!').custom((value) => { if (value.replace(/\D/g, '').length !== 14) throw new Error('*O CNPJ deve conter 14 números!'); return true; }),
  body('email').notEmpty().withMessage('*Campo obrigatório!').isEmail().withMessage('*Endereço de email inválido!'),
  body('senha').notEmpty().withMessage('*Campo obrigatório!').isStrongPassword({ minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1, minLength: 8 }).withMessage('*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!'),
  body('confirmarSenha').notEmpty().withMessage('*Campo obrigatório!').custom((value, { req }) => { if (value !== req.body.senha) throw new Error('*As senhas não conferem!'); return true; })
];

// POST /cadastroEmpresa — CADASTRO VENDEDOR (PJ)
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

// POST /login
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
        erro: '⚠️ Sua conta foi suspensa pelo administrador. Entre em contato com o suporte para mais informações.',
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

module.exports = {
  getCadastro,
  getCadastroVendedorForm,
  getLogin,
  getLogout,
  validarCadastroUsuario,
  postCadastroUsuario,
  validarCadastroEmpresa,
  postCadastroEmpresa,
  postLogin
};
