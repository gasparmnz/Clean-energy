var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const usuarios = []; 


var {validarCPF} = require("../helpers/validacao");

/* produtos */
const produtos = [
  {
    id: 1,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao:
      "Lenha tratada com baixa umidade, ideal para geração de energia.",
  },
  {
    id: 2,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Guarulhos - SP",
    imagem: "cascadearroz.png",
    descricao:
      "Casca de arroz limpa, excelente para uso em caldeiras de biomassa.",
  },
  {
    id: 3,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Socorro - SP",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa.",
  },
  {
    id: 4,
    nome: "Serragem",
    preco: 350,
    local: "Sorocaba - SP",
    imagem: "serragem.png",
    descricao:
      "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa.",
  },
  {
    id: 5,
    nome: "Resto de colheita",
    preco: 380,
    local: "Santo André - SP",
    imagem: "restodecolheita.png",
    descricao:
      "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável.",
  },
  {
    id: 6,
    nome: "Pallets",
    preco: 1000,
    local: "Ribeirão Preto - SP",
    imagem: "pellets.png",
    descricao:
      "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis.",
  },
];
const produtos2 = [
  {
    id: 101,
    nome: "Resíduos de café",
    preco: 700,
    local: "Rio de janeiro - RJ",
    imagem: "residuosdecafe.png",
    descricao:
      "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo.",
  },
  {
    id: 102,
    nome: "Palha de milho",
    preco: 220,
    local: "São Gonçalo - RJ",
    imagem: "palhademilho.png",
    descricao:
      "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável.",
  },
  {
    id: 103,
    nome: "Lixo Orgânico",
    preco: 450,
    local: "Nova Iguaçu - RJ",
    imagem: "lixo organico.png",
    descricao:
      "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal.",
  },
  {
    id: 104,
    nome: "Lenha tratada",
    preco: 250,
    local: "Niterói - RJ",
    imagem: "Lenha.png",
    descricao:
      "Lenha tratada com baixa umidade, ideal para geração de energia.",
  },
  {
    id: 105,
    nome: "Serragem",
    preco: 350,
    local: "Bangu - RJ",
    imagem: "serragem.png",
    descricao:
      "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa.",
  },
  {
    id: 106,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Volta Redonda - RJ",
    imagem: "cascadearroz.png",
    descricao:
      "Casca de arroz limpa, excelente para uso em caldeiras de biomassa.",
  },
];
const produtos3 = [
  {
    id: 201,
    nome: "Lenha tratada",
    preco: 250,
    local: "Mandirituba - CWB",
    imagem: "Lenha.png",
    descricao:
      "Lenha tratada com baixa umidade, ideal para geração de energia.",
  },
  {
    id: 202,
    nome: "Lixo orgânico",
    preco: 450,
    local: "Pinhais - CWB",
    imagem: "lixo organico.png",
    descricao:
      "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal.",
  },
  {
    id: 203,
    nome: "Resíduos de café",
    preco: 700,
    local: "Curitiba - CWB",
    imagem: "residuosdecafe.png",
    descricao:
      "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo.",
  },
  {
    id: 204,
    nome: "Palha de milho",
    preco: 220,
    local: "Maringá - CWB",
    imagem: "palhademilho.png",
    descricao:
      "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável.",
  },
  {
    id: 205,
    nome: "Resto de colheita",
    preco: 380,
    local: "São José dos Pinhais - CWB",
    imagem: "restodecolheita.png",
    descricao:
      "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável.",
  },
  {
    id: 206,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Fazenda Rio Grande - CWB",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa.",
  },
];
const produtos4 = [
  {
    id: 301,
    nome: "Folhas secas",
    preco: 180,
    local: "Palhoça - FLN",
    imagem: "folhassecas.png",
    descricao:
      "Folhas secas urbanas, apropriadas para compostagem ou produção de biomassa vegetal leve.",
  },
  {
    id: 302,
    nome: "Lixo orgânico",
    preco: 450,
    local: "São José - FLN",
    imagem: "lixo organico.png",
    descricao:
      "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal.",
  },
  {
    id: 303,
    nome: "Resíduos de café",
    preco: 700,
    local: "Biguaçu - FLN",
    imagem: "residuosdecafe.png",
    descricao:
      "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo.",
  },
  {
    id: 304,
    nome: "Lenha tratada",
    preco: 250,
    local: "Santo Amaro da Imperatriz - FLN",
    imagem: "Lenha.png",
    descricao:
      "Lenha tratada com baixa umidade, ideal para geração de energia.",
  },
  {
    id: 305,
    nome: "Serragem",
    preco: 350,
    local: "Florianópolis - FLN",
    imagem: "serragem.png",
    descricao:
      "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa.",
  },
  {
    id: 306,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Governador Celso Ramos - FLN",
    imagem: "cascadearroz.png",
    descricao:
      "Casca de arroz limpa, excelente para uso em caldeiras de biomassa.",
  },
];
const produtos5 = [
  {
    id: 401,
    nome: "Lenha tratada",
    preco: 250,
    local: "Itaparica - SSA",
    imagem: "Lenha.png",
    descricao:
      "Lenha tratada com baixa umidade, ideal para geração de energia.",
  },
  {
    id: 402,
    nome: "Pallets",
    preco: 1000,
    local: "Salvador - SSA",
    imagem: "pellets.png",
    descricao:
      "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis.",
  },
  {
    id: 403,
    nome: "Palha de milho",
    preco: 220,
    local: "Pojuca - SSA",
    imagem: "palhademilho.png",
    descricao:
      "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável.",
  },
  {
    id: 404,
    nome: "Serragem",
    preco: 350,
    local: "Camaçari - SSA",
    imagem: "serragem.png",
    descricao:
      "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa.",
  },
  {
    id: 405,
    nome: "Resto de Colheita",
    preco: 380,
    local: "Candeias - SSA",
    imagem: "restodecolheita.png",
    descricao:
      "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável.",
  },
  {
    id: 406,
    nome: "Folhas secas",
    preco: 180,
    local: "Simões Filho - SSA",
    imagem: "folhassecas.png",
    descricao:
      "Folhas secas urbanas, apropriadas para compostagem ou produção de biomassa vegetal leve.",
  },
];
const produtos6 = [
  {
    id: 501,
    nome: "Pallets",
    preco: 1000,
    local: "Cascavel - FOR",
    imagem: "pellets.png",
    descricao:
      "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis.",
  },
  {
    id: 502,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Aquiraz - FOR",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa.",
  },
  {
    id: 503,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Itaitinga - FOR",
    imagem: "cascadearroz.png",
    descricao:
      "Casca de arroz limpa, excelente para uso em caldeiras de biomassa.",
  },
  {
    id: 504,
    nome: "Serragem",
    preco: 350,
    local: "Paracuru - FOR",
    imagem: "serragem.png",
    descricao:
      "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa.",
  },
  {
    id: 505,
    nome: "Resíduos de café",
    preco: 700,
    local: "Fortaleza - FOR",
    imagem: "residuosdecafe.png",
    descricao:
      "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo.",
  },
  {
    id: 506,
    nome: "Palha de milho",
    preco: 220,
    local: "Caucaia - FOR",
    imagem: "palhademilho.png",
    descricao:
      "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável.",
  },
];
/* --------- */

/* ROTAS */
router.get("/", (req, res) => {
  res.render("pages/produtos", {
    produtos,
    produtos2,
    produtos3,
    produtos4,
    produtos5,
    produtos6,
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
router.get("/meus_produtos", (req, res) => {
  res.render("pages/meus_produtos");
});
router.get("/listaprodutos", (req, res) => {
  res.render("pages/listaprodutos");
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
router.get("/item/:id", function (req, res) {
  const id = parseInt(req.params.id);
  const produto = [
    ...produtos,
    ...produtos2,
    ...produtos3,
    ...produtos4,
    ...produtos5,
    ...produtos6,
  ].find((p) => p.id === id);

  if (!produto) {
    return res.status(404).send("Produto não encontrado");
  }

  res.render("pages/item", { produto });
});

router.get("/produtoscomconta", (req, res) => {
  res.render("pages/produtoscomconta", {
    produtos,
    produtos2,
    produtos3,
    produtos4,
    produtos5,
    produtos6,
  });
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

module.exports = router;
