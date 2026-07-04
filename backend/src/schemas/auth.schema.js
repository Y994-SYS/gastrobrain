const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255);
const sifre = z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72); // bcrypt 72 byte sınırı

const kayitOlSchema = z.object({
    ad: z.string().trim().min(2, 'Ad en az 2 karakter olmalı').max(100),
    email,
    sifre,
    rol: z.enum(['TENANT_ADMIN', 'PERSONEL', 'SUPER_ADMIN']).optional(),
    subeId: z.string().optional(),
    tenantId: z.string().optional(),
});

const girisYapSchema = z.object({
    email,
    sifre: z.string().min(1, 'Şifre gerekli'), // giriş: uzunluk kontrolü yok, sadece boş olmasın
    tenantId: z.string().optional(),
    tenantSlug: z.string().trim().optional(),
});

const kayitFirmaSchema = z.object({
    firmaAd: z.string().trim().min(2, 'Firma adı en az 2 karakter olmalı').max(150),
    firmaSlug: z.string().trim().max(150).optional(),
    firmaEmail: email,
    firmaTelefon: z.string().trim().max(20).optional(),
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