const express = require('express');
const path = require('path');
const multer = require('multer');
const produtosModel = require('../models/models.js');
const cartModel = require('../models/cartModel');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'imagem'));
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${ts}${ext}`);
  }
});
const upload = multer({ storage });

// Página de cadastro
router.get('/cadastrar_produto', (req, res) => {
  res.render('pages/cadastrar_produto');
});

// Processa cadastro
router.post('/cadastrar_produto', upload.single('imagem'), async (req, res) => {
  try {
    const body = req.body;
    const local = [body.cidade || '', body.bairro || '', body.rua || '', body.numero || '']
      .filter(Boolean).join(' - ');

    let precoFormatado = (body.preco || '0').trim()
      .replace(/\s/g, '')
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const precoNumerico = parseFloat(precoFormatado) || 0;

    const produto = {
      nome: body.nome,
      descricao: body.descricao,
      preco: precoNumerico,
      quantidade: body.quantidade,
      categoria: body.categoria,
      local,
      imagem: req.file ? `/imagem/${req.file.filename}` : null,
      estado: body.estado || null   // estado = UF (SP, RJ...)
    };

    await produtosModel.create(produto);
    res.redirect('/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar produto');
  }
});

// Lista produtos para clientes
router.get('/produtos', async (req, res) => {
  try {
    const produtos = await produtosModel.findAll({ apenasAtivos: true });
    res.render('pages/produtos', { produtos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter produtos');
  }
});

// Detalhe do item
router.get('/item/:id', async (req, res) => {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) return res.status(404).send('Produto não encontrado');
    if (produto.status === 'suspended') return res.status(404).send('Produto não disponível');
    res.render('pages/item', { produto });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter produto');
  }
});

// Carrinho
router.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantidade } = req.body;
    const qty = parseInt(quantidade, 10) || 1;

    const produto = await produtosModel.findById(productId);
    if (!produto) return res.status(404).send('Produto não encontrado');
    if (produto.status === 'suspended') return res.status(400).send('Produto não disponível');

    const item = {
      productId,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      local: produto.local,
      quantidade: qty
    };

    const userId = req.session?.userId || 'guest';
    await cartModel.addItem(userId, item);
    res.redirect('/carrinho');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao adicionar ao carrinho');
  }
});

router.get('/carrinho', async (req, res) => {
  try {
    const userId = req.session?.userId || 'guest';
    const cart = await cartModel.getCartByUser(userId);
    res.render('pages/carrinho', { cart });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter carrinho');
  }
});

router.post('/cart/remove', async (req, res) => {
  try {
    const userId = req.session?.userId || 'guest';
    const { index } = req.body;
    await cartModel.removeByIndex(userId, parseInt(index));
    res.redirect('/carrinho');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao remover do carrinho');
  }
});

module.exports = router;
