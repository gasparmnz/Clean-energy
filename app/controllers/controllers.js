const express = require('express');
const path = require('path');
const multer = require('multer');
const produtosModel = require('../models/models.js');

const router = express.Router();

// Multer config: salva em app/public/imagem
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

// Rota: página de cadastro
router.get('/cadastrar_produto', (req, res) => {
  res.render('pages/cadastrar_produto');
});

// Rota: processa cadastro (multipart/form-data)
router.post('/cadastrar_produto', upload.single('imagem'), async (req, res) => {
  try {
    const body = req.body;
    // monta campo local a partir do endereço (ajuste conforme seu form)
    const local = [
      body.cidade || '',
      body.bairro || '',
      body.rua || '',
      body.numero || ''
    ].filter(Boolean).join(' - ');

    // Converter preço de formato brasileiro (1.000,00) para número decimal
    let precoFormatado = (body.preco || '0').trim();
    // Remove espaços
    precoFormatado = precoFormatado.replace(/\s/g, '');
    // Remove "R$" se existir
    precoFormatado = precoFormatado.replace(/R\$\s*/g, '');
    // Converte formato brasileiro para número
    // Primeiro remove todos os pontos, depois troca vírgula por ponto
    precoFormatado = precoFormatado.replace(/\./g, '').replace(',', '.');
    const precoNumerico = parseFloat(precoFormatado) || 0;

    const produto = {
      nome: body.nome,
      descricao: body.descricao,
      preco: precoNumerico,
      quantidade: body.quantidade,
      categoria: body.categoria,
      local,
      imagem: req.file ? req.file.filename : null
    };

    await produtosModel.create(produto);
    res.redirect('/produtos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao cadastrar produto');
  }
});

// Rota: lista produtos
router.get('/produtos', async (req, res) => {
  try {
    const produtos = await produtosModel.findAll();
    res.render('pages/produtos', { produtos });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter produtos');
  }
});

// Rota: detalhe do item
router.get('/item/:id', async (req, res) => {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) return res.status(404).send('Produto não encontrado');
    // criar view pages/item.ejs ou reutilizar produtos.ejs conforme necessário
    res.render('pages/item', { produto });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter produto');
  }
});

module.exports = router;