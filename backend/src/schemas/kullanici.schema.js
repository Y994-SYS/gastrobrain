const { z } = require('zod');

const ATANABILIR_ROLLER = ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

const kullaniciOlusturSchema = z.object({
    ad: z.string().trim().min(1, 'Ad zorunlu').max(100),
    email: email,
    sifre: z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72),
    rol: z.enum(ATANABILIR_ROLLER, {
        errorMap: () => ({ message: 'Bu rol atanamaz' })
    }).optional(),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional().nullable(),
}).strict();

const kullaniciGuncelleSchema = z.object({
    ad: z.string().trim().min(1, 'Ad boş olamaz').max(100).optional(),
    email: email.optional(),
    sifre: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72).optional()
    ),
    rol: z.enum(ATANABILIR_ROLLER, {
        errorMap: () => ({ message: 'Bu rol atanamaz' })
    }).optional(),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional().nullable(),
    aktif: z.boolean().optional(),
}).strict();

const profilGuncelleSchema = z.object({
    ad: z.string().trim().min(1, 'Ad boş olamaz').max(100),
}).strict();

const sifreDegistirSchema = z.object({
    mevcutSifre: z.string().min(1, 'Mevcut şifre zorunlu'),
    yeniSifre: z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});
const email = z.string()
    .trim()
    .toLowerCase()
    .transform(v => v
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c'))
    .pipe(z.string().email('Geçerli bir email adresi girin'))
    .max(255);
module.exports = {
    kullaniciOlusturSchema,
    kullaniciGuncelleSchema,
    profilGuncelleSchema,
    sifreDegistirSchema,
    idParamSchema,
};