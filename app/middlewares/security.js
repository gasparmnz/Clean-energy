const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const helmetMiddleware = helmet({
  contentSecurityPolicy: false
});

const compressionMiddleware = compression();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                  // no máximo 20 requisições nesse período, por IP
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