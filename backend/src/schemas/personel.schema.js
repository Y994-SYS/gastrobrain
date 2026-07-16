const { z } = require('zod');

const opsiyonelMetin = (maxLen) => z.string().trim().max(maxLen).optional().nullable();

const personelSchema = z.object({
    ad: z.string().trim().min(1, 'Ad zorunlu').max(100),
    soyad: z.string().trim().min(1, 'Soyad zorunlu').max(100),
    telefon: opsiyonelMetin(20),
    tcKimlik: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().trim().length(11, 'TC Kimlik 11 haneli olmalı').regex(/^\d+$/, 'TC Kimlik sadece rakam içermeli').optional().nullable()
    ),
    dogumTarihi: z.string().optional().nullable(),
    baslangicTarihi: z.string().min(1, 'Başlangıç tarihi zorunlu'),
    maas: z.coerce.number().positive('Maaş 0’dan büyük olmalı'),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional(),
}).strict();

const maasEkleSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100),
    ay: z.coerce.number().int('Geçersiz ay').min(1).max(12),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı'),
    odendi: z.boolean().optional(),
    tarih: z.string().optional(),
}).strict();

const avansEkleSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı'),
    aciklama: opsiyonelMetin(500),
    tarih: z.string().optional(),
}).strict();

const devamEkleSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    tarih: z.string().min(1, 'Tarih zorunlu'),
    durum: z.enum(['CALISTI', 'IZIN', 'RAPOR', 'DEVAMSIZ'], {
        errorMap: () => ({ message: 'Geçersiz devam durumu' })
    }),
    mesai: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.coerce.number().min(0, 'Mesai negatif olamaz').optional().nullable()
    ),
    aciklama: opsiyonelMetin(500),
}).strict();

const izinKullanimSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100),
    kullanilanGun: z.coerce.number().min(0, 'Kullanılan gün negatif olamaz').max(365),
    aciklama: opsiyonelMetin(500),
}).strict();

const izinDurumuQuerySchema = z.object({
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100).optional(),
});

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = {
    personelSchema, maasEkleSchema, avansEkleSchema, devamEkleSchema,
    idParamSchema, izinKullanimSchema, izinDurumuQuerySchema
};