const pool = require('../../config/pool_conexoes');

let tabelaGarantida = false;

async function garantirTabela() {
  if (tabelaGarantida) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      comprador_id INT NOT NULL,
      produto_id INT NULL,
      valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('pendente','em_transito','concluido','cancelado') NOT NULL DEFAULT 'pendente',
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [colunas] = await pool.query(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos'"
  );
  const existentes = new Set(colunas.map(c => c.COLUMN_NAME));

  const alteracoes = [];
  if (!existentes.has('produto_nome'))   alteracoes.push("ADD COLUMN produto_nome VARCHAR(255) NOT NULL DEFAULT ''");
  if (!existentes.has('produto_imagem')) alteracoes.push("ADD COLUMN produto_imagem MEDIUMTEXT NULL");
  if (!existentes.has('produto_local'))  alteracoes.push("ADD COLUMN produto_local VARCHAR(255) NULL");
  if (!existentes.has('quantidade'))     alteracoes.push("ADD COLUMN quantidade INT NOT NULL DEFAULT 1");
  if (!existentes.has('valor_unitario')) alteracoes.push("ADD COLUMN valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 0");
  if (!existentes.has('preference_id'))  alteracoes.push("ADD COLUMN preference_id VARCHAR(191) NULL");
  if (!existentes.has('atualizado_em'))  alteracoes.push("ADD COLUMN atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  if (alteracoes.length > 0) {
    await pool.query(`ALTER TABLE pedidos ${alteracoes.join(', ')}`);
  }

  const statusCol = colunas.find(c => c.COLUMN_NAME === 'status');
  if (statusCol && !statusCol.COLUMN_TYPE.includes('em_transito')) {
    await pool.query(
      "ALTER TABLE pedidos MODIFY COLUMN status ENUM('pendente','em_transito','concluido','cancelado') NOT NULL DEFAULT 'pendente'"
    );
  }

  const indices = [
    ['idx_pedidos_preference', 'preference_id'],
    ['idx_pedidos_comprador_status', 'comprador_id, status'],
    ['idx_pedidos_status', 'status']
  ];
  for (const [nome, colunasIdx] of indices) {
    try {
      await pool.query(`ALTER TABLE pedidos ADD INDEX ${nome} (${colunasIdx})`);
    } catch (e) {
    }
  }

  tabelaGarantida = true;
}

const pedidoModel = {
  criarPendentes: async (compradorId, itens, preferenceId) => {
    if (!itens || itens.length === 0) return;
    await garantirTabela();

    const values = itens.map(item => [
      compradorId,
      item.productId || null,
      item.nome,
      item.imagem || null,
      item.local || null,
      item.quantidade || 1,
      Number(item.preco) || 0,
      (Number(item.preco) || 0) * (item.quantidade || 1),
      'pendente',
      preferenceId || null
    ]);

    await pool.query(
      `INSERT INTO pedidos
        (comprador_id, produto_id, produto_nome, produto_imagem, produto_local, quantidade, valor_unitario, valor_total, status, preference_id)
       VALUES ?`,
      [values]
    );
  },

  definirPreferenceId: async (pedidoId, preferenceId) => {
    await garantirTabela();
    await pool.query('UPDATE pedidos SET preference_id = ? WHERE id = ?', [preferenceId, pedidoId]);
  },

  atualizarStatusPorPreference: async (preferenceId, statusEsperado, novoStatus) => {
    if (!preferenceId) return { atualizados: [] };
    await garantirTabela();

    const [resultado] = await pool.query(
      'UPDATE pedidos SET status = ? WHERE preference_id = ? AND status = ?',
      [novoStatus, preferenceId, statusEsperado]
    );

    if (!resultado.affectedRows) return { atualizados: [] };

    const [rows] = await pool.query('SELECT * FROM pedidos WHERE preference_id = ?', [preferenceId]);
    return { atualizados: rows };
  },

  confirmarPagamentoPorPreference: async (preferenceId, pedidoId = null) => {
    if (!preferenceId && !pedidoId) return [];
    await garantirTabela();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [pedidos] = await conn.query(
        `SELECT * FROM pedidos
          WHERE (preference_id = ? OR id = ?)
            AND status IN ('pendente','cancelado')
          FOR UPDATE`,
        [preferenceId || null, pedidoId || null]
      );

      if (pedidos.length === 0) {
        await conn.commit();
        return [];
      }

      const ids = pedidos.map(p => p.id);
      await conn.query(
        "UPDATE pedidos SET status = 'em_transito' WHERE id IN (?) AND status IN ('pendente','cancelado')",
        [ids]
      );

      await conn.commit();
      return pedidos.map(p => ({ ...p, status: 'em_transito' }));
    } catch (err) {
      try { await conn.rollback(); } catch (e) { }
      throw err;
    } finally {
      conn.release();
    }
  },

  listarPreferencesPendentes: async (compradorId, limite = 5) => {
    await garantirTabela();
    const [rows] = await pool.query(
      `SELECT preference_id, MAX(criado_em) AS ultimo
         FROM pedidos
        WHERE comprador_id = ? AND status = 'pendente' AND preference_id IS NOT NULL
        GROUP BY preference_id
        ORDER BY ultimo DESC
        LIMIT ?`,
      [compradorId, limite]
    );
    return rows.map(r => r.preference_id);
  },

  listarPorComprador: async (compradorId, status) => {
    await garantirTabela();
    const [rows] = await pool.query(
      `SELECT p.*, pr.local AS produto_local_atual, pr.estado AS produto_estado,
              CASE WHEN p.produto_imagem IS NULL OR p.produto_imagem = ''
                   THEN pr.imagem END AS produto_imagem_atual
         FROM pedidos p
         LEFT JOIN produtos pr ON pr.id = p.produto_id
        WHERE p.comprador_id = ? AND p.status = ?
        ORDER BY p.criado_em DESC`,
      [compradorId, status]
    );
    return rows;
  },

  buscarPorId: async (pedidoId) => {
    await garantirTabela();
    const [rows] = await pool.query('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
    return rows[0] || null;
  },

  cancelarPendente: async (compradorId, pedidoId) => {
    await garantirTabela();
    const [resultado] = await pool.query(
      "UPDATE pedidos SET status = 'cancelado' WHERE id = ? AND comprador_id = ? AND status = 'pendente'",
      [pedidoId, compradorId]
    );
    return resultado.affectedRows > 0;
  },

  confirmarRecebimento: async (compradorId, pedidoId) => {
    await garantirTabela();
    const [resultado] = await pool.query(
      "UPDATE pedidos SET status = 'concluido' WHERE id = ? AND comprador_id = ? AND status = 'em_transito'",
      [pedidoId, compradorId]
    );
    return resultado.affectedRows > 0;
  },

  resumoVendas: async (vendedorId) => {
    await garantirTabela();
    const [[linha]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN p.status IN ('em_transito','concluido') THEN p.quantidade END), 0) AS itensVendidos,
         COALESCE(SUM(CASE WHEN p.status IN ('em_transito','concluido') THEN p.valor_total END), 0) AS valorArrecadado,
         COUNT(CASE WHEN p.status = 'pendente' THEN 1 END) AS pedidosPendentes
       FROM pedidos p
       JOIN produtos pr ON pr.id = p.produto_id
       WHERE pr.usuario_id = ?`,
      [vendedorId]
    );
    return {
      itensVendidos: Number(linha.itensVendidos) || 0,
      valorArrecadado: Number(linha.valorArrecadado) || 0,
      pedidosPendentes: Number(linha.pedidosPendentes) || 0
    };
  },

  vendasRecentes: async (vendedorId, limite = 10) => {
    await garantirTabela();
    const [rows] = await pool.query(
      `SELECT p.id,
              COALESCE(u.Nome, 'Comprador removido') AS comprador,
              COALESCE(NULLIF(p.produto_nome, ''), pr.nome) AS produto,
              p.quantidade,
              p.valor_total AS valor,
              p.criado_em AS data,
              p.status
         FROM pedidos p
         JOIN produtos pr ON pr.id = p.produto_id
         LEFT JOIN Usuario u ON u.Usuario_ID = p.comprador_id
        WHERE pr.usuario_id = ?
        ORDER BY p.criado_em DESC, p.id DESC
        LIMIT ?`,
      [vendedorId, limite]
    );
    return rows;
  },

  comprasRecentes: async (compradorId, limite = 10) => {
    await garantirTabela();
    const [rows] = await pool.query(
      `SELECT p.id,
              COALESCE(v.Nome, '-') AS vendedor,
              COALESCE(NULLIF(p.produto_nome, ''), pr.nome) AS produto,
              p.quantidade,
              p.valor_total AS valor,
              p.criado_em AS data,
              p.status
         FROM pedidos p
         LEFT JOIN produtos pr ON pr.id = p.produto_id
         LEFT JOIN Usuario v ON v.Usuario_ID = pr.usuario_id
        WHERE p.comprador_id = ?
        ORDER BY p.criado_em DESC, p.id DESC
        LIMIT ?`,
      [compradorId, limite]
    );
    return rows;
  },

  comprouProduto: async (compradorId, produtoId) => {
    if (!compradorId) return false;
    await garantirTabela();
    const [rows] = await pool.query(
      "SELECT 1 FROM pedidos WHERE comprador_id = ? AND produto_id = ? AND status IN ('em_transito','concluido') LIMIT 1",
      [compradorId, produtoId]
    );
    return rows.length > 0;
  }
};

module.exports = pedidoModel;
