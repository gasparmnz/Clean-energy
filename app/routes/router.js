var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const usuarios = []; 
const path = require('path');
const multer = require('multer');
const pool = require("../../config/pool_conexoes");
const produtosModel = require("../models/models");

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/imagem'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

var {validarCPF} = require("../helpers/validacao");

async function getProdutos() {
  try {
    return await produtosModel.findAll();
  } catch (err) {
    console.error('Erro ao buscar produtos:', err.message);
    return [];
  }
}

/* produtos - removido array estático, agora busca do banco */

/* ROTAS */
router.get("/", async (req, res) => {
  const produtos = await getProdutos();
  res.render("pages/produtos", {
    produtos,
  });
});

router.get("/produtos", async (req, res) => {
  const produtos = await getProdutos();
  res.render("pages/produtos", { produtos });
});

router.get("/produtoscomconta", async (req, res) => {
  const produtos = await getProdutos();
  const produtos2 = await getProdutos();
  const produtos3 = await getProdutos();
  const produtos4 = await getProdutos();
  const produtos5 = await getProdutos();
  const produtos6 = await getProdutos();
  res.render("pages/produtoscomconta", { 
    produtos, 
    produtos2, 
    produtos3, 
    produtos4, 
    produtos5, 
    produtos6 
  });
});

router.get("/home", (req, res) => {
  res.render("pages/home");
});
router.get("/adicione_produto", (req, res) => {
  res.render("pages/adicione_produto");
});

router.get("/minhascompras", (req, res) => {
  res.render("pages/minhascompras");
});
router.get("/perfil", (req, res) => {
  res.render("pages/perfil");
});
router.get("/painel", (req, res) => {
  res.render("pages/painel");
});
router.get("/meus_produtos", (req, res) => {
  res.render("pages/meus_produtos");
});
router.get("/listaprodutos", async (req, res) => {
  const produtos = await getProdutos();
  res.render("pages/listaprodutos", { produtos });
});

router.get("/carrinho", (req, res) => {
  res.render("pages/carrinho");
});

router.get("/transporte", (req, res) =>{
  res.render("pages/transporte");
});
router.get("/duvidas", (req, res) =>{
  res.render("pages/duvidas");
});
router.get("/sobre_nos", (req, res) => {
  res.render("pages/sobre_nos");
});
router.get("/cadastrar_produto", (req, res) => {
  res.render("pages/cadastrar_produto");
});
router.get("/painel", (req, res) => {
  res.render("pages/painel");
});
router.get("/item/:id", async function (req, res) {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) {
      return res.status(404).send("Produto não encontrado");
    }
    res.render("pages/item", { produto });
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).send('Erro interno do servidor');
  }
});

router.get("/produtoscomconta", async (req, res) => {
  const produtos = await getProdutos();
  
  // Filtrar produtos por cidade (baseado no campo 'local')
  const produtosSP = produtos.filter(p => p.local && p.local.includes('São Paulo'));
  const produtosRJ = produtos.filter(p => p.local && p.local.includes('Rio de Janeiro'));
  const produtosCuritiba = produtos.filter(p => p.local && p.local.includes('Curitiba'));
  const produtosFlorianopolis = produtos.filter(p => p.local && p.local.includes('Florianópolis'));
  const produtosSalvador = produtos.filter(p => p.local && p.local.includes('Salvador'));
  const produtosFortaleza = produtos.filter(p => p.local && p.local.includes('Fortaleza'));
  
  res.render("pages/produtoscomconta", {
    produtos: produtosSP,
    produtos2: produtosRJ,
    produtos3: produtosCuritiba,
    produtos4: produtosFlorianopolis,
    produtos5: produtosSalvador,
    produtos6: produtosFortaleza,
  });
});

router.post("/cadastrar_produto", upload.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, quantidade, categoria, cidade, bairro, rua, numero, complemento } = req.body;
  const imagem = req.file ? req.file.filename : 'sem-foto.png';
  const local = `${cidade || ''}${cidade ? ', ' : ''}${bairro || ''}${bairro ? ', ' : ''}${rua || ''}${rua ? ', ' : ''}${numero || ''}${complemento ? ', ' + complemento : ''}`;

  const precoNumerico = parseFloat((preco || '0').replace(/\./g, '').replace(',', '.')) || 0;

  try {
    await produtosModel.create({
      nome,
      descricao,
      preco: precoNumerico,
      quantidade,
      categoria,
      local,
      imagem
    });
    res.redirect('/listaprodutos');
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).send('Erro ao cadastrar produto. Tente novamente.');
  }
});

/* ROTAS com VALIDAÇÕES */

//cadastro//
router.get("/cadastro", (req, res) => {
  res.render("pages/cadastro", {
    // Usuario normal
    valoresPessoaFisica: {
      // variavel sem valor quando o usuario entra
      nome: "",
      cpf: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
    erroValidacaoPessoaFisica: {}, // sem erro de validacao quando o usuario entra
    msgErroPessoaFisica: {}, // sem mensagem de erro quando o usuario entra

    // Empresa
    valoresEmpresa: {
      // variavel sem valor quando o usuario entra
      nome: "",
      cpf: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
    erroValidacaoEmpresa: {}, // sem erro de validacao quando o usuario entra
    msgErroEmpresa: {}, // sem mensagem de erro quando o usuario entra

    retorno: null,
  });
});

//login//
router.get("/login", (req, res) => {
  res.render("pages/login", {
    erro: null, // sem erro quando o usuario entra
    valores: {
      // variavel sem valor quando o usuario entra
      usuarioDigitado: "",
      senhaDigitada: "",
    },
    sucesso: false,
  });
});

/* =========== VALIDAÇÕES ============ */
//Usuario comum//
router.post(
  "/cadastroUsuario",
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isLength({ min: 3, max: 50 })
    .withMessage("*O Nome deve conter entre 3 e 50 caracteres!"),

    body("cpf")
    .custom((value) => {
        if (validarCPF(value)){
            return true;
        } else {
            throw new Error("CPF inválido!");
        }
    }),

  body("email")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isEmail()
    .withMessage("*Endereço de email inválido!"),

  body("senha")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isStrongPassword({
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLength: 8,
    })
    .withMessage(
      "*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!"
    ),

  body("confirmarSenha")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .custom((value, { req }) => {
      if (value !== req.body.senha) throw new Error("*As senhas não conferem!");
      return true;
    }),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const erroValidacaoPessoaFisica = {};
      const msgErroPessoaFisica = {};
      errors.array().forEach((erro) => {
        erroValidacaoPessoaFisica[erro.path] = "erro";
        msgErroPessoaFisica[erro.path] = erro.msg;
      });

      return res.render("pages/cadastro", {
        valoresPessoaFisica: req.body,
        erroValidacaoPessoaFisica,
        msgErroPessoaFisica,

        valoresEmpresa: {
          nome: "",
          cnpj: "",
          email: "",
          senha: "",
          confirmarSenha: "",
        },
        erroValidacaoEmpresa: {},
        msgErroEmpresa: {},

        formularioAtivo: "farmacia",
      });
    }

    usuarios.push({ email: req.body.email, senha: req.body.senha });
    res.redirect("/login");
  }
);

//Empresas//
router.post(
  "/cadastroEmpresa",
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isLength({ min: 3, max: 50 })
    .withMessage("*O Nome da empresa deve conter entre 3 e 50 caracteres!"),

  body("cnpj")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .custom((value) => {
      const apenasNumeros = value.replace(/[^\d]+/g, "");
      if (apenasNumeros.length !== 14)
        throw new Error("*O CNPJ deve conter 14 números!");
      if (!validarCNPJ(value)) throw new Error("*CNPJ inválido!");
      return true;
    }),

  body("email")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isEmail()
    .withMessage("*Endereço de email inválido!"),

  body("senha")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .isStrongPassword({
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minLength: 8,
    })
    .withMessage(
      "*Sua senha deve conter pelo menos: uma letra maiúscula, um número e um caractere especial!"
    ),

  body("confirmarSenha")
    .notEmpty()
    .withMessage("*Campo obrigatório!")
    .custom((value, { req }) => {
      if (value !== req.body.senha) throw new Error("*As senhas não conferem!");
      return true;
    }),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const erroValidacaoEmpresa = {};
      const msgErroEmpresa = {};
      errors.array().forEach((erro) => {
        erroValidacaoEmpresa[erro.path] = "erro";
        msgErroEmpresa[erro.path] = erro.msg;
      });

      return res.render("pages/cadastro", {
        valoresEmpresa: req.body,
        erroValidacaoEmpresa,
        msgErroEmpresa,

        valoresPessoaFisica: {
          nome: "",
          cpf: "",
          email: "",
          senha: "",
          confirmarSenha: "",
        },
        erroValidacaoPessoaFisica: {},
        msgErroPessoaFisica: {},

        formularioAtivo: "empresa",
      });
    }

    usuarios.push({ email: req.body.email, senha: req.body.senha });
    res.redirect("/login");
  }
);

//login//
router.post("/login", (req, res) => {
  const { usuarioDigitado, senhaDigitada } = req.body;

  const usuarioEncontrado = usuarios.find(
    (u) => u.email === usuarioDigitado && u.senha === senhaDigitada
  );

  if (usuarioEncontrado) {
    return res.redirect("/perfil");
  } else {
    return res.render("pages/login", {
      erro: "*Não reconhecemos estas credenciais. Tente novamente.",
      sucesso: false,
      valores: {
        usuarioDigitado: usuarioDigitado,
        senhaDigitada: senhaDigitada,
      },
    });
  }
});
/* ========== FIM DAS VALIDAÇÕES ========= */

// Rota para deletar produto
router.delete('/produtos/:id', async (req, res) => {
  try {
    const produtoId = req.params.id;
    await produtosModel.delete(produtoId);
    res.json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ success: false, message: 'Erro ao deletar produto' });
  }
});

module.exports = router;
