var express = require("express");
var router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/adm");
  });

  router.get("/usuarios_cadastrados", (req, res) => {
    res.render("pages/usuarios_cadastrados");
  });

  router.get("/controlevendas", (req, res) => {
    res.render("pages/controlevendas");
  });

  module.exports = router;