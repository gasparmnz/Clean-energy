var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const models = require("../models/models");
const produtosModel = models;
const { usuarioModel, vendedorModel } = models;
const cartModel = require("../models/cartModel");
const { uploadProduto, uploadFoto } = require("../helpers/upload");
var { validarCPF } = require("../helpers/validacao");

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireVendedor(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.perfil !== 'vendedor') return res.redirect('/?erro=acesso_restrito');
  next();
}

/* ROTAS */
router.get("/", async (req, res) => {
  const { busca, estado, categoria, precoMin, precoMax } = req.query;
  try {
    const produtos = await produtosModel.findAllComFiltros({ busca, estado, categoria, precoMin, precoMax });
    res.render("pages/produtos", {
      produtos,
      filtros: { busca: busca||'', estado: estado||'', categoria: categoria||'', precoMin: precoMin||'', precoMax: precoMax||'' }
    });
  } catch (err) {
    console.error('Erro ao buscar produtos:', err.message);
    res.render("pages/produtos", { produtos: [], filtros: {} });
  }
});

router.get("/home", (req, res) => res.render("pages/home"));

// Rota para comprador se tornar vendedor
router.get("/upgrade_vendedor", requireLogin, async (req, res) => {
  if (req.session.perfil !== 'comprador') {
    return res.redirect('/?erro=acesso_restrito');
  }
  res.render("pages/upgrade_vendedor", { 
    valoresEmpresa: { nome: req.session.nomeUsuario, email: req.session.emailUsuario, company_name: '', company_email: '', cnpj: '' }, 
    erroValidacaoEmpresa: {}, 
    msgErroEmpresa: {} 
  });
});

// POST para upgrade de vendedor
router.post("/upgrade_vendedor",
  requireLogin,

 body("company_name")
  .trim()
  .notEmpty().withMessage("*Campo obrigatório!")
  .isLength({ min: 3 }).withMessage("*Nome da empresa muito curto"),

body("company_email")
  .trim()
  .notEmpty().withMessage("*Campo obrigatório!")
  .isEmail().withMessage("*E-mail inválido!"),

body("cnpj")
  .notEmpty().withMessage("*Campo obrigatório!")
  .custom((value) => {
    if (value.replace(/\D/g, '').length !== 14) {
      throw new Error("*O CNPJ deve conter 14 números!");
    }
    return true;
  }),

  async (req, res) => {
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
      errors.array().forEach(e => { erroValidacaoEmpresa[e.path]='erro'; msgErroEmpresa[e.path]=e.msg; });
      return res.render("pages/upgrade_vendedor", { valoresEmpresa, erroValidacaoEmpresa, msgErroEmpresa });
    }

    try {
      const companyName = req.body.company_name.trim();
      const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');

      const existing = await usuarioModel.findByCNPJ(cnpjNumeros);
      if (existing) {
        return res.render("pages/upgrade_vendedor", {
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
);

router.get("/minhascompras", requireLogin, (req, res) => {
  const pendentes = req.session.pedidosPendentes || [];
  res.render("pages/minhascompras", { pendentes });
});

// Move itens do carrinho para pedidos pendentes na sessão
router.post("/minhascompras/finalizar", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await cartModel.getCartByUser(userId);
    if (cart && cart.length > 0) {
      req.session.pedidosPendentes = cart;
      const pool = require('../../config/pool_conexoes');
      await pool.query('DELETE FROM carrinho WHERE userId = ?', [userId]);
    }
    res.redirect('/minhascompras');
  } catch (err) {
    console.error('Erro ao finalizar compra:', err);
    res.redirect('/carrinho');
  }
});

// ── Atualizar perfil
router.post("/perfil/atualizar", requireLogin, async (req, res) => {
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
});

router.post("/perfil/foto", requireLogin, uploadFoto.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhuma imagem enviada.' });
    }

    const filename = req.file.filename;
    await usuarioModel.updateFoto(req.session.userId, filename);
    req.session.fotoUsuario = filename;

    return res.json({
      sucesso: true,
      foto: `/imagem/${filename}`
    });
  } catch (err) {
    console.error('Erro upload foto:', err);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao salvar foto.'
    });
  }
});

router.get("/perfil", requireLogin, async (req, res) => {
  try {
    const usuarioDados = await usuarioModel.findById(req.session.userId);

    if (usuarioDados) {
      usuarioDados.perfil = req.session.perfil;
      usuarioDados.nome = usuarioDados.Nome;
      if (usuarioDados.foto) req.session.fotoUsuario = usuarioDados.foto;
      res.locals.usuario = { ...res.locals.usuario, ...usuarioDados, foto: usuarioDados.foto || null };
    }

    res.render("pages/perfil", {
      usuario: usuarioDados,
    });
  } catch (err) {
    res.render("pages/perfil", { usuario: null });
  }
});

router.get("/painel", requireLogin, (req, res) => res.render("pages/painel"));
router.get("/meus_produtos", requireLogin, (req, res) => res.render("pages/meus_produtos"));

router.get("/listaprodutos", requireLogin, async (req, res) => {
  try {
    const produtos = await produtosModel.findByUsuario(req.session.userId);
    res.render("pages/listaprodutos", { produtos });
  } catch (err) {
    console.error('Erro ao buscar produtos do usuário:', err);
    res.render("pages/listaprodutos", { produtos: [] });
  }
});

router.get("/carrinho", async (req, res) => {
  try {
    const userId = req.session?.userId || 'guest';
    const cart = await cartModel.getCartByUser(userId);
    res.render("pages/carrinho", { cart });
  } catch (err) {
    res.status(500).send('Erro ao obter carrinho');
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantidade } = req.body;
    const produto = await produtosModel.findById(productId);
    if (!produto) return res.status(404).send('Produto não encontrado');
    const userId = req.session?.userId || 'guest';
    await cartModel.addItem(userId, { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, quantidade: parseInt(quantidade,10)||1 });
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao adicionar ao carrinho: ' + err.message);
  }
});

router.post('/cart/remove', async (req, res) => {
  try {
    const userId = req.session?.userId || 'guest';
    await cartModel.removeByIndex(userId, parseInt(req.body.index));
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao remover do carrinho');
  }
});

router.get("/transporte", (req, res) => res.render("pages/transporte"));
router.get("/duvidas", (req, res) => res.render("pages/duvidas"));
router.get("/sobre_nos", (req, res) => res.render("pages/sobre_nos"));

router.get("/adicione_produto", (req, res) => {
  res.render("pages/adicione_produto");
});

router.get("/cadastrar_produto", requireVendedor, (req, res) => res.render("pages/cadastrar_produto"));
router.get("/cadastro_vendedor", (req, res) => res.render("pages/cadastro_vendedor", { valoresEmpresa: { nome:'',cnpj:'',email:'',senha:'',confirmarSenha:'' }, erroValidacaoEmpresa:{}, msgErroEmpresa:{}, retorno:null }));

router.get("/item/:id", async function (req, res) {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) return res.status(404).send("Produto não encontrado");

    const avaliacoes = await produtosModel.findAvaliacoes(req.params.id);

    const mediaNotas = avaliacoes.length
      ? (avaliacoes.reduce((s, a) => s + (a.Nota || 0), 0) / avaliacoes.length).toFixed(1)
      : null;

    let vendedor = null;
    if (produto.usuario_id) {
      vendedor = await vendedorModel.findUsuarioById(produto.usuario_id);
      if (vendedor) {
        const avgData = await vendedorModel.findMediaAvaliacao(produto.usuario_id);
        vendedor.mediaAvaliacao = avgData.media || null;
        vendedor.totalAvaliacoes = avgData.total || 0;
        vendedor.totalProdutos = await vendedorModel.findTotalProdutos(produto.usuario_id);
      }
    }

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    res.render("pages/item", { produto, avaliacoes, mediaNotas, vendedor, usuario: usuarioSessao });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
});

// ── POST avaliação de produto
router.post("/item/:id/avaliar", requireLogin, async (req, res) => {
  const produtoId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/item/${produtoId}?erro=nota`);
  }

  try {
    const jaAvaliou = await produtosModel.findAvaliacaoByUsuario(req.session.userId, produtoId);

    if (jaAvaliou) {
      await produtosModel.updateAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId });
    } else {
      await produtosModel.createAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId, nomeUsuario: req.session.nomeUsuario });
    }

    res.redirect(`/item/${produtoId}#comentarios`);
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.redirect(`/item/${produtoId}?erro=salvar`);
  }
});

router.post("/cadastrar_produto", requireVendedor, uploadProduto.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, quantidade, categoria, cidade, bairro, rua, numero, complemento, estado } = req.body;
  const local = [cidade, bairro, rua, numero, complemento].filter(Boolean).join(', ');

  const imagemFilename = req.file ? req.file.filename : 'sem-foto.png';

  let precoLimpo = (preco || '0').toString().trim()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const precoNumerico = parseFloat(precoLimpo) || 0;

  let quantidadeLimpa = (quantidade || '0').toString().trim()
    .replace(/ t$/i, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const quantidadeNumerica = parseFloat(quantidadeLimpa) || 0;

  try {
    await produtosModel.create({ nome, descricao, preco: precoNumerico, quantidade: quantidadeNumerica, categoria, local, imagem: imagemFilename, estado, usuario_id: req.session.userId });
    res.redirect('/listaprodutos');
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).send('Erro ao cadastrar produto. Tente novamente.');
  }
});

/* AUTENTICAÇÃO */
router.get("/cadastro", (req, res) => {
  res.render("pages/cadastro", {
    valoresPessoaFisica: { nome:'', cpf:'', email:'', senha:'', confirmarSenha:'' },
    erroValidacaoPessoaFisica: {}, msgErroPessoaFisica: {},
    valoresEmpresa: { nome:'', cpf:'', email:'', senha:'', confirmarSenha:'' },
    erroValidacaoEmpresa: {}, msgErroEmpresa: {},
    retorno: null,
  });
});

router.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect('/perfil');
  res.render("pages/login", { erro: null, valores: { usuarioDigitado:'', senhaDigitada:'' }, sucesso: false });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

/* CADASTRO COMPRADOR (PF) */
router.post("/cadastroUsuario",
  body("nome").trim().notEmpty().withMessage("*Campo obrigatório!").isLength({ min:3, max:50 }).withMessage("*O Nome deve conter entre 3 e 50 caracteres!"),
  body("cpf").custom((value) => { if (validarCPF(value)) return true; throw new Error("CPF inválido!"); }),
  body("email").notEmpty().withMessage("*Campo obrigatório!").isEmail().withMessage("*Endereço de email inválido!"),
  body("senha").notEmpty().withMessage("*Campo obrigatório!").isStrongPassword({ minLowercase:1, minUppercase:1, minNumbers:1, minSymbols:1, minLength:8 }).withMessage("*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!"),
  body("confirmarSenha").notEmpty().withMessage("*Campo obrigatório!").custom((value, { req }) => { if (value !== req.body.senha) throw new Error("*As senhas não conferem!"); return true; }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const erroValidacaoPessoaFisica = {}, msgErroPessoaFisica = {};
      errors.array().forEach(e => { erroValidacaoPessoaFisica[e.path]='erro'; msgErroPessoaFisica[e.path]=e.msg; });
      return res.render("pages/cadastro", {
        valoresPessoaFisica: req.body, erroValidacaoPessoaFisica, msgErroPessoaFisica,
        valoresEmpresa: { nome:'', cnpj:'', email:'', senha:'', confirmarSenha:'' },
        erroValidacaoEmpresa: {}, msgErroEmpresa: {}, formularioAtivo:'farmacia', retorno:null
      });
    }
    try {
      const existing = await usuarioModel.findByEmail(req.body.email);
      if (existing) {
        return res.render("pages/cadastro", {
          valoresPessoaFisica: req.body,
          erroValidacaoPessoaFisica: { email:'erro' }, msgErroPessoaFisica: { email:'*Este e-mail já está cadastrado!' },
          valoresEmpresa: { nome:'', cnpj:'', email:'', senha:'', confirmarSenha:'' },
          erroValidacaoEmpresa: {}, msgErroEmpresa: {}, retorno:null
        });
      }
      const senhaHash = await bcrypt.hash(req.body.senha, 10);
      const result = await usuarioModel.createPF({ nome: req.body.nome, email: req.body.email, senhaHash });
      const cpfNumeros = req.body.cpf.replace(/\D/g, '');
      await usuarioModel.createPessoaFisica(result.insertId, cpfNumeros);
      res.redirect("/login");
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
      res.status(500).send('Erro ao cadastrar. Tente novamente.');
    }
  }
);

/* CADASTRO VENDEDOR (PJ) */
router.post("/cadastroEmpresa",
  body("nome").trim().notEmpty().withMessage("*Campo obrigatório!").isLength({ min:3, max:50 }).withMessage("*O Nome da empresa deve conter entre 3 e 50 caracteres!"),
  body("cnpj").notEmpty().withMessage("*Campo obrigatório!").custom((value) => { if (value.replace(/\D/g,'').length !== 14) throw new Error("*O CNPJ deve conter 14 números!"); return true; }),
  body("email").notEmpty().withMessage("*Campo obrigatório!").isEmail().withMessage("*Endereço de email inválido!"),
  body("senha").notEmpty().withMessage("*Campo obrigatório!").isStrongPassword({ minLowercase:1, minUppercase:1, minNumbers:1, minSymbols:1, minLength:8 }).withMessage("*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!"),
  body("confirmarSenha").notEmpty().withMessage("*Campo obrigatório!").custom((value, { req }) => { if (value !== req.body.senha) throw new Error("*As senhas não conferem!"); return true; }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const erroValidacaoEmpresa = {}, msgErroEmpresa = {};
      errors.array().forEach(e => { erroValidacaoEmpresa[e.path]='erro'; msgErroEmpresa[e.path]=e.msg; });
      return res.render("pages/cadastro_vendedor", { valoresEmpresa: req.body, erroValidacaoEmpresa, msgErroEmpresa, retorno:null });
    }
    try {
      const existing = await usuarioModel.findByEmail(req.body.email);
      if (existing) {
        return res.render("pages/cadastro_vendedor", {
          valoresEmpresa: req.body,
          erroValidacaoEmpresa: { email:'erro' }, msgErroEmpresa: { email:'*Este e-mail já está cadastrado!' }, retorno:null
        });
      }
      const senhaHash = await bcrypt.hash(req.body.senha, 10);
      const result = await usuarioModel.createPJ({ nome: req.body.nome, email: req.body.email, senhaHash });
      const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');
      await usuarioModel.createPessoaJuridica(result.insertId, cnpjNumeros);
      res.redirect("/login");
    } catch (err) {
      console.error('Erro ao cadastrar empresa:', err);
      res.status(500).send('Erro ao cadastrar. Tente novamente.');
    }
  }
);

/* LOGIN COM BANCO */
router.post("/login", async (req, res) => {
  const { usuarioDigitado, senhaDigitada } = req.body;
  try {
    const usuario = await usuarioModel.findByEmail(usuarioDigitado);
    if (!usuario || !(await bcrypt.compare(senhaDigitada, usuario.Senha))) {
      return res.render("pages/login", {
        erro: "*Não reconhecemos estas credenciais. Tente novamente.",
        sucesso: false, valores: { usuarioDigitado, senhaDigitada: '' }
      });
    }

    if (usuario.status === 'suspended') {
      return res.render("pages/login", {
        erro: "⚠️ Sua conta foi suspensa pelo administrador. Entre em contato com o suporte para mais informações.",
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
    return res.redirect("/perfil");
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro interno. Tente novamente.');
  }
});

router.delete('/produtos/:id', requireVendedor, async (req, res) => {
  try {
    await produtosModel.delete(req.params.id);
    res.json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao deletar produto' });
  }
});

router.get("/adm-login", (req, res) => {
  res.render("pages/adm-login");
});

router.post("/adm-login", (req, res) => {
  const { senha } = req.body;

  if (senha === process.env.ADMIN_SECRET) {
    req.session.isAdmin = true;
    return res.redirect("/adm");
  }

  res.send("Senha incorreta");
});

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect("/adm-login");
  }
  next();
}

// ── PERFIL PÚBLICO DO VENDEDOR ────────────────────────────────
router.get("/vendedor/:id", async (req, res) => {
  try {
    const vendedorId = req.params.id;

    const vendedor = await vendedorModel.findById(vendedorId);
    if (!vendedor) return res.status(404).send("Vendedor não encontrado");

    const avgData = await vendedorModel.findMediaAvaliacao(vendedorId);
    vendedor.mediaAvaliacao = avgData.media;
    vendedor.totalAvaliacoes = avgData.total;

    const prodRows = await vendedorModel.findProdutos(vendedorId);
    vendedor.totalVendas = await vendedorModel.findTotalVendas(vendedorId);
    vendedor.totalProdutos = prodRows.length;

    const comentarios = await vendedorModel.findAvaliacoes(vendedorId);

    let jaAvaliou = false;
    let minhaAvaliacao = null;
    if (req.session.userId) {
      minhaAvaliacao = await vendedorModel.findAvaliacaoByAvaliador(vendedorId, req.session.userId);
      if (minhaAvaliacao) jaAvaliou = true;
    }

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    res.render("pages/perfil_vendedor", {
      vendedor,
      produtos: prodRows,
      comentarios,
      jaAvaliou,
      minhaAvaliacao,
      usuario: usuarioSessao
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar perfil do vendedor");
  }
});

// ── AVALIAR VENDEDOR ──────────────────────────────────────────
router.post("/vendedor/:id/avaliar", requireLogin, async (req, res) => {
  const vendedorId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/vendedor/${vendedorId}?erro=nota`);
  }

  if (parseInt(vendedorId) === req.session.userId) {
    return res.redirect(`/vendedor/${vendedorId}?erro=proprio`);
  }

  try {
    const jaAv = await vendedorModel.findAvaliacaoId(vendedorId, req.session.userId);

    if (jaAv) {
      await vendedorModel.updateAvaliacao({ vendedorId, avaliadorId: req.session.userId, nota: notaNum, comentario });
    } else {
      await vendedorModel.createAvaliacao({ vendedorId, avaliadorId: req.session.userId, nota: notaNum, comentario });
    }
    res.redirect(`/vendedor/${vendedorId}?sucesso=1#avaliacoes`);
  } catch (err) {
    console.error(err);
    res.redirect(`/vendedor/${vendedorId}?erro=salvar`);
  }
});

module.exports = router;