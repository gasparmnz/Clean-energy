const pool = require("../../config/pool_conexoes");

const produtosModel = {
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

  update: async (id, dados, opcoes = {}) => {
    try {
      const colunas = ['nome', 'descricao', 'local', 'preco', 'quantidade'];
      const sets = [];
      const valores = [];
      for (const coluna of colunas) {
        if (dados[coluna] !== undefined) {
          sets.push(`${coluna} = ?`);
          valores.push(dados[coluna]);
        }
      }
      if (sets.length === 0) return { affectedRows: 0 };

      let sql = `UPDATE produtos SET ${sets.join(', ')} WHERE id = ?`;
      valores.push(id);
      if (opcoes.usuarioId !== undefined) {
        sql += ' AND usuario_id = ?';
        valores.push(opcoes.usuarioId);
      }
      const [result] = await pool.query(sql, valores);
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
  findById: async (id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM Usuario WHERE Usuario_ID = ?", [id]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query("SELECT * FROM Usuario WHERE Email = ?", [email]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

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

  updateUltimoLogin: async (id) => {
    try {
      await pool.query("UPDATE Usuario SET Ultimo_Login = NOW() WHERE Usuario_ID = ?", [id]);
    } catch (err) {
      throw err;
    }
  },

  setResetToken: async (id, tokenHash, expiraEm) => {
    try {
      await pool.query(
        "UPDATE Usuario SET Reset_Token_Hash = ?, Reset_Token_Expires = ? WHERE Usuario_ID = ?",
        [tokenHash, expiraEm, id]
      );
    } catch (err) {
      throw err;
    }
  },

  findByResetTokenHash: async (tokenHash) => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM Usuario WHERE Reset_Token_Hash = ? AND Reset_Token_Expires > NOW()",
        [tokenHash]
      );
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

  updateSenhaELimparToken: async (id, senhaHash) => {
    try {
      await pool.query(
        "UPDATE Usuario SET Senha = ?, Reset_Token_Hash = NULL, Reset_Token_Expires = NULL WHERE Usuario_ID = ?",
        [senhaHash, id]
      );
    } catch (err) {
      throw err;
    }
  },

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

  createPessoaFisica: async (usuarioId, cpf) => {
    try {
      await pool.query("INSERT INTO Pessoa_Fisica (Usuario_ID, CPF) VALUES (?, ?)", [usuarioId, cpf]);
    } catch (err) {
      throw err;
    }
  },

  createPessoaJuridica: async (usuarioId, cnpj) => {
    try {
      await pool.query("INSERT INTO Pessoa_Juridica (Usuario_ID, CNPJ) VALUES (?, ?)", [usuarioId, cnpj]);
    } catch (err) {
      throw err;
    }
  },

  findByCNPJ: async (cnpj) => {
    try {
      const [rows] = await pool.query("SELECT Usuario_ID FROM Pessoa_Juridica WHERE CNPJ = ?", [cnpj]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  },

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
const pedidoModel = {
  _tabelaCriada: false,
  _garantirTabela: async () => {
    if (pedidoModel._tabelaCriada) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        comprador_id INT NOT NULL,
        produto_id INT DEFAULT NULL,
        valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        status ENUM('pendente','em_transito','concluido','cancelado') NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    `);

    const colunasNovas = [
      "nome VARCHAR(255) DEFAULT NULL",
      "preco DECIMAL(10,2) NOT NULL DEFAULT 0.00",
      "quantidade INT NOT NULL DEFAULT 1",
      "imagem VARCHAR(255) DEFAULT NULL",
      "local VARCHAR(255) DEFAULT NULL",
      "estado VARCHAR(2) DEFAULT NULL",
      "external_ref VARCHAR(100) DEFAULT NULL"
    ];
    for (const definicao of colunasNovas) {
      try {
        await pool.query(`ALTER TABLE pedidos ADD COLUMN ${definicao}`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }
    try {
      await pool.query("ALTER TABLE pedidos MODIFY status ENUM('pendente','em_transito','concluido','cancelado') NOT NULL DEFAULT 'pendente'");
    } catch (e) { }

    pedidoModel._tabelaCriada = true;
  },

  criarPendente: async ({ compradorId, produtoId, nome, preco, quantidade, imagem, local, estado, externalRef }) => {
    await pedidoModel._garantirTabela();
    const valorTotal = Number(preco) * (quantidade || 1);
    const [result] = await pool.query(
      `INSERT INTO pedidos
        (comprador_id, produto_id, nome, preco, quantidade, imagem, local, estado, valor_total, external_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [compradorId, produtoId, nome, preco, quantidade || 1, imagem, local, estado, valorTotal, externalRef]
    );
    return result.insertId;
  },

  marcarPago: async (externalRef) => {
    await pedidoModel._garantirTabela();
    const [result] = await pool.query(
      "UPDATE pedidos SET status = 'em_transito' WHERE external_ref = ? AND status = 'pendente'",
      [externalRef]
    );
    return result.affectedRows;
  },

  marcarConcluido: async (id, compradorId) => {
    await pedidoModel._garantirTabela();
    const [result] = await pool.query(
      "UPDATE pedidos SET status = 'concluido' WHERE id = ? AND comprador_id = ? AND status = 'em_transito'",
      [id, compradorId]
    );
    return result.affectedRows;
  },

  listarPorComprador: async (compradorId) => {
    await pedidoModel._garantirTabela();
    const [rows] = await pool.query(
      "SELECT * FROM pedidos WHERE comprador_id = ? ORDER BY criado_em DESC",
      [compradorId]
    );
    return {
      pendentes: rows.filter(p => p.status === 'pendente'),
      emTransito: rows.filter(p => p.status === 'em_transito'),
      concluidos: rows.filter(p => p.status === 'concluido')
    };
  },

  buscarPendentePorId: async (id, compradorId) => {
    await pedidoModel._garantirTabela();
    const [rows] = await pool.query(
      "SELECT * FROM pedidos WHERE id = ? AND comprador_id = ? AND status = 'pendente'",
      [id, compradorId]
    );
    return rows[0] || null;
  }
};


module.exports.pedidoModel = pedidoModel;
module.exports.usuarioModel = usuarioModel;
module.exports.vendedorModel = vendedorModel;

const notificacoesModel = {
  criar: async ({ usuarioId, tipo, mensagem, link }) => {
    try {
      const [result] = await pool.query(
        `INSERT INTO notificacoes (usuario_id, tipo, mensagem, link) VALUES (?, ?, ?, ?)`,
        [usuarioId, tipo, mensagem, link || null]
      );
      return result;
    } catch (err) {
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