var express = require("express");
var router = express.Router();

const { requireLogin, requireVendedor, requireWebauthn } = require("../middlewares/auth");
const { uploadProduto, uploadFoto } = require("../helpers/upload");

<<<<<<< HEAD
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

function requireVendedor(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.perfil !== 'vendedor') return res.redirect('/?erro=acesso_restrito');
  next();
}



/* ROTAS */
router.get("/", async (req, res) => {
  const { busca, estado, categoria, precoMin, precoMax } = req.query;
  try {
    const produtos = await produtosModel.findAllComFiltros({ busca, estado, categoria, precoMin, precoMax });
    res.render("pages/produtos", {
      produtos,
      filtros: { busca: busca||'', estado: estado||'', categoria: categoria||'', precoMin: precoMin||'', precoMax: precoMax||'' }
    });
  } catch (err) {
    console.error('Erro ao buscar produtos:', err.message);
    res.render("pages/produtos", { produtos: [], filtros: {} });
  }
});

router.get("/home", (req, res) => res.render("pages/home"));

// Rota para comprador se tornar vendedor
router.get("/upgrade_vendedor", requireLogin, async (req, res) => {
  if (req.session.perfil !== 'comprador') {
    return res.redirect('/?erro=acesso_restrito');
  }
  res.render("pages/upgrade_vendedor", { 
    valoresEmpresa: { nome: req.session.nomeUsuario, email: req.session.emailUsuario, company_name: '', company_email: '', cnpj: '' }, 
    erroValidacaoEmpresa: {}, 
    msgErroEmpresa: {} 
  });
});

// POST para upgrade de vendedor
router.post("/upgrade_vendedor",
  requireLogin,

 body("company_name")
  .trim()
  .notEmpty().withMessage("*Campo obrigatório!")
  .isLength({ min: 3 }).withMessage("*Nome da empresa muito curto"),

body("company_email")
  .trim()
  .notEmpty().withMessage("*Campo obrigatório!")
  .isEmail().withMessage("*E-mail inválido!"),

body("cnpj")
  .notEmpty().withMessage("*Campo obrigatório!")
  .custom((value) => {
    if (value.replace(/\D/g, '').length !== 14) {
      throw new Error("*O CNPJ deve conter 14 números!");
    }
    return true;
  }),

  async (req, res) => {
    if (req.session.perfil !== 'comprador') {
      return res.redirect('/?erro=acesso_restrito');
    }

    const errors = validationResult(req);
    const valoresEmpresa = {
      nome: req.session.nomeUsuario,
      email: req.session.emailUsuario,
      company_name: req.body.company_name || '',
      company_email: req.body.company_email || '',
      cnpj: req.body.cnpj || ''
    };
    if (!errors.isEmpty()) {
      const erroValidacaoEmpresa = {}, msgErroEmpresa = {};
      errors.array().forEach(e => { erroValidacaoEmpresa[e.path]='erro'; msgErroEmpresa[e.path]=e.msg; });
      return res.render("pages/upgrade_vendedor", { valoresEmpresa, erroValidacaoEmpresa, msgErroEmpresa });
    }

    try {
      const companyName = req.body.company_name.trim();
      const cnpjNumeros = req.body.cnpj.replace(/\D/g, '');

      const existing = await usuarioModel.findByCNPJ(cnpjNumeros);
      if (existing) {
        return res.render("pages/upgrade_vendedor", {
          valoresEmpresa,
          erroValidacaoEmpresa: { cnpj: 'erro' },
          msgErroEmpresa: { cnpj: '*Este CNPJ já está cadastrado!' }
        });
      }

      await usuarioModel.upgradeParaVendedor(req.session.userId, { companyName, cnpj: cnpjNumeros });

      req.session.perfil = 'vendedor';
      req.session.tipo = 'PJ';

      return res.redirect('/perfil');
    } catch (err) {
      console.error('Erro ao fazer upgrade para vendedor:', err);
      res.status(500).send('Erro ao fazer upgrade. Tente novamente.');
    }
  }
);

router.get("/minhascompras", requireLogin, (req, res) => {
  const pendentes = req.session.pedidosPendentes || [];
  const concluidos = req.session.pedidosConcluidos || [];
  res.render("pages/minhascompras", { pendentes, concluidos });
});

// Move itens do carrinho para pedidos pendentes na sessão
router.post("/minhascompras/finalizar", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await cartModel.getCartByUser(userId);
    if (cart && cart.length > 0) {
      req.session.pedidosPendentes = cart;
      const pool = require('../../config/pool_conexoes');
      await pool.query('DELETE FROM carrinho WHERE userId = ?', [userId]);

      // Notifica cada vendedor sobre o novo pedido
      for (const item of cart) {
        try {
          const produto = await produtosModel.findById(item.productId);
          if (produto && produto.usuario_id) {
            await notificacoesModel.criar({
              usuarioId: produto.usuario_id,
              tipo: 'novo_pedido',
              mensagem: `Novo pedido recebido: ${item.nome}`,
              link: '/listaprodutos'
            });
          }
        } catch (e) { console.error('Erro ao notificar vendedor sobre novo pedido:', e); }
      }
    }
    res.redirect('/minhascompras');
  } catch (err) {
    console.error('Erro ao finalizar compra:', err);
    res.redirect('/carrinho');
  }
});



// ── Atualizar perfil
router.post("/perfil/atualizar", requireLogin, async (req, res) => {
  const { nome, biografia } = req.body;
  if (!nome || nome.trim().length < 2) {
    return res.json({ sucesso: false, erro: 'Nome muito curto.' });
  }
  try {
    await usuarioModel.updatePerfil(req.session.userId, { nome: nome.trim(), biografia });
    req.session.nomeUsuario = nome.trim();
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.json({ sucesso: false, erro: 'Erro ao atualizar.' });
  }
});

router.post("/perfil/foto", requireLogin, uploadFoto.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ sucesso: false, erro: 'Nenhuma imagem enviada.' });
    }

    const filename = req.file.filename;
    await usuarioModel.updateFoto(req.session.userId, filename);
    req.session.fotoUsuario = filename;

    return res.json({
      sucesso: true,
      foto: `/imagem/${filename}`
    });
  } catch (err) {
    console.error('Erro upload foto:', err);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao salvar foto.'
    });
  }
});

router.get("/perfil", requireLogin, async (req, res) => {
  try {
    const usuarioDados = await usuarioModel.findById(req.session.userId);

    if (usuarioDados) {
      usuarioDados.perfil = req.session.perfil;
      usuarioDados.nome = usuarioDados.Nome;
      if (usuarioDados.foto) req.session.fotoUsuario = usuarioDados.foto;
      res.locals.usuario = { ...res.locals.usuario, ...usuarioDados, foto: usuarioDados.foto || null };
    }

    res.render("pages/perfil", {
      usuario: usuarioDados,
    });
  } catch (err) {
    res.render("pages/perfil", { usuario: null });
  }
});

router.get("/painel", requireLogin, (req, res) => res.render("pages/painel"));
router.get("/meus_produtos", requireLogin, (req, res) => res.render("pages/meus_produtos"));

router.get("/listaprodutos", requireLogin, async (req, res) => {
  try {
    const produtos = await produtosModel.findByUsuario(req.session.userId);
    res.render("pages/listaprodutos", { produtos });
  } catch (err) {
    console.error('Erro ao buscar produtos do usuário:', err);
    res.render("pages/listaprodutos", { produtos: [] });
  }
});

router.get("/carrinho", async (req, res) => {
  try {
    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);
    res.render("pages/carrinho", { cart });
  } catch (err) {
    res.status(500).send('Erro ao obter carrinho');
  }
});

router.post("/pagamento/criar", requireLogin, async (req, res) => {
  console.log(">>> ROTA DE PAGAMENTO FOI CHAMADA!");
  try {

    const userId = req.session.userId || req.sessionID;
    const cart = await cartModel.getCartByUser(userId);

    if (!cart || cart.length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: "Seu carrinho está vazio."
      });
    }

    const items = cart.map(item => ({
      id: String(item.productId),
      title: item.nome,
      quantity: item.quantidade,
      currency_id: "BRL",
      unit_price: Number(item.preco)
    }));

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;


const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

const preferenceBody = {
  items,
  back_urls: {
    success: `${baseUrl}/pagamento/sucesso`,
    failure: `${baseUrl}/pagamento/falha`,
    pending: `${baseUrl}/pagamento/pendente`
  },
  notification_url: `${baseUrl}/pagamento/webhook`
};

if (!isLocalhost) {
  preferenceBody.auto_return = "approved";
}

const preference = await preferenceClient.create({
  body: preferenceBody
});

    console.log("Preference criada!");
    console.log(preference);

    // Move os itens do carrinho para "pendentes" assim que o checkout é iniciado
    req.session.pedidosPendentes = [...(req.session.pedidosPendentes || []), ...cart];
    const pool = require('../../config/pool_conexoes');
    await pool.query('DELETE FROM carrinho WHERE CAST(userId AS CHAR) = ?', [String(userId)]);
    for (const item of cart) {
      try {
        const produto = await produtosModel.findById(item.productId);
        if (produto && produto.usuario_id) {
          await notificacoesModel.criar({
            usuarioId: produto.usuario_id,
            tipo: 'novo_pedido',
            mensagem: `Novo pedido recebido: ${item.nome}`,
            link: '/listaprodutos'
          });
        }
      } catch (e) { console.error('Erro ao notificar vendedor sobre novo pedido:', e); }
    }

    res.json({
      sucesso: true,
      initPoint: preference.init_point
    });

  } catch (err) {

    console.error("ERRO COMPLETO:");
    console.error(err);

    res.status(500).json({
      sucesso: false,
      erro: err.message
    });
  }
});

router.post('/cart/add', async (req, res) => {
  try {
    const { productId, quantidade } = req.body;
    const produto = await produtosModel.findById(productId);
    if (!produto) return res.status(404).send('Produto não encontrado');
    const userId = req.session.userId || req.sessionID;
    await cartModel.addItem(userId, { productId, nome: produto.nome, preco: produto.preco, imagem: produto.imagem, local: produto.local, quantidade: parseInt(quantidade,10)||1 });
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao adicionar ao carrinho: ' + err.message);
  }
});

router.post('/cart/remove', async (req, res) => {
  try {
    const userId = req.session.userId || req.sessionID;
    await cartModel.removeByIndex(userId, parseInt(req.body.index));
    res.redirect('/carrinho');
  } catch (err) {
    res.status(500).send('Erro ao remover do carrinho');
  }
});

router.get("/transporte", (req, res) => res.render("pages/transporte"));
router.get("/duvidas", (req, res) => res.render("pages/duvidas"));

// Chatbot de IA da página de Dúvidas (Google Gemini)
// A pergunta chega do front-end e a resposta é gerada aqui no servidor,
// para que a chave da API do Gemini nunca fique exposta no front-end.
router.post("/duvidas/chat", async (req, res) => {
  try {
    const { pergunta, historico } = req.body;

    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return res.status(400).json({ erro: 'Digite uma pergunta antes de enviar.' });
    }

    const resposta = await geminiChat.responderDuvida(pergunta, Array.isArray(historico) ? historico : []);
    res.json({ resposta });
  } catch (err) {
    if (err.message === 'CHAVE_API_AUSENTE') {
      console.error('[Chatbot Dúvidas] GEMINI_API_KEY não configurada no .env');
      return res.status(503).json({ erro: 'O assistente virtual está indisponível no momento. Tente novamente mais tarde.' });
    }
    if (err.message === 'ERRO_API_GEMINI') {
      // O log detalhado (status, causa provável) já foi impresso no console pelo geminiChat.js
      if (err.status === 401 || err.status === 403) {
        return res.status(503).json({ erro: 'Não foi possível autenticar com o assistente de IA. Verifique a chave da API do Gemini no servidor.' });
      }
      if (err.status === 429) {
        return res.status(503).json({ erro: 'O assistente de IA está com muitas solicitações no momento. Tente novamente em instantes.' });
      }
      return res.status(500).json({ erro: 'Não foi possível obter uma resposta agora. Tente novamente em instantes.' });
    }
    console.error('Erro ao consultar o chatbot de dúvidas:', err.message);
    res.status(500).json({ erro: 'Não foi possível obter uma resposta agora. Tente novamente em instantes.' });
  }
});
router.get("/sobre_nos", (req, res) => res.render("pages/sobre_nos"));

router.get("/adicione_produto", (req, res) => {
  res.render("pages/adicione_produto");
});

router.get("/cadastrar_produto", requireVendedor, (req, res) => res.render("pages/cadastrar_produto"));
router.get("/cadastro_vendedor", (req, res) => res.render("pages/cadastro_vendedor", { valoresEmpresa: { nome:'',cnpj:'',email:'',senha:'',confirmarSenha:'' }, erroValidacaoEmpresa:{}, msgErroEmpresa:{}, retorno:null }));

router.get("/item/:id", async function (req, res) {
  try {
    const produto = await produtosModel.findById(req.params.id);
    if (!produto) return res.status(404).send("Produto não encontrado");

    const avaliacoes = await produtosModel.findAvaliacoes(req.params.id);

    const mediaNotas = avaliacoes.length
      ? (avaliacoes.reduce((s, a) => s + (a.Nota || 0), 0) / avaliacoes.length).toFixed(1)
      : null;

    let vendedor = null;
    if (produto.usuario_id) {
      vendedor = await vendedorModel.findUsuarioById(produto.usuario_id);
      if (vendedor) {
        const avgData = await vendedorModel.findMediaAvaliacao(produto.usuario_id);
        vendedor.mediaAvaliacao = avgData.media || null;
        vendedor.totalAvaliacoes = avgData.total || 0;
        vendedor.totalProdutos = await vendedorModel.findTotalProdutos(produto.usuario_id);
      }
    }

    const usuarioSessao = req.session.userId
      ? { id: req.session.userId, nome: req.session.nomeUsuario, perfil: req.session.perfil }
      : null;

    res.render("pages/item", { produto, avaliacoes, mediaNotas, vendedor, usuario: usuarioSessao });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
});

// ── POST avaliação de produto
router.post("/item/:id/avaliar", requireLogin, async (req, res) => {
  const produtoId = req.params.id;
  const { nota, comentario } = req.body;
  const notaNum = parseInt(nota, 10);

  if (!notaNum || notaNum < 1 || notaNum > 5) {
    return res.redirect(`/item/${produtoId}?erro=nota`);
  }

  try {
    const jaAvaliou = await produtosModel.findAvaliacaoByUsuario(req.session.userId, produtoId);

    if (jaAvaliou) {
      await produtosModel.updateAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId });
    } else {
      await produtosModel.createAvaliacao({ nota: notaNum, comentario, usuarioId: req.session.userId, produtoId, nomeUsuario: req.session.nomeUsuario });
      try {
        const produto = await produtosModel.findById(produtoId);
        if (produto && produto.usuario_id && Number(produto.usuario_id) !== Number(req.session.userId)) {
          await notificacoesModel.criar({
            usuarioId: produto.usuario_id,
            tipo: 'nova_avaliacao',
            mensagem: `Seu produto "${produto.nome}" recebeu uma nova avaliação.`,
            link: `/item/${produtoId}#comentarios`
          });
        }
      } catch (e) { console.error('Erro ao notificar avaliação de produto:', e); }
    }

    res.redirect(`/item/${produtoId}#comentarios`);
  } catch (err) {
    console.error('Erro ao salvar avaliação:', err);
    res.redirect(`/item/${produtoId}?erro=salvar`);
  }
});

router.post("/cadastrar_produto", requireVendedor, uploadProduto.single('imagem'), async (req, res) => {
  const { nome, descricao, preco, quantidade, categoria, cidade, bairro, rua, numero, complemento, estado } = req.body;
  const local = [cidade, bairro, rua, numero, complemento].filter(Boolean).join(', ');

  const imagemFilename = req.file ? req.file.filename : 'sem-foto.png';

  let precoLimpo = (preco || '0').toString().trim()
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const precoNumerico = parseFloat(precoLimpo) || 0;

  let quantidadeLimpa = (quantidade || '0').toString().trim()
    .replace(/ t$/i, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const quantidadeNumerica = parseFloat(quantidadeLimpa) || 0;

  try {
    await produtosModel.create({ nome, descricao, preco: precoNumerico, quantidade: quantidadeNumerica, categoria, local, imagem: imagemFilename, estado, usuario_id: req.session.userId });
    res.redirect('/listaprodutos');
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).send('Erro ao cadastrar produto. Tente novamente.');
  }
});
=======
const paginaController = require("../controllers/paginaController");
const produtoController = require("../controllers/produtoController");
const carrinhoController = require("../controllers/carrinhoController");
const pagamentoController = require("../controllers/pagamentoController");
const perfilController = require("../controllers/perfilController");
const authController = require("../controllers/authController");
const vendedorController = require("../controllers/vendedorController");
const notificacaoController = require("../controllers/notificacaoController");
const biometriaController = require("../controllers/biometriaController");
const duvidasController = require("../controllers/duvidasController");
const adminController = require("../controllers/adminController");

/* PÁGINAS / PRODUTOS */
router.get("/", produtoController.listarProdutos);
router.get("/home", paginaController.getHome);
router.get("/transporte", paginaController.getTransporte);
router.get("/sobre_nos", paginaController.getSobreNos);
router.get("/adicione_produto", paginaController.getAdicioneProduto);
router.get("/painel", requireLogin, paginaController.getPainel);
router.get("/meus_produtos", requireLogin, paginaController.getMeusProdutos);

router.get("/cadastrar_produto", requireVendedor, produtoController.getCadastrarProdutoForm);
router.post("/cadastrar_produto", requireVendedor, uploadProduto.single("imagem"), produtoController.postCadastrarProduto);
router.get("/listaprodutos", requireLogin, produtoController.getListaProdutos);
router.get("/item/:id", produtoController.getItem);
router.post("/item/:id/avaliar", requireLogin, produtoController.avaliarItem);
router.delete("/produtos/:id", requireVendedor, produtoController.deleteProduto);

/* CARRINHO */
router.get("/carrinho", carrinhoController.getCarrinho);
router.post("/cart/add", carrinhoController.addToCart);
router.post("/cart/remove", carrinhoController.removeFromCart);

/* PAGAMENTO / PEDIDOS */
router.get("/minhascompras", requireLogin, pagamentoController.getMinhasCompras);
router.post("/minhascompras/finalizar", requireLogin, pagamentoController.finalizarCompra);
router.post("/pagamento/criar", requireLogin, pagamentoController.criarPagamento);
router.get("/pagamento/sucesso", requireLogin, pagamentoController.getSucesso);
router.get("/pagamento/falha", requireLogin, pagamentoController.getFalha);
router.get("/pagamento/pendente", requireLogin, pagamentoController.getPendente);
router.post("/pagamento/webhook", pagamentoController.webhook);

/* PERFIL */
router.get("/perfil", requireLogin, perfilController.getPerfil);
router.post("/perfil/atualizar", requireLogin, perfilController.atualizarPerfil);
router.post("/perfil/foto", requireLogin, uploadFoto.single("foto"), perfilController.atualizarFoto);
router.get("/upgrade_vendedor", requireLogin, perfilController.getUpgradeVendedorForm);
router.post("/upgrade_vendedor", requireLogin, perfilController.validarUpgradeVendedor, perfilController.postUpgradeVendedor);
>>>>>>> f2d47f39c319642df8a05a6fa991e87b973df0e0

/* AUTENTICAÇÃO */
router.get("/cadastro", authController.getCadastro);
router.get("/cadastro_vendedor", authController.getCadastroVendedorForm);
router.get("/login", authController.getLogin);
router.get("/logout", authController.getLogout);
router.post("/cadastroUsuario", authController.validarCadastroUsuario, authController.postCadastroUsuario);
router.post("/cadastroEmpresa", authController.validarCadastroEmpresa, authController.postCadastroEmpresa);
router.post("/login", authController.postLogin);

/* ADMIN LOGIN (rota fica fora do prefixo /adm, então continua aqui) */
router.get("/adm-login", adminController.getAdmLogin);
router.post("/adm-login", adminController.postAdmLogin);

/* PERFIL PÚBLICO DO VENDEDOR */
router.get("/vendedor/:id", vendedorController.getPerfilVendedor);
router.post("/vendedor/:id/avaliar", requireLogin, vendedorController.avaliarVendedor);

/* NOTIFICAÇÕES */
router.get("/notificacoes", requireLogin, notificacaoController.listar);
router.get("/notificacoes/nao-lidas", requireLogin, notificacaoController.contarNaoLidas);
router.post("/notificacoes/:id/ler", requireLogin, notificacaoController.marcarLida);
router.post("/notificacoes/marcar-todas-lidas", requireLogin, notificacaoController.marcarTodasLidas);

/* BIOMETRIA / FACE ID (WebAuthn) */
router.get("/perfil/biometria/listar", requireLogin, biometriaController.listarCredenciais);
router.get("/perfil/biometria/opcoes-registro", requireLogin, requireWebauthn, biometriaController.opcoesRegistro);
router.post("/perfil/biometria/verificar-registro", requireLogin, requireWebauthn, biometriaController.verificarRegistro);
router.post("/perfil/biometria/remover/:id", requireLogin, biometriaController.removerCredencial);
router.post("/login/biometria/opcoes", requireWebauthn, biometriaController.opcoesLoginBiometria);
router.post("/login/biometria/verificar", requireWebauthn, biometriaController.verificarLoginBiometria);

/* DÚVIDAS / CHATBOT */
router.get("/duvidas", duvidasController.getDuvidas);
router.post("/duvidas/chat", duvidasController.postChat);

<<<<<<< HEAD
// Lista os dispositivos biométricos cadastrados do usuário logado
router.get("/perfil/biometria/listar", requireLogin, async (req, res) => {
  try {
    const credenciais = await webauthnModel.getCredentialsByUsuario(req.session.userId);
    res.json({ credenciais, disponivel: webauthnDisponivel });
  } catch (err) {
    console.error('Erro ao listar credenciais biométricas:', err);
    res.status(500).json({ credenciais: [], disponivel: webauthnDisponivel });
  }
});

// Gera o desafio para cadastrar biometria/Face ID neste dispositivo
router.get("/perfil/biometria/opcoes-registro", requireLogin, requireWebauthn, async (req, res) => {
  try {
    const existentes = await webauthnModel.getCredentialsByUsuario(req.session.userId);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: Buffer.from(String(req.session.userId)),
      userName: req.session.emailUsuario || 'usuario',
      userDisplayName: req.session.nomeUsuario || 'Usuário',
      attestationType: 'none',
      excludeCredentials: existentes.map(c => ({ id: c.credential_id, type: 'public-key' })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform' // biometria/Face ID do próprio dispositivo
      }
    });
    req.session.webauthnChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    console.error('Erro ao gerar opções de registro WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao gerar opções de registro.' });
  }
});

// Verifica e salva a credencial biométrica recém-criada no navegador
router.post("/perfil/biometria/verificar-registro", requireLogin, requireWebauthn, async (req, res) => {
  try {
    const expectedChallenge = req.session.webauthnChallenge;
    if (!expectedChallenge) return res.status(400).json({ error: 'Desafio expirado. Tente novamente.' });

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Não foi possível verificar o registro.' });
    }

    const info = verification.registrationInfo;
    // Compatibilidade entre versões da lib (algumas expõem `credential`, outras campos separados)
    const credential = info.credential || {
      id: info.credentialID,
      publicKey: info.credentialPublicKey,
      counter: info.counter
    };

    const credentialIdStr = typeof credential.id === 'string'
      ? credential.id
      : Buffer.from(credential.id).toString('base64url');
    const publicKeyStr = Buffer.from(credential.publicKey).toString('base64');
    const transports = Array.isArray(req.body?.response?.transports)
      ? req.body.response.transports.join(',')
      : null;

    await webauthnModel.addCredential({
      usuarioId: req.session.userId,
      credentialId: credentialIdStr,
      publicKey: publicKeyStr,
      counter: credential.counter || 0,
      deviceName: (req.body && req.body.deviceName) || 'Dispositivo',
      transports
    });

    delete req.session.webauthnChallenge;
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao verificar registro WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao verificar registro.' });
  }
});

// Remove uma credencial biométrica cadastrada
router.post("/perfil/biometria/remover/:id", requireLogin, async (req, res) => {
  try {
    const ok = await webauthnModel.removerCredencial(req.params.id, req.session.userId);
    res.json({ success: ok });
  } catch (err) {
    console.error('Erro ao remover credencial biométrica:', err);
    res.status(500).json({ success: false });
  }
});

// Gera o desafio de login biométrico a partir do e-mail informado
router.post("/login/biometria/opcoes", requireWebauthn, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });

    const credenciais = await webauthnModel.getCredentialsByEmail(email);
    if (credenciais.length === 0) {
      return res.status(404).json({ error: 'Nenhuma biometria cadastrada para este e-mail.' });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: credenciais.map(c => ({
        id: c.credential_id,
        type: 'public-key',
        transports: c.transports ? c.transports.split(',') : undefined
      }))
    });

    req.session.webauthnChallenge = options.challenge;
    req.session.webauthnEmail = email;
    res.json(options);
  } catch (err) {
    console.error('Erro ao gerar opções de login WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao gerar opções de login.' });
  }
});

// Verifica a resposta biométrica e efetiva o login
router.post("/login/biometria/verificar", requireWebauthn, async (req, res) => {
  try {
    const expectedChallenge = req.session.webauthnChallenge;
    const email = req.session.webauthnEmail;
    if (!expectedChallenge || !email) {
      return res.status(400).json({ error: 'Sessão de login expirada. Tente novamente.' });
    }

    const credentialIdRecebido = req.body.id;
    const credencial = await webauthnModel.getCredentialByCredentialId(credentialIdRecebido);
    if (!credencial) return res.status(400).json({ error: 'Credencial não reconhecida.' });

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credencial.credential_id,
        publicKey: Buffer.from(credencial.public_key, 'base64'),
        counter: Number(credencial.counter)
      }
    });

    if (!verification.verified) {
      return res.status(401).json({ error: 'Verificação biométrica falhou.' });
    }

    await webauthnModel.atualizarContador(
      credencial.credential_id,
      verification.authenticationInfo.newCounter
    );

    const usuario = await usuarioModel.findByEmail(email);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (usuario.status === 'suspended') {
      return res.status(403).json({ error: 'Sua conta foi suspensa pelo administrador.' });
    }

    req.session.userId = usuario.Usuario_ID;
    req.session.nomeUsuario = usuario.Nome;
    req.session.emailUsuario = usuario.Email;
    req.session.perfil = usuario.Tipo === 'PJ' ? 'vendedor' : 'comprador';
    req.session.tipo = usuario.Tipo;
    delete req.session.webauthnChallenge;
    delete req.session.webauthnEmail;

    res.json({ success: true, redirect: '/perfil' });
  } catch (err) {
    console.error('Erro ao verificar login WebAuthn:', err);
    res.status(500).json({ error: 'Erro ao verificar login.' });
  }
});



router.get("/pagamento/sucesso", requireLogin, (req, res) => {
    const pendentes = req.session.pedidosPendentes || [];
    if (pendentes.length > 0) {
      req.session.pedidosConcluidos = [...(req.session.pedidosConcluidos || []), ...pendentes];
      req.session.pedidosPendentes = [];
    }
    res.render("pages/pagamento-sucesso");
});

router.get("/pagamento/falha", requireLogin, (req, res) => {
    res.render("pages/pagamento-falha");
});

router.get("/pagamento/pendente", requireLogin, (req, res) => {
    res.render("pages/pagamento-pendente");
});

router.post("/pagamento/webhook", async (req, res) => {

    console.log("Notificação recebida do Mercado Pago");

    console.log(req.body);

    res.sendStatus(200);
});

module.exports = router;
=======
module.exports = router;
>>>>>>> f2d47f39c319642df8a05a6fa991e87b973df0e0
