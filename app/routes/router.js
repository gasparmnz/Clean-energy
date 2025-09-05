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
  }
];

router.get('/', function(req, res) {
  res.render('pages/produtos', { produtos });
});

router.get('/home', function(req, res) {
  res.render('pages/home');
});

router.get('/item/:id', function(req, res) {
  const id = parseInt(req.params.id);
  const produto = produtos.find(p => p.id === id);

  if (!produto) {
    return res.status(404).send("Produto não encontrado");
  }

  res.render('pages/item', { produto });
});

module.exports = router;
