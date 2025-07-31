var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('pages/facilacesso');
});
router.get('/home', function(req, res) {
    res.render('pages/home');
});
router.get('/sobre_nos', function(req, res) {
    res.render('pages/sobre_nos');
});
router.get('/Tipos_de_Energia', function(req, res) {
    res.render('pages/Tipos_de_Energia');
});
router.get('/relatorios', function(req, res) {
    res.render('pages/relatorios');
});
router.get('/como_funciona', function(req, res) {
    res.render('pages/como_funciona');
});
router.get('/cadastro_empresa', function(req, res) {
    res.render('pages/cadastro_empresa');
});


module.exports = router;