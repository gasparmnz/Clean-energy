var express = require('express');
var router = express.Router();

const produtos = [
  {
    id: 1,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
  {
    id: 2,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Guarulhos - SP",
    imagem: "cascadearroz.png",
    descricao: "Casca de arroz limpa, excelente para uso em caldeiras de biomassa."
  },
  {
    id: 3,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Socorro - SP",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa."
  },
  {
    id: 4,
    nome: "Serragem",
    preco: 350,
    local: "Sorocaba - SP",
    imagem: "serragem.png",
    descricao: "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa."
  },
  {
    id: 5,
    nome: "Resto de colheita",
    preco: 380,
    local: "Santo André - SP",
    imagem: "restodecolheita.png",
    descricao: "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável."
  },
  {
    id: 6,
    nome: "Pallets",
    preco: 1000,
    local: "Ribeirão Preto - SP",
    imagem: "pellets.png",
    descricao: "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis."
  },
];

const produtos2 = [
  {
    id: 101,
    nome: "Resíduos de café",
    preco: 650,
    local: "Rio de janeiro - RJ",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 102,
    nome: "Palha de milho",
    preco: 250,
    local: "São Gonçalo - RJ",
    imagem: "palhademilho.png",
    descricao: "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável."
  },
  {
    id: 103,
    nome: "Lixo Orgânico",
    preco: 450,
    local: "Nova Iguaçu - RJ",
    imagem: "lixo organico.png",
    descricao: "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal."
  },
  {
    id: 104,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  }
];

const produtos3 = [
  {
    id: 201,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
  {
    id: 202,
    nome: "Lixo orgânico",
    preco: 450,
    local: "Pinhais - CWB",
    imagem: "lixo organico.png",
    descricao: "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal."
  },
];

const produtos4 = [
  {
    id: 301,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
];

const produtos5 = [
  {
    id: 401,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
];

const produtos6 = [
  {
    id: 401,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
];

router.get('/', (req, res) => {
  res.render('pages/produtos', { produtos, produtos2, produtos3, produtos4, produtos5, produtos6 });
});

router.get('/home', (req, res) => {
  res.render('pages/home');
});

router.get('/adicione_produto', (req, res) => {
  res.render('pages/adicione_produto');
});

router.get('/perfil', (req, res) => {
  res.render('pages/perfil');
});

router.get('/meus_produtos', (req, res) => {
  res.render('pages/meus_produtos');
});

router.get('/cadastro', (req, res) => {
  res.render('pages/cadastro');
});

router.post('/cadastro', (req, res) => {
  const { documento, nome, email, senha } = req.body;

  console.log('Cadastro recebido:', { documento, nome, email, senha });

  res.redirect('/');
});
//login//
router.get('/login', (req, res) => {
  res.render('pages/login');
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  console.log('Login recebido:', { email, senha });

  res.redirect('/');
});


router.get('/item/:id', function(req, res) {
  const id = parseInt(req.params.id);
  const produto = [...produtos, ...produtos2].find(p => p.id === id);

  if (!produto) {
    return res.status(404).send("Produto não encontrado");
  }

  res.render('pages/item', { produto });
});



module.exports = router;
