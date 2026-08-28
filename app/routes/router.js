var express = require("express");
var router = express.Router();

const { requireLogin, requireVendedor, requireWebauthn } = require("../middlewares/auth");
const { uploadProduto, uploadFoto } = require("../helpers/upload");

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
router.post("/pagamento/pendente/pagar", requireLogin, pagamentoController.pagarPendente);
router.get("/pagamento/sucesso", requireLogin, pagamentoController.getSucesso);
router.get("/pagamento/falha", requireLogin, pagamentoController.getFalha);
router.get("/pagamento/pendente", requireLogin, pagamentoController.getPendente);
router.post("/pagamento/webhook", pagamentoController.webhook);

/* PERFIL */
router.get("/dashboard", requireLogin, perfilController.getDashboard);
router.get("/perfil", requireLogin, perfilController.getPerfil);
router.post("/perfil/atualizar", requireLogin, perfilController.atualizarPerfil);
router.post("/perfil/foto", requireLogin, uploadFoto.single("foto"), perfilController.atualizarFoto);
router.get("/upgrade_vendedor", requireLogin, perfilController.getUpgradeVendedorForm);
router.post("/upgrade_vendedor", requireLogin, perfilController.validarUpgradeVendedor, perfilController.postUpgradeVendedor);

/* AUTENTICAÇÃO */
router.get("/cadastro", authController.getCadastro);
router.get("/cadastro_vendedor", authController.getCadastroVendedorForm);
router.get("/login", authController.getLogin);
router.get("/logout", authController.getLogout);
router.post("/cadastroUsuario", authController.validarCadastroUsuario, authController.postCadastroUsuario);
router.post("/cadastroEmpresa", authController.validarCadastroEmpresa, authController.postCadastroEmpresa);
router.post("/login", authController.postLogin);
router.get("/recuperar-senha", authController.getRecuperarSenha);
router.post("/recuperar-senha", authController.postRecuperarSenha);
router.get("/redefinir-senha/:token", authController.getRedefinirSenha);
router.post("/redefinir-senha/:token", authController.postRedefinirSenha);

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

module.exports = router;
