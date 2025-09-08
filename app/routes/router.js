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
    local: "RJ",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 102,
    nome: "Palha de milho",
    preco: 250,
    local: "São Paulo - SP",
    imagem: "palhademilho.png",
    descricao: "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável."
  },
  {
    id: 103,
    nome: "Lenha tratada",
    preco: 250,
    local: "Campinas - SP",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
];

router.get('/', function(req, res) {
  res.render('pages/produtos', { produtos, produtos2 });
});

router.get('/home', function(req, res) {
  res.render('pages/home');
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
