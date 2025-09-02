var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('pages/produtos');
});
router.get('/home', function(req, res) {
    res.render('pages/home');
});



module.exports = router;
