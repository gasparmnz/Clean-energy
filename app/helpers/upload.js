const multer = require('multer');
const path = require('path');

const memoryStorage = multer.memoryStorage();

const uploadProduto = multer({
  storage: memoryStorage
});

const uploadFoto = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadProduto, uploadFoto };
