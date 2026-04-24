var express = require("express");
var router = express.Router();
const pool = require("../../config/pool_conexoes");
const produtosModel = require("../models/models.js");

// Admin dashboard
router.get("/", async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM Usuario");
    const [[{ totalProducts }]] = await pool.query("SELECT COUNT(*) AS totalProducts FROM produtos");
    res.render("pages/adm", { totals: { users: totalUsers || 0, products: totalProducts || 0 } });
  } catch (err) {
    console.error('Erro ao carregar dashboard admin', err);
    res.render("pages/adm", { totals: { users: 0, products: 0 } });
  }
});

// Lista usuários cadastrados
router.get("/usuarios_cadastrados", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT Usuario_ID AS id, Nome AS nome, Email AS email, Tipo, Data_Criacao FROM Usuario ORDER BY Data_Criacao DESC");
    res.render("pages/usuarios_cadastrados", { usuarios: users });
  } catch (err) {
    console.error('Erro ao obter usuários', err);
    res.render("pages/usuarios_cadastrados", { usuarios: [] });
  }
});

// Lista produtos para o admin (vê todos, ativos e suspensos)
router.get("/produtos_adm", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, descricao, preco, quantidade, categoria, local, imagem, estado, status FROM produtos ORDER BY created_at DESC"
    );
    const produtos = rows.map(p => ({
      id: `PROD-${p.id}`,
      dbId: p.id,
      name: p.nome,
      description: p.descricao || '',
      price: Number(p.preco) || 0,
      stock: p.quantidade || 0,
      status: p.status || 'active',
      image: p.imagem || '/imagem/placeholder.png',
      categoria: p.categoria || null,
      local: p.local || null
    }));
    res.render('pages/produtos_adm', { produtos });
  } catch (err) {
    console.error('Erro ao obter produtos', err);
    res.render('pages/produtos_adm', { produtos: [] });
  }
});

// Alterna status do produto (active <-> suspended)
router.post("/produtos_adm/toggle_status", async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    const numericId = String(id).replace(/^PROD-/i, '');
    await produtosModel.updateStatus(numericId, status);
    res.json({ success: true, id, status });
  } catch (err) {
    console.error('Erro ao alterar status do produto', err);
    res.status(500).json({ error: 'Erro interno ao alterar status' });
  }
});

// Edita dados do produto (nome, descrição, preço, estoque)
router.post("/produtos_adm/edit", async (req, res) => {
  try {
    const { id, name, description, price, stock } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    const numericId = String(id).replace(/^PROD-/i, '');
    await produtosModel.update(numericId, {
      nome: name,
      descricao: description,
      preco: parseFloat(price) || 0,
      quantidade: parseInt(stock) || 0
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao editar produto', err);
    res.status(500).json({ error: 'Erro interno ao editar produto' });
  }
});

// Detalhes do usuário
router.get("/detalhes_user", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.render('pages/detalhes_user', { usuario: null });
    const numeric = userId.match(/(\d+)$/);
    const idToQuery = numeric ? Number(numeric[1]) : Number(userId);
    if (Number.isNaN(idToQuery)) return res.render('pages/detalhes_user', { usuario: null });

    const [rows] = await pool.query(
      'SELECT Usuario_ID AS id, Nome, Email, Tipo, Data_Criacao, Ultimo_Login FROM Usuario WHERE Usuario_ID = ?',
      [idToQuery]
    );
    const usuario = rows[0] || null;
    res.render('pages/detalhes_user', { usuario });
  } catch (err) {
    console.error('Erro ao obter detalhes do usuário', err);
    res.render('pages/detalhes_user', { usuario: null });
  }
});

module.exports = router;
