const produtosModel = require('../models/models.js');
const cartModel = require('../models/cartModel');

// GET /carrinho
async function getCarrinho(req, res) {
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);
    // Estoque atual de cada produto (produtos.quantidade), cadastrado pelo
    // vendedor — é o "Disponível" da tela e o limite do botão "+".
    const estoques = await cartModel.estoquePorProduto(cart.map(item => item.productId));
    // A tela mostra a quantidade REAL gravada no banco, normalizada da mesma
    // forma que o checkout (pagamentoController.criarPagamento).
    const itens = cart.map(item => {
      const info = estoques.get(String(item.productId)) || { estoque: null, limite: 1 };
      return {
        ...item,
        estoque: info.estoque,
        limite: info.limite,
        quantidade: cartModel.normalizarQuantidade(item.quantidade, info.limite)
      };
    });
    res.render('pages/carrinho', { cart: itens });
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
    await cartModel.addItem(
      userId,
      { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, estado: produto.estado, quantidade: parseInt(quantidade, 10) || 1 },
      cartModel.limiteDoEstoque(produto.quantidade)
    );
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
    if (!productId || !Number.isInteger(quantidade) || quantidade < 1) {
      return res.status(400).json({ sucesso: false, erro: 'Quantidade inválida.' });
    }

    // Limite = estoque atual do produto cadastrado pelo vendedor.
    const produto = await produtosModel.findById(productId);
    if (!produto) {
      return res.status(404).json({ sucesso: false, erro: 'Produto não encontrado.' });
    }
    const limite = cartModel.limiteDoEstoque(produto.quantidade);
    if (quantidade > limite) {
      return res.status(400).json({ sucesso: false, erro: `Só há ${limite} tonelada(s) disponível(is) deste produto.`, limite });
    }

    const userId = req.session.userId || req.sessionID;
    const gravada = await cartModel.atualizarQuantidade(userId, productId, quantidade, limite);
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
