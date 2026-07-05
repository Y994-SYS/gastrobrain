const { z } = require('zod');

const ATANABILIR_ROLLER = ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

const kullaniciOlusturSchema = z.object({
    ad: z.string().trim().min(1, 'Ad zorunlu').max(100),
    email: z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255),
    sifre: z.string().min(6, 'Şifre en az 6 karakter olmalı').max(72),
    rol: z.enum(ATANABILIR_ROLLER, {
        errorMap: () => ({ message: 'Bu rol atanamaz' })
    }).optional(),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional().nullable(),
}).strict();

const kullaniciGuncelleSchema = z.object({
    ad: z.string().trim().min(1, 'Ad boş olamaz').max(100).optional(),
    email: z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255).optional(),
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

module.exports = {
    kullaniciOlusturSchema,
    kullaniciGuncelleSchema,
    profilGuncelleSchema,
    sifreDegistirSchema,
    idParamSchema,
};