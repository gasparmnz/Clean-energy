const pool = require("../../config/pool_conexoes");

const produtosModel = {
  // apenasAtivos: clientes só veem produtos com status = 'active'
  findAll: async ({ apenasAtivos = false } = {}) => {
    try {
      const sql = apenasAtivos
        ? "SELECT * FROM produtos WHERE status = 'active' ORDER BY created_at DESC"
        : "SELECT * FROM produtos ORDER BY created_at DESC";
      const [rows] = await pool.query(sql);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  findById: async (id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM produtos WHERE id = ?", [id]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  create: async (dados) => {
    try {
      // imagem pode ser um data URI base64 (salvo direto no banco) ou nome de arquivo
      const sql = `INSERT INTO produtos
        (nome, descricao, preco, quantidade, categoria, local, imagem, estado, status, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`;
      const params = [
        dados.nome,
        dados.descricao || null,
        dados.preco || 0,
        dados.quantidade || null,
        dados.categoria || null,
        dados.local || null,
        dados.imagem || null,
        dados.estado || null,
        dados.usuario_id || null
      ];
      const [result] = await pool.query(sql, params);
      return result;
    } catch (err) {
      throw err;
    }
  },

  updateStatus: async (id, status) => {
    try {
      if (!['active', 'suspended'].includes(status)) {
        throw new Error('Status inválido.');
      }
      const [result] = await pool.query("UPDATE produtos SET status = ? WHERE id = ?", [status, id]);
      return result;
    } catch (err) {
      throw err;
    }
  },

  update: async (id, dados) => {
    try {
      const sql = `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, quantidade = ? WHERE id = ?`;
      const [result] = await pool.query(sql, [dados.nome, dados.descricao || null, dados.preco || 0, dados.quantidade || null, id]);
      return result;
    } catch (err) {
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const [result] = await pool.query("DELETE FROM produtos WHERE id = ?", [id]);
      return result;
    } catch (err) {
      throw err;
    }
  },

  findByUsuario: async (usuarioId) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM produtos WHERE usuario_id = ? ORDER BY created_at DESC",
        [usuarioId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = produtosModel;
