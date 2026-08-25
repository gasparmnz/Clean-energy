function getHome(req, res) {
  res.render('pages/home');
}

function getTransporte(req, res) {
  res.render('pages/transporte');
}

function getSobreNos(req, res) {
  res.render('pages/sobre_nos');
}

function getAdicioneProduto(req, res) {
  res.render('pages/adicione_produto');
}

function getPainel(req, res) {
  res.render('pages/painel');
}

function getMeusProdutos(req, res) {
  res.render('pages/meus_produtos');
}

module.exports = {
  getHome,
  getTransporte,
  getSobreNos,
  getAdicioneProduto,
  getPainel,
  getMeusProdutos
};
