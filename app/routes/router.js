var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const pool = require("../../config/pool_conexoes");
const produtosModel = require("../models/models");
const cartModel = require("../models/cartModel");

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/imagem'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
var { validarCPF } = require("../helpers/validacao");

async function getProdutos() {
  try {
    return await produtosModel.findAll();
  } catch (err) {
    console.error('Erro ao buscar produtos:', err.message);
    return [];
  }
}

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
  let produtos = await getProdutos();

  if (busca && busca.trim()) {
    const termo = busca.trim().toLowerCase();
    produtos = produtos.filter(p => p.nome && p.nome.toLowerCase().includes(termo));
  }
  if (estado && estado.trim()) {
    const t = estado.trim().toLowerCase();
    produtos = produtos.filter(p => p.estado && p.estado.toLowerCase().includes(t));
  }
  if (categoria && categoria.trim()) {
    const t = categoria.trim().toLowerCase();
    produtos = produtos.filter(p => p.categoria && p.categoria.toLowerCase().includes(t));
  }
  if (precoMin && !isNaN(precoMin)) {
    produtos = produtos.filter(p => parseFloat(p.preco) >= parseFloat(precoMin));
  }
  if (precoMax && !isNaN(precoMax)) {
    produtos = produtos.filter(p => parseFloat(p.preco) <= parseFloat(precoMax));
  }

  res.render("pages/produtos", {
    produtos,
    usuario: req.session.userId ? { nome: req.session.nomeUsuario, perfil: req.session.perfil } : null,
    filtros: { busca: busca||'', estado: estado||'', categoria: categoria||'', precoMin: precoMin||'', precoMax: precoMax||'' }
  });
});

router.get("/home", (req, res) => res.render("pages/home"));
// Rota para comprador se tornar vendedor
router.get("/upgrade_vendedor", requireLogin, async (req, res) => {
  // Só permite se for comprador
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
  body("company_name").trim().notEmpty().withMessage("*Campo obrigatório!").isLength({ min:3 }).withMessage("*Nome da empresa muito curto"),
  body("cnpj").notEmpty().withMessage("*Campo obrigatório!").custom((value) => { if (value.replace(/\D/g,'').length !== 14) throw new Error("*O CNPJ deve conter 14 números!"); return true; }),
  async (req, res) => {
    // Verifica se é comprador
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
      const [existing] = await pool.query("SELECT Usuario_ID FROM Pessoa_Juridica WHERE CNPJ = ?", [cnpjNumeros]);
      if (existing.length > 0) {
        return res.render("pages/upgrade_vendedor", {
          valoresEmpresa,
          erroValidacaoEmpresa: { cnpj: 'erro' },
          msgErroEmpresa: { cnpj: '*Este CNPJ já está cadastrado!' }
        });
      }

      // Converte usuário para vendedor (PJ) — preserva o Email original de login,
      // apenas muda o Tipo e salva o nome da empresa em Biografia
      await pool.query(
        "UPDATE Usuario SET Tipo = 'PJ', Biografia = ? WHERE Usuario_ID = ?",
        [`Empresa: ${companyName}`, req.session.userId]
      );
      
      // Adiciona registro em Pessoa_Juridica
      await pool.query("INSERT INTO Pessoa_Juridica (Usuario_ID, CNPJ) VALUES (?, ?)", [req.session.userId, cnpjNumeros]);
      
      // Atualiza sessão — email de login permanece o original (req.session.emailUsuario inalterado)
      req.session.perfil = 'vendedor';
      req.session.tipo = 'PJ';
      // req.session.nomeUsuario e req.session.emailUsuario permanecem com os dados originais de cadastro

      return res.redirect('/perfil');
    } catch (err) {
      console.error('Erro ao fazer upgrade para vendedor:', err);
      res.status(500).send('Erro ao fazer upgrade. Tente novamente.');
    }
  }
);
router.get("/minhascompras", requireLogin, (req, res) => res.render("pages/minhascompras"));

// ── Atualizar perfil ──────────────────────────────────────────
router.post("/perfil/atualizar", requireLogin, async (req, res) => {
  const { nome, biografia } = req.body;
  if (!nome || nome.trim().length < 2) {
    return res.json({ sucesso: false, erro: 'Nome muito curto.' });
  }
  try {
    await pool.query(
      "UPDATE Usuario SET Nome = ?, Biografia = ? WHERE Usuario_ID = ?",
      [nome.trim(), biografia || null, req.session.userId]
    );
    req.session.nomeUsuario = nome.trim();
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.json({ sucesso: false, erro: 'Erro ao atualizar.' });
  }
});

router.get("/perfil", requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Usuario WHERE Usuario_ID = ?", [req.session.userId]);
    const usuarioDados = rows[0] || null;
    if (usuarioDados) {
      usuarioDados.perfil = req.session.perfil;
    }
    res.render("pages/perfil", {
      usuario: usuarioDados,
      // sidebar também precisa de usuario
    });
  } catch (err) {
    res.render("pages/perfil", { usuario: null });
  }
});

router.get("/painel", requireLogin, (req, res) => res.render("pages/painel"));
router.get("/meus_produtos", requireLogin, (req, res) => res.render("pages/meus_produtos"));

router.get("/listaprodutos", requireLogin, async (req, res) => {
  const produtos = await getProdutos();
  res.render("pages/listaprodutos", { produtos });
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

    // Busca avaliações reais do banco com JOIN para pegar nome do usuário
    const [avaliacoes] = await pool.query(
      `SELECT a.Avaliacao_ID, a.Nota, a.Comentario, a.criado_em,
              COALESCE(u.Nome, a.nome_usuario, 'Usuário') AS nome_usuario
       FROM Avaliacao a
       LEFT JOIN Usuario u ON u.Usuario_ID = a.Usuario_ID
       WHERE a.Produto_ID = ?
       ORDER BY a.criado_em DESC`,
      [req.params.id]
    );

    // Média das notas
    const mediaNotas = avaliacoes.length
      ? (avaliacoes.reduce((s, a) => s + (a.Nota || 0), 0) / avaliacoes.length).toFixed(1)
      : null;

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    res.render("pages/item", { produto, avaliacoes, mediaNotas, usuario: usuarioSessao });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
});

// ── POST avaliação ────────────────────────────────────────────
router.post("/item/:id/avaliar", requireLogin, async (req, res) => {
  const produtoId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/item/${produtoId}?erro=nota`);
  }

  try {
    // Verifica se usuário já avaliou este produto
    const [jaAvaliou] = await pool.query(
      "SELECT Avaliacao_ID FROM Avaliacao WHERE Usuario_ID = ? AND Produto_ID = ?",
      [req.session.userId, produtoId]
    );

    if (jaAvaliou.length > 0) {
      // Atualiza avaliação existente
      await pool.query(
        "UPDATE Avaliacao SET Nota = ?, Comentario = ?, criado_em = NOW() WHERE Usuario_ID = ? AND Produto_ID = ?",
        [notaNum, comentario || '', req.session.userId, produtoId]
      );
    } else {
      // Nova avaliação
      await pool.query(
        "INSERT INTO Avaliacao (Nota, Comentario, Usuario_ID, Produto_ID, nome_usuario, criado_em) VALUES (?, ?, ?, ?, ?, NOW())",
        [notaNum, comentario || '', req.session.userId, produtoId, req.session.nomeUsuario]
      );
    }

    res.redirect(`/item/${produtoId}#comentarios`);
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.redirect(`/item/${produtoId}?erro=salvar`);
  }
});

/* FIX DO PREÇO: limpa máscara antes de parsear */
router.post("/cadastrar_produto", requireVendedor, upload.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, quantidade, categoria, cidade, bairro, rua, numero, complemento, estado } = req.body;
  const imagem = req.file ? req.file.filename : 'sem-foto.png';
  const local = [cidade, bairro, rua, numero, complemento].filter(Boolean).join(', ');

  // Remove R$, espaços, pontos de milhar; troca vírgula por ponto
  let precoLimpo = (preco || '0').toString().trim()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const precoNumerico = parseFloat(precoLimpo) || 0;

  // Limpa quantidade: remove 't', espaços; troca vírgula por ponto
  let quantidadeLimpa = (quantidade || '0').toString().trim()
    .replace(/ t$/i, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const quantidadeNumerica = parseFloat(quantidadeLimpa) || 0;

  try {
    await produtosModel.create({ nome, descricao, preco: precoNumerico, quantidade: quantidadeNumerica, categoria, local, imagem, estado });
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
      const [existing] = await pool.query("SELECT Usuario_ID FROM Usuario WHERE Email = ?", [req.body.email]);
      if (existing.length > 0) {
        return res.render("pages/cadastro", {
          valoresPessoaFisica: req.body,
          erroValidacaoPessoaFisica: { email:'erro' }, msgErroPessoaFisica: { email:'*Este e-mail já está cadastrado!' },
          valoresEmpresa: { nome:'', cnpj:'', email:'', senha:'', confirmarSenha:'' },
          erroValidacaoEmpresa: {}, msgErroEmpresa: {}, retorno:null
        });
      }
      const senhaHash = await bcrypt.hash(req.body.senha, 10);
      const [result] = await pool.query("INSERT INTO Usuario (Nome, Email, Senha, Tipo) VALUES (?, ?, ?, 'PF')", [req.body.nome, req.body.email, senhaHash]);
      const cpfNumeros = req.body.cpf.replace(/\D/g, '');
      await pool.query("INSERT INTO Pessoa_Fisica (Usuario_ID, CPF) VALUES (?, ?)", [result.insertId, cpfNumeros]);
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
      const [existing] = await pool.query("SELECT Usuario_ID FROM Usuario WHERE Email = ?", [req.body.email]);
      if (existing.length > 0) {
        return res.render("pages/cadastro_vendedor", {
          valoresEmpresa: req.body,
          erroValidacaoEmpresa: { email:'erro' }, msgErroEmpresa: { email:'*Este e-mail já está cadastrado!' }, retorno:null
        });
      }
      const senhaHash = await bcrypt.hash(req.body.senha, 10);
      const [result] = await pool.query("INSERT INTO Usuario (Nome, Email, Senha, Tipo) VALUES (?, ?, ?, 'PJ')", [req.body.nome, req.body.email, senhaHash]);
      const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');
      await pool.query("INSERT INTO Pessoa_Juridica (Usuario_ID, CNPJ) VALUES (?, ?)", [result.insertId, cnpjNumeros]);
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
    const [rows] = await pool.query("SELECT * FROM Usuario WHERE Email = ?", [usuarioDigitado]);
    if (rows.length === 0 || !(await bcrypt.compare(senhaDigitada, rows[0].Senha))) {
      return res.render("pages/login", {
        erro: "*Não reconhecemos estas credenciais. Tente novamente.",
        sucesso: false, valores: { usuarioDigitado, senhaDigitada: '' }
      });
    }
    const usuario = rows[0];
    req.session.userId = usuario.Usuario_ID;
    req.session.nomeUsuario = usuario.Nome;
    req.session.emailUsuario = usuario.Email;
    req.session.perfil = usuario.Tipo === 'PJ' ? 'vendedor' : 'comprador';
    req.session.tipo = usuario.Tipo;
    await pool.query("UPDATE Usuario SET Ultimo_Login = NOW() WHERE Usuario_ID = ?", [usuario.Usuario_ID]);
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

module.exports = router;
