const pool = require("../../config/pool_conexoes");

// Limite de quantidade de um produto no carrinho = estoque cadastrado pelo
// vendedor (produtos.quantidade, em toneladas). Antes era um 5 fixo, por
// isso todo produto aparecia como "Disponível: 5 toneladas". O carrinho
// trabalha com toneladas inteiras; o mínimo é 1 para o item não ficar
// travado quando o estoque não foi informado.
function limiteDoEstoque(estoque) {
  const n = Number(estoque);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

// A quantidade é gravada dentro do JSON do carrinho e pode ter chegado como
// string em registros antigos ("2"). Com `+=`, "2" + 1 vira "21". Aqui
// garantimos sempre um inteiro entre 1 e o limite do produto. Tela do
// carrinho, botões +/− e checkout usam esta mesma função.
function normalizarQuantidade(valor, limite = Infinity) {
  const n = parseInt(valor, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, limite));
}

// Estoque atual de cada produto do carrinho: Map productId -> { estoque, limite }.
async function estoquePorProduto(productIds) {
  const ids = [...new Set((productIds || []).map(id => parseInt(id, 10)).filter(Number.isInteger))];
  const mapa = new Map();
  if (ids.length === 0) return mapa;
  const [rows] = await pool.query("SELECT id, quantidade FROM produtos WHERE id IN (?)", [ids]);
  for (const r of rows) {
    mapa.set(String(r.id), { estoque: r.quantidade === null ? null : Number(r.quantidade), limite: limiteDoEstoque(r.quantidade) });
  }
  return mapa;
}

function lerItens(bruto) {
  if (Array.isArray(bruto)) return bruto;
  if (typeof bruto === 'string') {
    try { return JSON.parse(bruto || '[]'); } catch (e) { return []; }
  }
  return bruto ? [bruto] : [];
}

const cartModel = {
  // Adiciona um item ao carrinho do usuário
  addItem: async (userId, item, limite = Infinity) => {
    try {
      let [cartRows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      let cartId, items;

      if (cartRows.length === 0) {
        items = [{ ...item, quantidade: normalizarQuantidade(item.quantidade, limite) }];
        const [result] = await pool.query("INSERT INTO carrinho (userId, items) VALUES (?, ?)", [userId, JSON.stringify(items)]);
        cartId = result.insertId;
      } else {
        cartId = cartRows[0].idCarrinho;
        const existingItems = cartRows[0].items;
        if (Array.isArray(existingItems)) {
          items = existingItems;
        } else if (typeof existingItems === 'string') {
          items = JSON.parse(existingItems || '[]');
        } else {
          items = Array.isArray(existingItems) ? existingItems : [existingItems];
        }
        const existingIndex = items.findIndex(i => String(i.productId) === String(item.productId));
        if (existingIndex >= 0) {
          // Soma numérica (antes podia concatenar strings) e respeita o
          // estoque do produto.
          items[existingIndex].quantidade = normalizarQuantidade(
            normalizarQuantidade(items[existingIndex].quantidade) + normalizarQuantidade(item.quantidade),
            limite
          );
        } else {
          items.push({ ...item, quantidade: normalizarQuantidade(item.quantidade, limite) });
        }
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), cartId]);
      }
      return { cartId, items };
    } catch (err) {
      throw err;
    }
  },

  // Obtém o carrinho do usuário
  getCartByUser: async (userId) => {
    try {
      const [rows] = await pool.query("SELECT items FROM carrinho WHERE userId = ?", [userId]);
      if (rows.length === 0) return [];

      const items = rows[0].items;
      // Verificar se já é um array ou precisa ser parseado
      if (Array.isArray(items)) {
        return items;
      } else if (typeof items === 'string') {
        return JSON.parse(items || '[]');
      } else {
        // Se for um objeto, tentar converter
        return Array.isArray(items) ? items : [items];
      }
    } catch (err) {
      throw err;
    }
  },

  // Define a quantidade de um produto do carrinho (botões + e − da tela).
  // Retorna a quantidade efetivamente gravada, ou null se o produto não
  // está no carrinho.
  atualizarQuantidade: async (userId, productId, quantidade, limite = Infinity) => {
    const [rows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
    if (rows.length === 0) return null;

    const items = lerItens(rows[0].items);
    const item = items.find(i => String(i.productId) === String(productId));
    if (!item) return null;

    item.quantidade = normalizarQuantidade(quantidade, limite);
    await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), rows[0].idCarrinho]);
    return item.quantidade;
  },

  // Remove do carrinho apenas os produtos informados (usado quando um
  // pagamento é aprovado). Assim, itens adicionados ao carrinho depois do
  // checkout não são apagados junto. Chamar de novo com os mesmos IDs é
  // inofensivo (os itens já não estão lá).
  removerProdutos: async (userId, productIds) => {
    if (!userId || !productIds || productIds.length === 0) return;
    const alvo = new Set(productIds.filter(id => id != null).map(String));
    if (alvo.size === 0) return;

    const [rows] = await pool.query(
      "SELECT idCarrinho, items FROM carrinho WHERE CAST(userId AS CHAR) = ?",
      [String(userId)]
    );

    for (const row of rows) {
      let items;
      if (Array.isArray(row.items)) {
        items = row.items;
      } else if (typeof row.items === 'string') {
        try { items = JSON.parse(row.items || '[]'); } catch (e) { items = []; }
      } else {
        items = row.items ? [row.items] : [];
      }

      const restantes = items.filter(i => !alvo.has(String(i && i.productId)));
      if (restantes.length !== items.length) {
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(restantes), row.idCarrinho]);
      }
    }
  },

  // Remove um item do carrinho por índice
  removeByIndex: async (userId, index) => {
    try {
      const [rows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      if (rows.length === 0) return;
      const cartId = rows[0].idCarrinho;
      const existingItems = rows[0].items;

      let items;
      if (Array.isArray(existingItems)) {
        items = existingItems;
      } else if (typeof existingItems === 'string') {
        items = JSON.parse(existingItems || '[]');
      } else {

        items = Array.isArray(existingItems) ? existingItems : [existingItems];
      }
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(items), cartId]);
      }
    } catch (err) {
      throw err;
    }
  }
};

cartModel.limiteDoEstoque = limiteDoEstoque;
cartModel.normalizarQuantidade = normalizarQuantidade;
cartModel.estoquePorProduto = estoquePorProduto;

module.exports = cartModel;