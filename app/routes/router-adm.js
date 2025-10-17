var express = require("express");
var router = express.Router();

router.get("/", (req, res) => {
    res.render("pages/adm");
  });

  router.get("/estatisticas", (req, res) => {
    res.render("pages/estatisticas");
  });

  router.get("/controlevendas", (req, res) => {
    res.render("pages/controlevendas");
  });

  module.exports = router;