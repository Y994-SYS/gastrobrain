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

    // Express 5'te req.query salt-okunur bir getter olarak tanımlı.
    // Doğrudan atama (`req.query = sonuc.data`) strict olmayan modda
    // sessizce hiçbir etki yapmıyor — coerce edilmiş (örn. string->number)
    // değerler controller'a hiç ulaşmıyor, orijinal string değerler kalıyordu.
    // Property'yi configurable:true olarak yeniden tanımlayarak gerçek
    // değişikliği sağlıyoruz.
    Object.defineProperty(req, 'query', {
        value: sonuc.data,
        writable: true,
        enumerable: true,
        configurable: true,
    });

    next();
};

module.exports = { validate, validateParams, validateQuery };