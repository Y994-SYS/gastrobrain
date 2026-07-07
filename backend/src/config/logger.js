const winston = require('winston');

// Loglara asla düz metin gitmemesi gereken alanlar
const HASSAS_ALANLAR = ['password', 'sifre', 'token', 'authorization', 'accesstoken', 'refreshtoken'];

function hassasVeriyiMaskele(veri) {
    if (!veri || typeof veri !== 'object') return veri;
    const kopya = Array.isArray(veri) ? [...veri] : { ...veri };
    for (const key in kopya) {
        if (HASSAS_ALANLAR.includes(key.toLowerCase())) {
            kopya[key] = '***MASKELENDI***';
        } else if (typeof kopya[key] === 'object' && kopya[key] !== null) {
            kopya[key] = hassasVeriyiMaskele(kopya[key]);
        }
    }
    return kopya;
}

const maskeleFormat = winston.format((bilgi) => {
    const { level, message, timestamp, stack, ...meta } = bilgi;
    const maskelenmisMeta = hassasVeriyiMaskele(meta);
    return { level, message, timestamp, stack, ...maskelenmisMeta };
});

const isProd = process.env.NODE_ENV === 'production';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        maskeleFormat(),
        isProd
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
                    return `${timestamp} [${level}]: ${message}${metaStr}`;
                })
            )
    ),
    // Render stdout'u kendi log sistemine yönlendiriyor, bu yüzden dosyaya
    // yazmıyoruz (Render'da dosya sistemi kalıcı değil, deploy'da silinir).
    transports: [new winston.transports.Console()],
    exitOnError: false,
});

module.exports = logger;