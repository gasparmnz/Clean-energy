const multer = require('multer');
const path = require('path');

const imagemDir = path.join(__dirname, '../public/imagem');

// Upload de imagem de produto
const uploadProduto = multer({
  storage: multer.diskStorage({
    destination: imagemDir,
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Upload de foto de perfil
const uploadFoto = multer({
  storage: multer.diskStorage({
    destination: imagemDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `perfil_${req.session.userId}_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadProduto, uploadFoto };