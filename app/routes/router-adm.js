var express = require("express");
var router = express.Router();
const pool = require("../../config/pool_conexoes");
const produtosModel = require("../models/models.js");

// Admin dashboard
router.get("/", async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM Usuario");
    const [[{ totalProducts }]] = await pool.query("SELECT COUNT(*) AS totalProducts FROM produtos");
    const [[{ activeProducts }]] = await pool.query("SELECT COUNT(*) AS activeProducts FROM produtos WHERE status = 'active'");
    const [[{ suspendedProducts }]] = await pool.query("SELECT COUNT(*) AS suspendedProducts FROM produtos WHERE status = 'suspended'");

    let compras = [];
    let vendas = [];
    let stats = { total: 0, pendentes: 0, canceladas: 0, concluidas: 0, totalValor: 0, comissao: 0 };

    try {
      const [tables] = await pool.query("SHOW TABLES LIKE 'pedidos'");
      if (tables.length > 0) {
        const [[s]] = await pool.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN status='pendente' THEN 1 ELSE 0 END) AS pendentes, SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END) AS canceladas, SUM(CASE WHEN status='concluido' THEN 1 ELSE 0 END) AS concluidas, COALESCE(SUM(valor_total),0) AS totalValor FROM pedidos`);
        stats = { total: s.total||0, pendentes: s.pendentes||0, canceladas: s.canceladas||0, concluidas: s.concluidas||0, totalValor: parseFloat(s.totalValor)||0, comissao: (parseFloat(s.totalValor)||0)*0.05 };
        const [comprasRows] = await pool.query(`SELECT p.id, u.Nome AS comprador, pr.nome AS produto, p.valor_total AS valor, p.criado_em AS data, p.status FROM pedidos p JOIN Usuario u ON p.comprador_id = u.Usuario_ID LEFT JOIN produtos pr ON p.produto_id = pr.id ORDER BY p.criado_em DESC LIMIT 5`);
        compras = comprasRows;
        const [vendasRows] = await pool.query(`SELECT p.id, u.Nome AS vendedor, pr.nome AS produto, p.valor_total AS valor, p.criado_em AS data, p.status FROM pedidos p JOIN produtos pr ON p.produto_id = pr.id JOIN Usuario u ON pr.usuario_id = u.Usuario_ID ORDER BY p.criado_em DESC LIMIT 5`);
        vendas = vendasRows;
      }
    } catch (e) { /* tabela nao existe ainda */ }

    res.render("pages/adm", {
      totals: { users: totalUsers||0, products: totalProducts||0, active: activeProducts||0, suspended: suspendedProducts||0 },
      stats, compras, vendas
    });
  } catch (err) {
    console.error('Erro ao carregar dashboard admin', err);
    res.render("pages/adm", {
      totals: { users: 0, products: 0, active: 0, suspended: 0 },
      stats: { total: 0, pendentes: 0, canceladas: 0, concluidas: 0, totalValor: 0, comissao: 0 },
      compras: [], vendas: []
    });
  }
});

// Lista usuários cadastrados
router.get("/usuarios_cadastrados", async (req, res) => {
  try {
    // Verifica se coluna status já existe
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Usuario' AND COLUMN_NAME = 'status'"
    );

    if (cols.length === 0) {
      // Coluna não existe — cria agora
      await pool.query("ALTER TABLE Usuario ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active'");
    }

    // Agora busca todos com status garantido
    const [todos] = await pool.query(
      "SELECT Usuario_ID AS id, Nome AS nome, Email AS email, Tipo, Data_Criacao, status FROM Usuario ORDER BY Data_Criacao DESC"
    );

    const ativos    = todos.filter(u => u.status !== 'suspended');
    const suspensos = todos.filter(u => u.status === 'suspended');

    res.render("pages/usuarios_cadastrados", { usuarios: ativos, suspensos });
  } catch (err) {
    console.error('Erro ao obter usuários', err);
    res.render("pages/usuarios_cadastrados", { usuarios: [], suspensos: [] });
  }
});

// Suspender usuário
router.post("/usuarios/suspender", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    await pool.query("UPDATE Usuario SET status = 'suspended' WHERE Usuario_ID = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao suspender usuário', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Reativar usuário
router.post("/usuarios/reativar", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    await pool.query("UPDATE Usuario SET status = 'active' WHERE Usuario_ID = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao reativar usuário', err);
    res.status(500).json({ error: 'Erro interno' });
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

    // Garante coluna status
    const [colCheck] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Usuario' AND COLUMN_NAME = 'status'"
    );
    if (colCheck.length === 0) {
      await pool.query("ALTER TABLE Usuario ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active'");
    }

    // JOIN com Pessoa_Fisica (CPF) e Pessoa_Juridica (CNPJ)
    const [rows] = await pool.query(
      `SELECT u.Usuario_ID AS id, u.Nome, u.Email, u.Tipo, u.Biografia,
              u.Data_Criacao, u.Ultimo_Login,
              IFNULL(u.status,'active') AS status,
              pf.CPF,
              pj.CNPJ
       FROM Usuario u
       LEFT JOIN Pessoa_Fisica   pf ON pf.Usuario_ID = u.Usuario_ID
       LEFT JOIN Pessoa_Juridica pj ON pj.Usuario_ID = u.Usuario_ID
       WHERE u.Usuario_ID = ?`,
      [idToQuery]
    );
    const usuario = rows[0] || null;
    res.render('pages/detalhes_user', { usuario });
  } catch (err) {
    console.error('Erro ao obter detalhes do usuário', err);
    res.render('pages/detalhes_user', { usuario: null });
  }
});

// Excluir usuário — apaga tudo manualmente contornando FKs sem CASCADE
router.post("/usuarios/excluir", async (req, res) => {
  let conn;
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });

    conn = await pool.getConnection();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    // Dependências de compras
    await conn.query("DELETE ic FROM Item_Compra ic INNER JOIN Compra c ON ic.Compra_ID = c.Compra_ID WHERE c.Usuario_ID = ?", [id]);
    await conn.query("DELETE FROM Compra WHERE Usuario_ID = ?", [id]);

    // Avaliações feitas pelo usuário
    await conn.query("DELETE FROM Avaliacao WHERE Usuario_ID = ?", [id]);

    // Dados pessoais (PF ou PJ)
    await conn.query("DELETE FROM Pessoa_Fisica   WHERE Usuario_ID = ?", [id]);
    await conn.query("DELETE FROM Pessoa_Juridica WHERE Usuario_ID = ?", [id]);

    // Por último o próprio usuário
    await conn.query("DELETE FROM Usuario WHERE Usuario_ID = ?", [id]);

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    conn.release();

    res.json({ success: true });
  } catch (err) {
    if (conn) {
      await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
      conn.release();
    }
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

module.exports = router;
