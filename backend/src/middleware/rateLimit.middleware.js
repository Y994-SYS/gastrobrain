const rateLimit = require('express-rate-limit');

// ─── KEY GENERATORs ────────────────────────────────────────────

// Giriş öncesi: sadece IP bazlı (token yok henüz)
const ipKey = (req) => req.ip;

// Giriş sonrası: tenantId + userId bazlı (IP riski ortadan kalkar)
const tenantUserKey = (req) => {
    if (req.kullanici) {
        return `tenant_${req.kullanici.tenantId}_user_${req.kullanici.id}`;
    }
    return req.ip;
};

// ─── HATA YANITI ───────────────────────────────────────────────

const limitAsildiHandler = (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
        status: 429,
        message: options.message?.mesaj || 'Çok fazla istek gönderildi.',
        retryAfter,
    });
};

// ─── LİMİTLER ──────────────────────────────────────────────────

// 1) Giriş & Kayıt — sıkı, IP bazlı (brute-force koruması)
const girisLimit = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 dakika
    max: 10,                        // 15 dk'da max 10 deneme
    keyGenerator: ipKey,
    handler: limitAsildiHandler,
    message: { mesaj: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,   // başarılı girişler sayılmaz
});

// 2) Kayıt — çok sıkı, IP bazlı
const kayitLimit = rateLimit({
    windowMs: 60 * 60 * 1000,     // 1 saat
    max: 5,
    keyGenerator: ipKey,
    handler: limitAsildiHandler,
    message: { mesaj: 'Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 3) Genel API — esnek, tenant+user bazlı (restoran içi çakışma yok)
const genelLimit = rateLimit({
    windowMs: 15 * 60 * 1000,     // 15 dakika
    max: 1000,                      // restoran içi yoğun kullanım için geniş
    keyGenerator: tenantUserKey,
    handler: limitAsildiHandler,
    message: { mesaj: 'Çok fazla istek gönderdiniz. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.kullanici,  // giriş yapılmamışsa bu limiti atla
});

// 4) Kritik işlemler — orta sıkılık, tenant bazlı
const kritikLimit = rateLimit({
    windowMs: 5 * 60 * 1000,      // 5 dakika
    max: 50,
    keyGenerator: tenantUserKey,
    handler: limitAsildiHandler,
    message: { mesaj: 'Çok fazla işlem yaptınız. 5 dakika bekleyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { girisLimit, kayitLimit, genelLimit, kritikLimit };