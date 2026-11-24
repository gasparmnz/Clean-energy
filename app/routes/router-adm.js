var express = require("express");
var router = express.Router();

const adminController = require("../controllers/adminController");

router.get("/", adminController.getDashboard);

router.get("/usuarios_cadastrados", adminController.getUsuariosCadastrados);
router.post("/usuarios/suspender", adminController.suspenderUsuario);
router.post("/usuarios/reativar", adminController.reativarUsuario);
router.post("/usuarios/excluir", adminController.excluirUsuario);

router.get("/detalhes_user", adminController.getDetalhesUser);
router.get("/editar_usuario", adminController.getEditarUsuario);
router.post("/editar_usuario/atualizar", adminController.postEditarUsuario);

router.get("/produtos_adm", adminController.getProdutosAdm);
router.post("/produtos_adm/toggle_status", adminController.toggleStatusProduto);
router.post("/produtos_adm/edit", adminController.editarProdutoAdm);

router.post("/avaliacoes/reativar", adminController.reativarAvaliacao);
router.post("/avaliacoes/suspender", adminController.suspenderAvaliacao);

module.exports = router;
