const morgan = require('morgan');
const logger = require('../config/logger');

// tokenVarsaCoz çalıştıktan SONRA mount edilmeli ki req.kullanici dolu olsun
morgan.token('tenant', (req) => req.kullanici?.tenantId || '-');
morgan.token('kullaniciId', (req) => req.kullanici?.id || '-');

const format = process.env.NODE_ENV === 'production'
    ? ':method :url :status :res[content-length]b - :response-time ms | tenant=:tenant kullanici=:kullaniciId'
    : 'dev';

const requestLogger = morgan(format, {
    stream: { write: (mesaj) => logger.info(mesaj.trim()) },
    skip: (req) => req.path === '/', // health check gürültüsünü azalt
});

module.exports = requestLogger;