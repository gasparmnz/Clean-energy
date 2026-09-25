const produtosModel = require('../models/models.js');
const cartModel = require('../models/cartModel');

// GET /carrinho
async function getCarrinho(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);
    // A tela mostra a quantidade REAL gravada no banco (antes sempre
    // mostrava 1, enquanto o checkout usava a quantidade do banco).
    const itens = cart.map(item => ({ ...item, quantidade: cartModel.normalizarQuantidade(item.quantidade) }));
    res.render('pages/carrinho', { cart: itens, qtdMaxima: cartModel.QTD_MAXIMA });
    // Garante que a imagem exibida é a atual do produto (itens antigos podem estar sem imagem)
    await Promise.all(cart.map(async (item) => {
      const produto = await produtosModel.findById(item.productId).catch(() => null);
      if (produto && produto.imagem) item.imagem = produto.imagem;
    }));
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
    await cartModel.addItem(userId, { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, estado: produto.estado, quantidade: parseInt(quantidade, 10) || 1 });
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao adicionar ao carrinho: ' + err.message);
  }
}

// POST /cart/quantidade — { productId, quantidade } (JSON)
// Persiste a quantidade escolhida nos botões + e − do carrinho e devolve o
// valor gravado, que a tela passa a exibir.
async function updateQuantity(req, res) {
  try {
    const { productId } = req.body || {};
    const quantidade = parseInt(req.body && req.body.quantidade, 10);
    if (!productId || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > cartModel.QTD_MAXIMA) {
      return res.status(400).json({ sucesso: false, erro: `Quantidade inválida (de 1 a ${cartModel.QTD_MAXIMA}).` });
    }

    const userId = req.session.userId || req.sessionID;
    const gravada = await cartModel.atualizarQuantidade(userId, productId, quantidade);
    if (gravada === null) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado no carrinho.' });
    }
    res.json({ sucesso: true, productId: String(productId), quantidade: gravada });
  } catch (err) {
    console.error('Erro ao atualizar quantidade do carrinho:', err);
    res.status(500).json({ sucesso: false, erro: 'Não foi possível atualizar a quantidade.' });
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

module.exports = { getCarrinho, addToCart, removeFromCart, updateQuantity };
