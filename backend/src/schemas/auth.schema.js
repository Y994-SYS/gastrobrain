const { z } = require('zod');

// Frontend null veya boş string gönderebilir — ikisini de "gönderilmedi" say
const bosSayilanlariTemizle = (val) => (val === '' || val === null ? undefined : val);

const email = z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255);
const sifre = z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72); // bcrypt 72 byte sınırı

const opsiyonelString = (maxLen) => z.preprocess(
    bosSayilanlariTemizle,
    z.string().trim().max(maxLen).optional()
);

const kayitOlSchema = z.object({
    ad: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(100),
    email,
    sifre,
    rol: z.preprocess(
        bosSayilanlariTemizle,
        z.enum(['TENANT_ADMIN', 'PERSONEL', 'SUPER_ADMIN']).optional()
    ),
    subeId: opsiyonelString(50),
    tenantId: opsiyonelString(50),
});

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