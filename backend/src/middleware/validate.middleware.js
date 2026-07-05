const validate = (schema) => (req, res, next) => {
    const sonuc = schema.safeParse(req.body);

    if (!sonuc.success) {
        const ilkHata = sonuc.error.issues[0];
        return res.status(400).json({
            basarili: false,
            mesaj: ilkHata?.message || 'Geçersiz veri',
            alan: ilkHata?.path?.join('.') || undefined,
        });
    }

    req.body = sonuc.data;
    next();
};

// URL parametrelerini (örn. /:id) doğrulamak için — req.body değil req.params üzerinde çalışır
const validateParams = (schema) => (req, res, next) => {
    const sonuc = schema.safeParse(req.params);

    if (!sonuc.success) {
        const ilkHata = sonuc.error.issues[0];
        return res.status(400).json({
            basarili: false,
            mesaj: ilkHata?.message || 'Geçersiz parametre',
            alan: ilkHata?.path?.join('.') || undefined,
        });
    }

    req.params = sonuc.data;
    next();
};

// Query string parametrelerini (örn. ?baslangic=...&bitis=...) doğrular
const validateQuery = (schema) => (req, res, next) => {
    const sonuc = schema.safeParse(req.query);

    if (!sonuc.success) {
        const ilkHata = sonuc.error.issues[0];
        return res.status(400).json({
            basarili: false,
            mesaj: ilkHata?.message || 'Geçersiz sorgu parametresi',
            alan: ilkHata?.path?.join('.') || undefined,
        });
    }

    req.query = sonuc.data;
    next();
};

module.exports = { validate, validateParams, validateQuery };
