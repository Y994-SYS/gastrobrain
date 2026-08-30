// middleware/validate.middleware.js

/**
 * Zod'un ham (İngilizce, teknik) hata mesajlarını kullanıcının anlayacağı
 * Türkçe mesajlara çevirir. Zod hatası her zaman aynı şekilde formatlanmadığı
 * için (issue.code'a göre farklı alanlar taşır) code bazlı bir eşleme yapıyoruz.
 */
const dostMesajUret = (issue) => {
    const alan = issue.path?.length ? issue.path.join('.') : null;
    const alanEtiketi = alan ? `"${alan}"` : 'Bu alan';

    switch (issue.code) {
        case 'invalid_type':
            // Zod v4: sayı beklenip NaN/undefined/string gelmesi hep bu koda düşer.
            if (issue.expected === 'number') {
                return alan === 'id'
                    ? 'Geçersiz kayıt numarası. Lütfen sayfayı yenileyip tekrar deneyin.'
                    : `${alanEtiketi} için geçerli bir sayı girilmeli.`;
            }
            if (issue.expected === 'string') {
                return `${alanEtiketi} metin olarak girilmeli.`;
            }
            return `${alanEtiketi} geçersiz bir değere sahip.`;

        case 'too_small':
            if (issue.origin === 'string' || issue.type === 'string') {
                return `${alanEtiketi} boş bırakılamaz.`;
            }
            if (issue.origin === 'number' || issue.type === 'number') {
                return `${alanEtiketi} en az ${issue.minimum} olmalı.`;
            }
            return `${alanEtiketi} çok kısa/küçük.`;

        case 'too_big':
            if (issue.origin === 'string' || issue.type === 'string') {
                return `${alanEtiketi} en fazla ${issue.maximum} karakter olabilir.`;
            }
            if (issue.origin === 'number' || issue.type === 'number') {
                return `${alanEtiketi} en fazla ${issue.maximum} olabilir.`;
            }
            return `${alanEtiketi} çok uzun/büyük.`;

        case 'invalid_format':
        case 'invalid_string':
            return `${alanEtiketi} geçerli bir formatta değil.`;

        case 'unrecognized_keys':
            return `Beklenmeyen alan gönderildi: ${issue.keys?.join(', ') || ''}`.trim();

        case 'invalid_value':
        case 'invalid_enum_value':
            return `${alanEtiketi} için geçersiz bir değer seçildi.`;

        default:
            // Zod'un kendi mesajı zaten anlamlıysa (örn. bizim yazdığımız
            // 'Kategori adı zorunlu' gibi custom mesajlar) onu kullan.
            return issue.message || 'Geçersiz veri gönderildi.';
    }
};

const validate = (schema) => (req, res, next) => {
    const sonuc = schema.safeParse(req.body);

    if (!sonuc.success) {
        const ilkHata = sonuc.error.issues[0];
        return res.status(400).json({
            basarili: false,
            mesaj: dostMesajUret(ilkHata) || 'Geçersiz veri',
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
            mesaj: dostMesajUret(ilkHata) || 'Geçersiz parametre',
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
            mesaj: dostMesajUret(ilkHata) || 'Geçersiz sorgu parametresi',
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

module.exports = { validate, validateParams, validateQuery, dostMesajUret };