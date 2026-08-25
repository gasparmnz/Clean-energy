const produtosModel = require('../models/models.js');
const cartModel = require('../models/cartModel');

// GET /carrinho
async function getCarrinho(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);
    res.render('pages/carrinho', { cart });
  } catch (err) {
    res.status(500).send('Erro ao obter carrinho');
  }
}

// POST /cart/add
async function addToCart(req, res) {
  try {
    const { productId, quantidade } = req.body;
    const produto = await produtosModel.findById(productId);
    if (!produto) return res.status(404).send('Produto não encontrado');
    const userId = req.session.userId || req.sessionID;
    await cartModel.addItem(userId, { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, quantidade: parseInt(quantidade, 10) || 1 });
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao adicionar ao carrinho: ' + err.message);
  }
}

// POST /cart/remove
async function removeFromCart(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    await cartModel.removeByIndex(userId, parseInt(req.body.index));
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao remover do carrinho');
  }
}

module.exports = { getCarrinho, addToCart, removeFromCart };
