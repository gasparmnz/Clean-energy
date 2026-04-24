var express = require("express");
var router = express.Router();
const pool = require("../../config/pool_conexoes");

// Admin dashboard (basic)
router.get("/", async (req, res) => {
  try {
    // counts for dashboard summary
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM Usuario");
    const [[{ totalProducts }]] = await pool.query("SELECT COUNT(*) AS totalProducts FROM produtos");
    res.render("pages/adm", { totals: { users: totalUsers || 0, products: totalProducts || 0 } });
  } catch (err) {
    console.error('Erro ao carregar dashboard admin', err);
    // render without totals on error
    res.render("pages/adm", { totals: { users: 0, products: 0 } });
  }
});

// Lista usuários cadastrados
router.get("/usuarios_cadastrados", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT Usuario_ID AS id, Nome AS nome, Email AS email, Tipo, Data_Criacao FROM Usuario ORDER BY Data_Criacao DESC");
    // NOTE: produtos table currently doesn't reference Usuario_ID; if you add ownership later, adapt this query.
    res.render("pages/usuarios_cadastrados", { usuarios: users });
  } catch (err) {
    console.error('Erro ao obter usuários', err);
    res.render("pages/usuarios_cadastrados", { usuarios: [] });
  }
});

// Lista produtos para o admin
router.get("/produtos_adm", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nome, descricao, preco, quantidade, categoria, local, imagem, estado FROM produtos ORDER BY created_at DESC");
    // map rows to structure expected by produtos_adm.js (id string, name, description, price, stock, status, image)
    const produtos = rows.map(p => ({
      id: `PROD-${p.id}`,
      name: p.nome,
      description: p.descricao || '',
      price: Number(p.preco) || 0,
      stock: p.quantidade || 0,
      status: (p.estado || '').toLowerCase() || 'active',
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

// Detalhes do usuário - now accepts userId query param and will try to fetch data from Usuario table
router.get("/detalhes_user", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.render('pages/detalhes_user', { usuario: null });
    // userId might be in format USR-123; extract number if present
    const numeric = userId.match(/(\d+)$/);
    const idToQuery = numeric ? Number(numeric[1]) : Number(userId);
    if (Number.isNaN(idToQuery)) return res.render('pages/detalhes_user', { usuario: null });

    const [rows] = await pool.query('SELECT Usuario_ID AS id, Nome, Email, Tipo, Data_Criacao, Ultimo_Login FROM Usuario WHERE Usuario_ID = ?', [idToQuery]);
    const usuario = rows[0] || null;
    res.render('pages/detalhes_user', { usuario });
  } catch (err) {
    console.error('Erro ao obter detalhes do usuário', err);
    res.render('pages/detalhes_user', { usuario: null });
  }
});

module.exports = router;