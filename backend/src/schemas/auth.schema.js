const { z } = require('zod');

// Frontend null veya boş string gönderebilir — ikisini de "gönderilmedi" say
const bosSayilanlariTemizle = (val) => (val === '' || val === null ? undefined : val);

const email = z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255);
const sifre = z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72); // bcrypt 72 byte sınırı

const opsiyonelString = (maxLen) => z.preprocess(
    bosSayilanlariTemizle,
    z.string().trim().max(maxLen).optional()
);

// GÜVENLİK: SUPER_ADMIN bu şemayla ASLA atanamaz — client'ın kendini süper
// admin yapabilmesi (privilege escalation) mümkündü, artık mümkün değil.
// tenantId de şemadan tamamen çıkarıldı: her zaman authMiddleware'den gelen
// req.kullanici.tenantId kullanılır, client'ın body'de gönderdiği hiçbir
// tenantId değeri dikkate alınmaz (bkz. auth.controller.js).
const KAYIT_ATANABILIR_ROLLER = ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

const kayitOlSchema = z.object({
    ad: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(100),
    email,
    sifre,
    rol: z.enum(KAYIT_ATANABILIR_ROLLER, {
        errorMap: () => ({ message: 'Geçersiz rol' })
    }),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional(),
}).strict();

const girisYapSchema = z.object({
    email,
    sifre: z.string().min(1, 'Şifre gerekli'), // giriş: uzunluk kontrolü yok, sadece boş olmasın
    tenantId: opsiyonelString(50),
    tenantSlug: opsiyonelString(150),
});

const kayitFirmaSchema = z.object({
    firmaAd: z.string().trim().min(2, 'Firma adı en az 2 karakter olmalı').max(150),
    firmaSlug: opsiyonelString(150),
    firmaEmail: email,
    firmaTelefon: opsiyonelString(20),
    adminAd: z.string().trim().min(2, 'Yönetici adı en az 2 karakter olmalı').max(100),
    adminEmail: email,
    adminSifre: sifre,
});

const tenantListesiSchema = z.object({
    email,
});

const sifreSifirlamaTalepSchema = z.object({
    email,
});

const sifreSifirlaSchema = z.object({
    token: z.string().min(1, 'Token gerekli'),
    yeniSifre: sifre,
});

module.exports = {
    kayitOlSchema,
    girisYapSchema,
    kayitFirmaSchema,
    tenantListesiSchema,
    sifreSifirlamaTalepSchema,
    sifreSifirlaSchema,
};