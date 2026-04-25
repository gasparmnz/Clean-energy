var express = require("express");
var router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/adm");
  });

  router.get("/usuarios_cadastrados", (req, res) => {
    res.render("pages/usuarios_cadastrados");
  });

  router.get("/produtos_adm", (req, res) => {
    res.render("pages/produtos_adm");
  });

  router.get("/detalhes_user", (req, res) => {
    res.render("pages/detalhes_user");
  });

  

  module.exports = router;