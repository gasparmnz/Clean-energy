const pool = require("../../config/pool_conexoes");

// Garante a existência da tabela de imagens extras dos produtos (múltiplas imagens)
pool.query(`
  CREATE TABLE IF NOT EXISTS produto_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    imagem VARCHAR(255) NOT NULL,
    ordem INT DEFAULT 0,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
  )
`).catch(err => console.error('Erro ao garantir tabela produto_imagens:', err));

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
      const produto = rows[0] || null;
      if (produto) {
        const [imgRows] = await pool.query(
          "SELECT imagem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC, id ASC",
          [id]
        );
        // Galeria completa: imagem de capa (produtos.imagem) + imagens extras
        produto.imagens = [produto.imagem || 'sem-foto.png', ...imgRows.map(r => r.imagem)];
      }
      return produto;
    } catch (err) {
      throw err;
    }
  },

  // Adiciona imagens extras (além da capa) a um produto já cadastrado
  addImagensExtras: async (produtoId, filenames) => {
    try {
      if (!filenames || filenames.length === 0) return;
      const values = filenames.map((f, i) => [produtoId, f, i + 1]);
      await pool.query("INSERT INTO produto_imagens (produto_id, imagem, ordem) VALUES ?", [values]);
    } catch (err) {
      throw err;
    }
  },

  getImagensExtras: async (produtoId) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, imagem FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC, id ASC",
        [produtoId]
      );
      return rows;
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

// Garante a existência da tabela de pedidos (transações de compra/venda)
pool.query(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    comprador_id INT NOT NULL,
    quantidade DECIMAL(10,2) DEFAULT 1,
    valor_total DECIMAL(10,2) DEFAULT 0,
    status ENUM('pendente','concluido','cancelado') DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (comprador_id) REFERENCES Usuario(Usuario_ID)
  )
`).catch(err => console.error('Erro ao garantir tabela pedidos:', err));

const pedidosModel = {
  // Estatísticas de vendas do vendedor (produtos anunciados por ele)
  getStatsVendedor: async (usuarioId) => {
    try {
      const [[s]] = await pool.query(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN p.status='concluido' THEN 1 ELSE 0 END) AS concluidas,
           SUM(CASE WHEN p.status='cancelado' THEN 1 ELSE 0 END) AS canceladas,
           SUM(CASE WHEN p.status='pendente' THEN 1 ELSE 0 END) AS pendentes,
           COALESCE(SUM(CASE WHEN p.status='concluido' THEN p.valor_total ELSE 0 END),0) AS receita
         FROM pedidos p
         JOIN produtos pr ON p.produto_id = pr.id
         WHERE pr.usuario_id = ? AND p.criado_em >= (NOW() - INTERVAL 30 DAY)`,
        [usuarioId]
      );
      return {
        total: s.total || 0,
        concluidas: s.concluidas || 0,
        canceladas: s.canceladas || 0,
        pendentes: s.pendentes || 0,
        receita: parseFloat(s.receita) || 0
      };
    } catch (err) {
      throw err;
    }
  },

  // Transações recentes (vendas) do vendedor
  getRecentesVendedor: async (usuarioId, limite = 10) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.id, pr.nome AS produto, p.valor_total AS valor, p.status, p.criado_em AS data
         FROM pedidos p
         JOIN produtos pr ON p.produto_id = pr.id
         WHERE pr.usuario_id = ?
         ORDER BY p.criado_em DESC
         LIMIT ?`,
        [usuarioId, limite]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Compras recentes feitas pelo próprio usuário (como comprador)
  getRecentesComprador: async (usuarioId, limite = 10) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.id, pr.nome AS produto, p.valor_total AS valor, p.status, p.criado_em AS data
         FROM pedidos p
         JOIN produtos pr ON p.produto_id = pr.id
         WHERE p.comprador_id = ?
         ORDER BY p.criado_em DESC
         LIMIT ?`,
        [usuarioId, limite]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Lista pedidos do comprador filtrando por status (para as abas de "Minhas Compras")
  getPedidosCompradorPorStatus: async (usuarioId, status) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.id, p.produto_id, pr.nome, pr.preco, pr.imagem, pr.local, p.quantidade, p.valor_total, p.status, p.criado_em
         FROM pedidos p
         JOIN produtos pr ON p.produto_id = pr.id
         WHERE p.comprador_id = ? AND p.status = ?
         ORDER BY p.criado_em DESC`,
        [usuarioId, status]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  // Cria um pedido (checkout) a partir de um item do carrinho
  criarPedido: async ({ produtoId, compradorId, quantidade, valorTotal }) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO pedidos (produto_id, comprador_id, quantidade, valor_total, status) VALUES (?, ?, ?, ?, 'pendente')`,
        [produtoId, compradorId, quantidade || 1, valorTotal || 0]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  findPedidoById: async (id) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, pr.usuario_id AS vendedor_id, pr.nome AS produto_nome
         FROM pedidos p JOIN produtos pr ON p.produto_id = pr.id
         WHERE p.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Comprador cancela um pedido próprio ainda pendente
  cancelarPedido: async (id, compradorId) => {
    try {
      const [result] = await pool.query(
        `UPDATE pedidos SET status = 'cancelado' WHERE id = ? AND comprador_id = ? AND status = 'pendente'`,
        [id, compradorId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  },

  // Vendedor marca um pedido de um produto seu como concluído
  concluirPedido: async (id, vendedorId) => {
    try {
      const [result] = await pool.query(
        `UPDATE pedidos p
         JOIN produtos pr ON p.produto_id = pr.id
         SET p.status = 'concluido'
         WHERE p.id = ? AND pr.usuario_id = ? AND p.status = 'pendente'`,
        [id, vendedorId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = produtosModel;
module.exports.usuarioModel = usuarioModel;
module.exports.vendedorModel = vendedorModel;
module.exports.pedidosModel = pedidosModel;

// Garante a existência da tabela de notificações
pool.query(`
  CREATE TABLE IF NOT EXISTS notificacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    link VARCHAR(255) DEFAULT NULL,
    lida TINYINT(1) DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(Usuario_ID) ON DELETE CASCADE
  )
`).catch(err => console.error('Erro ao garantir tabela notificacoes:', err));

const notificacoesModel = {
  criar: async ({ usuarioId, tipo, mensagem, link }) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO notificacoes (usuario_id, tipo, mensagem, link) VALUES (?, ?, ?, ?)`,
        [usuarioId, tipo, mensagem, link || null]
      );
      return result;
    } catch (err) {
      // Notificação nunca deve derrubar o fluxo principal (compra, avaliação, etc.)
      console.error('Erro ao criar notificação:', err);
      return null;
    }
  },

  listarPorUsuario: async (usuarioId, limite = 20) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, tipo, mensagem, link, lida, criado_em
         FROM notificacoes WHERE usuario_id = ?
         ORDER BY criado_em DESC LIMIT ?`,
        [usuarioId, limite]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  contarNaoLidas: async (usuarioId) => {
    try {
      const [[r]] = await pool.query(
        `SELECT COUNT(*) AS total FROM notificacoes WHERE usuario_id = ? AND lida = 0`,
        [usuarioId]
      );
      return r.total || 0;
    } catch (err) {
      throw err;
    }
  },

  marcarLida: async (id, usuarioId) => {
    try {
      await pool.query(`UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?`, [id, usuarioId]);
    } catch (err) {
      throw err;
    }
  },

  marcarTodasLidas: async (usuarioId) => {
    try {
      await pool.query(`UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?`, [usuarioId]);
    } catch (err) {
      throw err;
    }
  }
};

module.exports.notificacoesModel = notificacoesModel;

// Garante a existência da tabela de credenciais WebAuthn (biometria / Face ID)
pool.query(`
  CREATE TABLE IF NOT EXISTS credenciais_webauthn (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    credential_id VARCHAR(255) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    device_name VARCHAR(100) DEFAULT 'Dispositivo',
    transports VARCHAR(100) DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(Usuario_ID) ON DELETE CASCADE
  )
`).catch(err => console.error('Erro ao garantir tabela credenciais_webauthn:', err));

const webauthnModel = {
  addCredential: async ({ usuarioId, credentialId, publicKey, counter, deviceName, transports }) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO credenciais_webauthn (usuario_id, credential_id, public_key, counter, device_name, transports)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usuarioId, credentialId, publicKey, counter || 0, deviceName || 'Dispositivo', transports || null]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  getCredentialsByUsuario: async (usuarioId) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, credential_id, device_name, criado_em FROM credenciais_webauthn WHERE usuario_id = ?`,
        [usuarioId]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  getCredentialByCredentialId: async (credentialId) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM credenciais_webauthn WHERE credential_id = ?`,
        [credentialId]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  // Credenciais registradas por e-mail (para montar o desafio de login sem exigir digitar senha)
  getCredentialsByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        `SELECT c.credential_id, c.transports
         FROM credenciais_webauthn c
         JOIN Usuario u ON u.Usuario_ID = c.usuario_id
         WHERE u.Email = ?`,
        [email]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  },

  atualizarContador: async (credentialId, novoContador) => {
    try {
      await pool.query(`UPDATE credenciais_webauthn SET counter = ? WHERE credential_id = ?`, [novoContador, credentialId]);
    } catch (err) {
      throw err;
    }
  },

  removerCredencial: async (id, usuarioId) => {
    try {
      const [result] = await pool.query(
        `DELETE FROM credenciais_webauthn WHERE id = ? AND usuario_id = ?`,
        [id, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }
};

module.exports.webauthnModel = webauthnModel;