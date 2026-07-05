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

  // Busca produtos ativos com filtros opcionais (busca, estado, categoria, precoMin, precoMax)
  findAllComFiltros: async ({ busca, estado, categoria, precoMin, precoMax } = {}) => {
    try {
      let sql = "SELECT * FROM produtos WHERE status = 'active'";
      const params = [];

      if (busca && busca.trim()) {
        sql += " AND LOWER(nome) LIKE ?";
        params.push(`%${busca.trim().toLowerCase()}%`);
      }
      if (estado && estado.trim()) {
        sql += " AND LOWER(estado) LIKE ?";
        params.push(`%${estado.trim().toLowerCase()}%`);
      }
      if (categoria && categoria.trim()) {
        sql += " AND LOWER(categoria) LIKE ?";
        params.push(`%${categoria.trim().toLowerCase()}%`);
      }
      if (precoMin && !isNaN(precoMin)) {
        sql += " AND preco >= ?";
        params.push(parseFloat(precoMin));
      }
      if (precoMax && !isNaN(precoMax)) {
        sql += " AND preco <= ?";
        params.push(parseFloat(precoMax));
      }

      sql += " ORDER BY created_at DESC";
      const [rows] = await pool.query(sql, params);
      return rows;
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
  },

  // Busca avaliações de um produto com nome do avaliador
  findAvaliacoes: async (produtoId) => {
    try {
      const [rows] = await pool.query(
        `SELECT a.Avaliacao_ID, a.Nota, a.Comentario, a.criado_em,
                COALESCE(u.Nome, a.nome_usuario, 'Usuário') AS nome_usuario
         FROM Avaliacao a
         LEFT JOIN Usuario u ON u.Usuario_ID = a.Usuario_ID
         WHERE a.Produto_ID = ?
         ORDER BY a.criado_em DESC`,
        [produtoId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Verifica se usuário já avaliou o produto; retorna a avaliação ou null
  findAvaliacaoByUsuario: async (usuarioId, produtoId) => {
    try {
      const [rows] = await pool.query(
        "SELECT Avaliacao_ID FROM Avaliacao WHERE Usuario_ID = ? AND Produto_ID = ?",
        [usuarioId, produtoId]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Cria avaliação de produto
  createAvaliacao: async ({ nota, comentario, usuarioId, produtoId, nomeUsuario }) => {
    try {
      const [result] = await pool.query(
        "INSERT INTO Avaliacao (Nota, Comentario, Usuario_ID, Produto_ID, nome_usuario, criado_em) VALUES (?, ?, ?, ?, ?, NOW())",
        [nota, comentario || '', usuarioId, produtoId, nomeUsuario]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Atualiza avaliação existente de produto
  updateAvaliacao: async ({ nota, comentario, usuarioId, produtoId }) => {
    try {
      const [result] = await pool.query(
        "UPDATE Avaliacao SET Nota = ?, Comentario = ?, criado_em = NOW() WHERE Usuario_ID = ? AND Produto_ID = ?",
        [nota, comentario || '', usuarioId, produtoId]
      );
      return result;
    } catch (err) {
      throw err;
    }
  }
};

const usuarioModel = {
  // Busca usuário por ID
  findById: async (id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM Usuario WHERE Usuario_ID = ?", [id]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Busca usuário por email
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query("SELECT * FROM Usuario WHERE Email = ?", [email]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Atualiza nome e biografia do usuário
  updatePerfil: async (id, { nome, biografia }) => {
    try {
      const [result] = await pool.query(
        "UPDATE Usuario SET Nome = ?, Biografia = ? WHERE Usuario_ID = ?",
        [nome, biografia || null, id]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Atualiza dados do usuário via admin (nome, email, biografia)
  updateAdmin: async (id, { nome, email, biografia }) => {
    try {
      const [result] = await pool.query(
        "UPDATE Usuario SET Nome = ?, Email = ?, Biografia = ? WHERE Usuario_ID = ?",
        [nome, email, biografia || null, id]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Atualiza foto do usuário
  updateFoto: async (id, filename) => {
    try {
      const [result] = await pool.query(
        "UPDATE Usuario SET foto = ? WHERE Usuario_ID = ?",
        [filename, id]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Registra último login
  updateUltimoLogin: async (id) => {
    try {
      await pool.query("UPDATE Usuario SET Ultimo_Login = NOW() WHERE Usuario_ID = ?", [id]);
    } catch (err) {
      throw err;
    }
  },

  // Cria usuário PF
  createPF: async ({ nome, email, senhaHash }) => {
    try {
      const [result] = await pool.query(
        "INSERT INTO Usuario (Nome, Email, Senha, Tipo) VALUES (?, ?, ?, 'PF')",
        [nome, email, senhaHash]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Cria usuário PJ
  createPJ: async ({ nome, email, senhaHash }) => {
    try {
      const [result] = await pool.query(
        "INSERT INTO Usuario (Nome, Email, Senha, Tipo) VALUES (?, ?, ?, 'PJ')",
        [nome, email, senhaHash]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Insere CPF na tabela Pessoa_Fisica
  createPessoaFisica: async (usuarioId, cpf) => {
    try {
      await pool.query("INSERT INTO Pessoa_Fisica (Usuario_ID, CPF) VALUES (?, ?)", [usuarioId, cpf]);
    } catch (err) {
      throw err;
    }
  },

  // Insere CNPJ na tabela Pessoa_Juridica
  createPessoaJuridica: async (usuarioId, cnpj) => {
    try {
      await pool.query("INSERT INTO Pessoa_Juridica (Usuario_ID, CNPJ) VALUES (?, ?)", [usuarioId, cnpj]);
    } catch (err) {
      throw err;
    }
  },

  // Verifica se CNPJ já existe
  findByCNPJ: async (cnpj) => {
    try {
      const [rows] = await pool.query("SELECT Usuario_ID FROM Pessoa_Juridica WHERE CNPJ = ?", [cnpj]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Converte comprador em vendedor (upgrade)
  upgradeParaVendedor: async (usuarioId, { companyName, cnpj }) => {
    try {
      await pool.query(
        "UPDATE Usuario SET Tipo = 'PJ', Biografia = ? WHERE Usuario_ID = ?",
        [`Empresa: ${companyName}`, usuarioId]
      );
      await pool.query("INSERT INTO Pessoa_Juridica (Usuario_ID, CNPJ) VALUES (?, ?)", [usuarioId, cnpj]);
    } catch (err) {
      throw err;
    }
  }
};

const vendedorModel = {
  // Busca dados públicos do vendedor (apenas PJ)
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT Usuario_ID, Nome, Email, foto, Tipo, Biografia, Data_Criacao
         FROM Usuario WHERE Usuario_ID = ? AND Tipo = 'PJ'`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Busca dados do usuário para exibir como vendedor do produto (qualquer Tipo)
  findUsuarioById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT Usuario_ID, Nome, Email, foto, Tipo, Biografia, Data_Criacao FROM Usuario WHERE Usuario_ID = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Média e total de avaliações do vendedor
  findMediaAvaliacao: async (vendedorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT ROUND(AVG(nota), 1) AS media, COUNT(*) AS total
         FROM Avaliacao_Vendedor WHERE vendedor_id = ?`,
        [vendedorId]
      );
      return rows[0];
    } catch (err) {
      throw err;
    }
  },

  // Total de vendas do vendedor
  findTotalVendas: async (vendedorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(DISTINCT ic.Compra_ID) AS total
         FROM Item_Compra ic
         JOIN produtos p ON p.id = ic.Produto_ID
         WHERE p.usuario_id = ?`,
        [vendedorId]
      );
      return rows[0].total || 0;
    } catch (err) {
      throw err;
    }
  },

  // Total de produtos ativos do vendedor
  findTotalProdutos: async (vendedorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total FROM produtos WHERE usuario_id = ? AND status = 'active'`,
        [vendedorId]
      );
      return rows[0].total || 0;
    } catch (err) {
      throw err;
    }
  },

  // Produtos ativos do vendedor
  findProdutos: async (vendedorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM produtos WHERE usuario_id = ? AND status = 'active' ORDER BY created_at DESC`,
        [vendedorId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Avaliações/comentários feitos sobre o vendedor
  findAvaliacoes: async (vendedorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT av.id, av.nota, av.comentario, av.criado_em,
                u.Nome AS nome_avaliador, u.foto AS foto_avaliador
         FROM Avaliacao_Vendedor av
         JOIN Usuario u ON u.Usuario_ID = av.avaliador_id
         WHERE av.vendedor_id = ?
         ORDER BY av.criado_em DESC`,
        [vendedorId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Verifica se avaliador já avaliou este vendedor
  findAvaliacaoByAvaliador: async (vendedorId, avaliadorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT nota, comentario FROM Avaliacao_Vendedor WHERE vendedor_id = ? AND avaliador_id = ?`,
        [vendedorId, avaliadorId]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Verifica se avaliação existe (retorna registro com id)
  findAvaliacaoId: async (vendedorId, avaliadorId) => {
    try {
      const [rows] = await pool.query(
        `SELECT id FROM Avaliacao_Vendedor WHERE vendedor_id = ? AND avaliador_id = ?`,
        [vendedorId, avaliadorId]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Cria avaliação de vendedor
  createAvaliacao: async ({ vendedorId, avaliadorId, nota, comentario }) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO Avaliacao_Vendedor (vendedor_id, avaliador_id, nota, comentario) VALUES (?, ?, ?, ?)`,
        [vendedorId, avaliadorId, nota, comentario || '']
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  // Atualiza avaliação existente de vendedor
  updateAvaliacao: async ({ vendedorId, avaliadorId, nota, comentario }) => {
    try {
      const [result] = await pool.query(
        `UPDATE Avaliacao_Vendedor SET nota = ?, comentario = ?, criado_em = NOW()
         WHERE vendedor_id = ? AND avaliador_id = ?`,
        [nota, comentario || '', vendedorId, avaliadorId]
      );
      return result;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = produtosModel;
module.exports.usuarioModel = usuarioModel;
module.exports.vendedorModel = vendedorModel;