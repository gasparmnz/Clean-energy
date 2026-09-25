const pool = require('../../config/pool_conexoes');

let tabelaGarantida = false;

// Cria a tabela `pedidos` se ela ainda não existir e, se ela já existir
// (ex.: sobra de uma versão anterior do projeto, com um esquema mais
// simples — só comprador_id/produto_id/valor_total/status/criado_em),
// completa as colunas que estiverem faltando. Mesmo padrão de
// auto-migração defensiva já usado em adminController.js para outras
// tabelas/colunas.
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

  // Uma tabela antiga pode ter o ENUM de status sem o valor 'em_transito'.
  const statusCol = colunas.find(c => c.COLUMN_NAME === 'status');
  if (statusCol && !statusCol.COLUMN_TYPE.includes('em_transito')) {
    await pool.query(
      "ALTER TABLE pedidos MODIFY COLUMN status ENUM('pendente','em_transito','concluido','cancelado') NOT NULL DEFAULT 'pendente'"
    );
  }

  // Índices (MySQL não tem "ADD INDEX IF NOT EXISTS" — ignora se já existir).
  const indices = [
    ['idx_pedidos_preference', 'preference_id'],
    ['idx_pedidos_comprador_status', 'comprador_id, status'],
    ['idx_pedidos_status', 'status']
  ];
  for (const [nome, colunasIdx] of indices) {
    try {
      await pool.query(`ALTER TABLE pedidos ADD INDEX ${nome} (${colunasIdx})`);
    } catch (e) {
      // já existe — ok
    }
  }

  tabelaGarantida = true;
}

const pedidoModel = {
  // Cria um pedido "pendente" para cada item do carrinho, vinculado (ou não)
  // a uma preferência do Mercado Pago.
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

  // Vincula a preferência do Mercado Pago a um pedido já existente
  // (usado no fluxo de "pagar pendente").
  definirPreferenceId: async (pedidoId, preferenceId) => {
    await garantirTabela();
    await pool.query('UPDATE pedidos SET preference_id = ? WHERE id = ?', [preferenceId, pedidoId]);
  },

  // Atualiza para `novoStatus` todos os pedidos de uma preferência que
  // ainda estejam em `statusEsperado`. Retorna os pedidos atualizados
  // nesta chamada (vazio se já tinham sido processados antes — protege
  // contra o comprador recarregar a página de sucesso/falha).
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

  // Confirma o pagamento de uma preferência: move os pedidos dela para
  // `em_transito`. Feito dentro de uma transação com SELECT ... FOR UPDATE
  // para que, se o webhook e o retorno /pagamento/sucesso chegarem ao
  // mesmo tempo, só UMA das chamadas receba os pedidos de volta (e,
  // portanto, só ela limpe o carrinho e notifique o vendedor). As chamadas
  // seguintes recebem [] e não fazem nada — é isso que garante que não
  // haja notificação/remoção duplicada.
  //
  // Aceita tanto `pendente` quanto `cancelado` como estado de origem: um
  // pedido pode ter sido marcado como cancelado pelo retorno
  // /pagamento/falha (comprador voltou à loja após uma recusa) e o
  // comprador ter tentado de novo, com sucesso, na mesma preferência. Se o
  // Mercado Pago confirmou um pagamento aprovado, o pedido precisa refletir
  // isso. Pedidos já `em_transito`/`concluido` nunca são tocados.
  //
  // `pedidoId` (opcional) é usado no fluxo "Efetuar Pagamento" de um pedido
  // pendente: ali a preferência leva external_reference = "pedido:<id>",
  // então conseguimos achar o pedido mesmo que o preference_id gravado já
  // tenha sido trocado por uma tentativa de pagamento mais nova.
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
      try { await conn.rollback(); } catch (e) { /* ignora */ }
      throw err;
    } finally {
      conn.release();
    }
  },

  // preference_ids distintos dos pedidos ainda pendentes de um comprador
  // (usado para reconciliar com o Mercado Pago ao abrir /minhascompras —
  // essencial em ambiente local, onde o webhook não consegue chegar).
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
    // LEFT JOIN com produtos só para complementar o endereço: o pedido
    // guarda uma cópia de `produto_local` no momento da compra, mas pedidos
    // antigos podem ter esse campo vazio — nesse caso usamos o endereço
    // atual do produto. `estado` (UF) só existe na tabela de produtos.
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

  // Comprador cancela um pedido que ainda não foi pago: pendente -> cancelado.
  cancelarPendente: async (compradorId, pedidoId) => {
    await garantirTabela();
    const [resultado] = await pool.query(
      "UPDATE pedidos SET status = 'cancelado' WHERE id = ? AND comprador_id = ? AND status = 'pendente'",
      [pedidoId, compradorId]
    );
    return resultado.affectedRows > 0;
  },

  // Comprador confirma que recebeu o produto: em_transito -> concluido.
  confirmarRecebimento: async (compradorId, pedidoId) => {
    await garantirTabela();
    const [resultado] = await pool.query(
      "UPDATE pedidos SET status = 'concluido' WHERE id = ? AND comprador_id = ? AND status = 'em_transito'",
      [pedidoId, compradorId]
    );
    return resultado.affectedRows > 0;
  },

  // Usado para liberar avaliações: o comprador já pagou por esse produto
  // (em trânsito ou já concluído)?
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
