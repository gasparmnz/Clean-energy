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
    preco: 700,
    local: "Rio de janeiro - RJ",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 102,
    nome: "Palha de milho",
    preco: 220,
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
    local: "Niterói - RJ",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
  {
    id: 105,
    nome: "Serragem",
    preco: 350,
    local: "Bangu - RJ",
    imagem: "serragem.png",
    descricao: "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa."
  },
  {
    id: 106,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Volta Redonda - RJ",
    imagem: "cascadearroz.png",
    descricao: "Casca de arroz limpa, excelente para uso em caldeiras de biomassa."
  },
];
 
const produtos3 = [
  {
    id: 201,
    nome: "Lenha tratada",
    preco: 250,
    local: "Mandirituba - CWB",
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
  {
    id: 203,
    nome: "Resíduos de café",
    preco: 700,
    local: "Curitiba - CWB",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 204,
    nome: "Palha de milho",
    preco: 220,
    local: "Maringá - CWB",
    imagem: "palhademilho.png",
    descricao: "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável."
  },
  {
    id: 205,
    nome: "Resto de colheita",
    preco: 380,
    local: "São José dos Pinhais - CWB",
    imagem: "restodecolheita.png",
    descricao: "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável."
  },
  {
    id: 206,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Fazenda Rio Grande - CWB",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa."
  },
];
 
const produtos4 = [
  {
    id: 301,
    nome: "Folhas secas",
    preco: 180,
    local: "Palhoça - FLN",
    imagem: "folhassecas.png",
    descricao: "Folhas secas urbanas, apropriadas para compostagem ou produção de biomassa vegetal leve."
  },
  {
    id: 302,
    nome: "Lixo orgânico",
    preco: 450,
    local: "São José - FLN",
    imagem: "lixo organico.png",
    descricao: "O lixo orgânico pode ser usado na produção de biomassa, um tipo de matéria orgânica de origem vegetal ou animal."
  },
  {
    id: 303,
    nome: "Resíduos de café",
    preco: 700,
    local: "Biguaçu - FLN",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 304,
    nome: "Lenha tratada",
    preco: 250,
    local: "Santo Amaro da Imperatriz - FLN",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
  {
    id: 305,
    nome: "Serragem",
    preco: 350,
    local: "Florianópolis - FLN",
    imagem: "serragem.png",
    descricao: "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa."
  },
  {
    id: 306,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Governador Celso Ramos - FLN",
    imagem: "cascadearroz.png",
    descricao: "Casca de arroz limpa, excelente para uso em caldeiras de biomassa."
  },
];
 
const produtos5 = [
  {
    id: 401,
    nome: "Lenha tratada",
    preco: 250,
    local: "Itaparica - SSA",
    imagem: "Lenha.png",
    descricao: "Lenha tratada com baixa umidade, ideal para geração de energia."
  },
  {
    id: 402,
    nome: "Pallets",
    preco: 1000,
    local: "Salvador - SSA",
    imagem: "pellets.png",
    descricao: "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis."
  },
  {
    id: 403,
    nome: "Palha de milho",
    preco: 220,
    local: "Pojuca - SSA",
    imagem: "palhademilho.png",
    descricao: "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável."
  },
  {
    id: 404,
    nome: "Serragem",
    preco: 350,
    local: "Camaçari - SSA",
    imagem: "serragem.png",
    descricao: "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa."
  },
  {
    id: 405,
    nome: "Resto de Colheita",
    preco: 380,
    local: "Candeias - SSA",
    imagem: "restodecolheita.png",
    descricao: "Resto de colheita rico em biomassa, excelente para compostagem e produção de energia renovável."
  },
  {
    id: 406,
    nome: "Folhas secas",
    preco: 180,
    local: "Simões Filho - SSA",
    imagem: "folhassecas.png",
    descricao: "Folhas secas urbanas, apropriadas para compostagem ou produção de biomassa vegetal leve."
  },
];
 
const produtos6 = [
  {
    id: 501,
    nome: "Pallets",
    preco: 1000,
    local: "Cascavel - FOR",
    imagem: "pellets.png",
    descricao: "Pallets de madeira reutilizáveis, ideais para soluções sustentáveis."
  },
  {
    id: 502,
    nome: "Bagaço de cana",
    preco: 150,
    local: "Aquiraz - FOR",
    imagem: "cana.png",
    descricao: "Bagaço de cana fresco, ideal para geração de energia limpa."
  },
  {
    id: 503,
    nome: "Casca de arroz",
    preco: 1275,
    local: "Itaitinga - FOR",
    imagem: "cascadearroz.png",
    descricao: "Casca de arroz limpa, excelente para uso em caldeiras de biomassa."
  },
  {
    id: 504,
    nome: "Serragem",
    preco: 350,
    local: "Paracuru - FOR",
    imagem: "serragem.png",
    descricao: "Serragem seca e uniforme, perfeita para briquetes e geração de energia biomassa."
  },
  {
    id: 505,
    nome: "Resíduos de café",
    preco: 700,
    local: "Fortaleza - FOR",
    imagem: "residuosdecafe.png",
    descricao: "Resíduos de café reciclados, ideais para produção de energia limpa e fertilização do solo."
  },
  {
    id: 506,
    nome: "Palha de milho",
    preco: 220,
    local: "Caucaia - FOR",
    imagem: "palhademilho.png",
    descricao: "Palha de milho seca e versátil, ideal para ração, cobertura do solo e produção de energia renovável."
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

router.get('/listaprodutos', (req, res) => {
  res.render('pages/listaprodutos');
});

router.get('/cadastrar_produto', (req, res) => {
  res.render('pages/cadastrar_produto');
});

router.get('/cadastro', (req, res) => {
  res.render('pages/cadastro');
});

router.get('/produtoscomconta', (req, res) => {
  res.render('pages/produtoscomconta', { produtos, produtos2, produtos3, produtos4, produtos5, produtos6 });
});


router.post('/cadastro', (req, res) => {
  const { documento, nome, email, senha } = req.body;

  console.log('Cadastro recebido:', { documento, nome, email, senha });

  res.redirect('/perfil');
});
//login//
router.get('/login', (req, res) => {
  res.render('pages/login');
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  console.log('Login recebido:', { email, senha });

  res.redirect('/perfil');
});


router.get('/item/:id', function(req, res) {
  const id = parseInt(req.params.id);
  const produto = [...produtos, ...produtos2, ...produtos3, ...produtos4, ...produtos5, ...produtos6].find(p => p.id === id);

  if (!produto) {
    return res.status(404).send("Produto não encontrado");
  }

  res.render('pages/item', { produto });
});



module.exports = router;
