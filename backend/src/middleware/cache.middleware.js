const cacheService = require('../services/cache.service');

// GET rapor endpoint'lerini tenant + tam istek URL'i (query dahil)
// bazında kısa süreli cache'ler. TTL süresi boyunca aynı sorgu tekrar
// veritabanına gitmez, önceki JSON yanıtı doğrudan döner.
//
// Cache key'e tenantId dahil edilir ki bir firmanın verisi başka bir
// firmaya asla sızmasın — her tenant kendi izole cache alanında.
//
// Sadece 200 (başarılı) yanıtlar cache'lenir; hata durumları cache'e
// yazılmaz, böylece geçici bir hatanın sonucu 60 saniye boyunca tekrar
// tekrar dönmez.
const cacheMiddleware = (ttlSaniye = 60) => (req, res, next) => {
    const tenantId = req.kullanici?.tenantId;
    if (!tenantId) return next();

    const key = `${tenantId}:${req.originalUrl}`;
    const cached = cacheService.get(key);
    if (cached) {
        return res.json(cached);
    }

    const orijinalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode === 200) {
            cacheService.set(key, body, ttlSaniye);
        }
        return orijinalJson(body);
    };

    next();
};

module.exports = cacheMiddleware;