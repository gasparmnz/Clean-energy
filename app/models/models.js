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

  // Atualiza apenas os campos enviados em `dados` (nome, descricao, local,
  // preco, quantidade). Antes só gravava nome e quantidade, então preço e
  // endereço editados nunca chegavam ao banco.
  // Com `opcoes.usuarioId`, o UPDATE só acontece se o produto pertencer a
  // esse usuário (WHERE ... AND usuario_id = ?) — result.affectedRows = 0
  // indica que o produto não existe ou é de outro vendedor.
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

  // Salva o hash do token de redefinição de senha e sua validade
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

  // Busca usuário por hash do token, desde que ainda válido
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

  // Define nova senha e invalida o token de redefinição
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

    // Colunas adicionadas depois: garante que existam mesmo se a tabela já tiver sido criada por uma versão anterior
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
    } catch (e) { /* já está correto */ }

    pedidoModel._tabelaCriada = true;
  },

  // Cria o pedido já ao iniciar o checkout, como 'pendente' — o webhook confirma o pagamento depois
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

  // Chamado pelo webhook do Mercado Pago quando o pagamento é aprovado
  marcarPago: async (externalRef) => {
    await pedidoModel._garantirTabela();
    const [result] = await pool.query(
      "UPDATE pedidos SET status = 'em_transito' WHERE external_ref = ? AND status = 'pendente'",
      [externalRef]
    );
    return result.affectedRows;
  },

  // Comprador confirma o recebimento
  marcarConcluido: async (id, compradorId) => {
    await pedidoModel._garantirTabela();
    const [result] = await pool.query(
      "UPDATE pedidos SET status = 'concluido' WHERE id = ? AND comprador_id = ? AND status = 'em_transito'",
      [id, compradorId]
    );
    return result.affectedRows;
  },

  // Lista os pedidos de um comprador, separados por status, para a tela "Minhas Compras"
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

  // Busca um pedido pendente específico do comprador (usado para reemitir o checkout)
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

/* ════════════════════════════════════════════════
   NOTIFICAÇÕES (comprador/vendedor)
   ════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════
   BIOMETRIA / FACE ID (WebAuthn)
   ════════════════════════════════════════════════ */
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