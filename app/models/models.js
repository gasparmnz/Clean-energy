const pool = require("../../config/pool_conexoes");

const produtosModel = {
  findAll: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM produtos ORDER BY created_at DESC");
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
      const sql = `INSERT INTO produtos
        (nome, descricao, preco, quantidade, categoria, local, imagem, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        dados.nome,
        dados.descricao || null,
        dados.preco || 0,
        dados.quantidade || null,
        dados.categoria || null,
        dados.local || null,
        dados.imagem || null,
        dados.estado || null
      ];
      const [result] = await pool.query(sql, params);
      return result;
    } catch (err) {
      throw err;
    }
  },

  delete: async (id) => {
    try {
      const sql = `DELETE FROM produtos WHERE id = ?`;
      const [result] = await pool.query(sql, [id]);
      return result;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = produtosModel;  