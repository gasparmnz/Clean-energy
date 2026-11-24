const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const helmetMiddleware = helmet({
  contentSecurityPolicy: false
});

const compressionMiddleware = compression();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  }
});

module.exports = {
  helmetMiddleware,
  compressionMiddleware,
  authLimiter
};