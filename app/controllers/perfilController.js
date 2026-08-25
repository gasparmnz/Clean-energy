const { body, validationResult } = require('express-validator');
const models = require('../models/models');
const { usuarioModel } = models;
const { arquivoParaDataUri } = require('../helpers/imagem');

// GET /perfil
async function getPerfil(req, res) {
  try {
    const usuarioDados = await usuarioModel.findById(req.session.userId);

    if (usuarioDados) {
      usuarioDados.perfil = req.session.perfil;
      usuarioDados.nome = usuarioDados.Nome;
      if (usuarioDados.foto) req.session.fotoUsuario = usuarioDados.foto;
      res.locals.usuario = { ...res.locals.usuario, ...usuarioDados, foto: usuarioDados.foto || null };
    }

    res.render('pages/perfil', {
      usuario: usuarioDados,
    });
  } catch (err) {
    res.render('pages/perfil', { usuario: null });
  }
}

// POST /perfil/atualizar
async function atualizarPerfil(req, res) {
  const { nome, biografia } = req.body;
  if (!nome || nome.trim().length < 2) {
    return res.json({ sucesso: false, erro: 'Nome muito curto.' });
  }
  try {
    await usuarioModel.updatePerfil(req.session.userId, { nome: nome.trim(), biografia });
    req.session.nomeUsuario = nome.trim();
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.json({ sucesso: false, erro: 'Erro ao atualizar.' });
  }
}

// POST /perfil/foto
async function atualizarFoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhuma imagem enviada.' });
    }

    // Antes: salvava o arquivo em disco e guardava só o nome do arquivo.
    // Agora: a imagem em si (data URI) é salva na coluna `foto` do banco.
    const fotoDataUri = arquivoParaDataUri(req.file);
    await usuarioModel.updateFoto(req.session.userId, fotoDataUri);
    req.session.fotoUsuario = fotoDataUri;

    return res.json({
      sucesso: true,
      foto: fotoDataUri
    });
  } catch (err) {
    console.error('Erro upload foto:', err);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao salvar foto.'
    });
  }
}

// GET /upgrade_vendedor
function getUpgradeVendedorForm(req, res) {
  if (req.session.perfil !== 'comprador') {
    return res.redirect('/?erro=acesso_restrito');
  }
  res.render('pages/upgrade_vendedor', {
    valoresEmpresa: { nome: req.session.nomeUsuario, email: req.session.emailUsuario, company_name: '', company_email: '', cnpj: '' },
    erroValidacaoEmpresa: {},
    msgErroEmpresa: {}
  });
}

// Regras de validação usadas antes do handler de POST /upgrade_vendedor
const validarUpgradeVendedor = [
  body('company_name')
    .trim()
    .notEmpty().withMessage('*Campo obrigatório!')
    .isLength({ min: 3 }).withMessage('*Nome da empresa muito curto'),

  body('company_email')
    .trim()
    .notEmpty().withMessage('*Campo obrigatório!')
    .isEmail().withMessage('*E-mail inválido!'),

  body('cnpj')
    .notEmpty().withMessage('*Campo obrigatório!')
    .custom((value) => {
      if (value.replace(/\D/g, '').length !== 14) {
        throw new Error('*O CNPJ deve conter 14 números!');
      }
      return true;
    })
];

// POST /upgrade_vendedor
async function postUpgradeVendedor(req, res) {
  if (req.session.perfil !== 'comprador') {
    return res.redirect('/?erro=acesso_restrito');
  }

  const errors = validationResult(req);
  const valoresEmpresa = {
    nome: req.session.nomeUsuario,
    email: req.session.emailUsuario,
    company_name: req.body.company_name || '',
    company_email: req.body.company_email || '',
    cnpj: req.body.cnpj || ''
  };
  if (!errors.isEmpty()) {
    const erroValidacaoEmpresa = {}, msgErroEmpresa = {};
    errors.array().forEach(e => { erroValidacaoEmpresa[e.path] = 'erro'; msgErroEmpresa[e.path] = e.msg; });
    return res.render('pages/upgrade_vendedor', { valoresEmpresa, erroValidacaoEmpresa, msgErroEmpresa });
  }

  try {
    const companyName = req.body.company_name.trim();
    const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');

    const existing = await usuarioModel.findByCNPJ(cnpjNumeros);
    if (existing) {
      return res.render('pages/upgrade_vendedor', {
        valoresEmpresa,
        erroValidacaoEmpresa: { cnpj: 'erro' },
        msgErroEmpresa: { cnpj: '*Este CNPJ já está cadastrado!' }
      });
    }

    await usuarioModel.upgradeParaVendedor(req.session.userId, { companyName, cnpj: cnpjNumeros });

    req.session.perfil = 'vendedor';
    req.session.tipo = 'PJ';

    return res.redirect('/perfil');
  } catch (err) {
    console.error('Erro ao fazer upgrade para vendedor:', err);
    res.status(500).send('Erro ao fazer upgrade. Tente novamente.');
  }
}

module.exports = {
  getPerfil,
  atualizarPerfil,
  atualizarFoto,
  getUpgradeVendedorForm,
  validarUpgradeVendedor,
  postUpgradeVendedor
};
