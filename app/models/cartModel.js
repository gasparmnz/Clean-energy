const pool = require("../../config/pool_conexoes");

const cartModel = {
  // Adiciona um item ao carrinho do usuário
  addItem: async (userId, item) => {
    try {
      let [cartRows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);
      let cartId, items;

      if (cartRows.length === 0) {
        items = [item];
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
        const existingIndex = items.findIndex(i => i.productId === item.productId);
        if (existingIndex >= 0) {
          items[existingIndex].quantidade += item.quantidade;
        } else {
          items.push(item);
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
  },
  // Mescla o carrinho de um convidado (sessionID) com o carrinho do usuário logado
  mergeGuestCart: async (guestId, userId) => {
    try {
      if (!guestId || !userId || guestId === userId) return;

      const [guestRows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [guestId]);
      if (guestRows.length === 0) return; // nada para mesclar

      const parseItems = (raw) => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') return JSON.parse(raw || '[]');
        return raw ? [raw] : [];
      };

      const guestItems = parseItems(guestRows[0].items);
      if (guestItems.length === 0) {
        await pool.query("DELETE FROM carrinho WHERE idCarrinho = ?", [guestRows[0].idCarrinho]);
        return;
      }

      const [userRows] = await pool.query("SELECT idCarrinho, items FROM carrinho WHERE userId = ?", [userId]);

      if (userRows.length === 0) {
        await pool.query("INSERT INTO carrinho (userId, items) VALUES (?, ?)", [userId, JSON.stringify(guestItems)]);
      } else {
        const userItems = parseItems(userRows[0].items);
        guestItems.forEach(item => {
          const existingIndex = userItems.findIndex(i => i.productId === item.productId);
          if (existingIndex >= 0) {
            userItems[existingIndex].quantidade += item.quantidade;
          } else {
            userItems.push(item);
          }
        });
        await pool.query("UPDATE carrinho SET items = ? WHERE idCarrinho = ?", [JSON.stringify(userItems), userRows[0].idCarrinho]);
      }

      // Remove o carrinho temporário do convidado
      await pool.query("DELETE FROM carrinho WHERE idCarrinho = ?", [guestRows[0].idCarrinho]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports = cartModel;