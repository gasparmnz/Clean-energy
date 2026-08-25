const multer = require('multer');
const path = require('path');

// Antes: multer.diskStorage salvando os arquivos em app/public/imagem.
// Agora: memoryStorage - o arquivo fica só em memória (req.file.buffer) e
// quem salva de fato é o controller, gravando a imagem no banco de dados
// (ver app/helpers/imagem.js e os controllers que usam uploadProduto/uploadFoto).
const memoryStorage = multer.memoryStorage();

// Upload de imagem de produto
const uploadProduto = multer({
  storage: memoryStorage
});

// Upload de foto de perfil
const uploadFoto = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadProduto, uploadFoto };
