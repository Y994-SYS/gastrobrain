const { z } = require('zod');

const opsiyonelMetin = (maxLen) => z.string().trim().max(maxLen).optional().nullable();
const bosSayilanlariTemizle = (val) => (val === '' ? undefined : val);

const personelSchema = z.object({
    ad: z.string().trim().min(1, 'Ad zorunlu').max(100),
    soyad: z.string().trim().min(1, 'Soyad zorunlu').max(100),
    telefon: opsiyonelMetin(20),
    dogumTarihi: z.string().optional().nullable(),
    baslangicTarihi: z.string().min(1, 'Başlangıç tarihi zorunlu'),
    maas: z.coerce.number().positive('Maaş 0’dan büyük olmalı'),
    subeId: z.preprocess(
        bosSayilanlariTemizle,
        z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional()
    ),
}).strict();

const maasEkleSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100),
    ay: z.coerce.number().int('Geçersiz ay').min(1).max(12),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı'),
    odendi: z.boolean().optional(),
    tarih: z.string().optional(),
}).strict();

// Mevcut bir maaş kaydını güncellemek için — tüm alanlar opsiyonel (kısmi
// güncelleme), ama en az bir tanesi gönderilmeli. personelId burada YOK,
// çünkü kayıt zaten :id üzerinden bulunuyor ve personel değiştirilemez.
const maasGuncelleSchema = z.object({
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100).optional(),
    ay: z.coerce.number().int('Geçersiz ay').min(1).max(12).optional(),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı').optional(),
    odendi: z.boolean().optional(),
    tarih: z.string().optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Güncellenecek en az bir alan gönderilmeli' }
);

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
        bosSayilanlariTemizle,
        z.coerce.number().min(0, 'Mesai negatif olamaz').optional().nullable()
    ),
    aciklama: opsiyonelMetin(500),
}).strict();

const devamTopluEkleSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    baslangicTarihi: z.string().min(1, 'Başlangıç tarihi zorunlu'),
    bitisTarihi: z.string().min(1, 'Bitiş tarihi zorunlu'),
    durum: z.enum(['CALISTI', 'IZIN', 'RAPOR', 'DEVAMSIZ'], {
        errorMap: () => ({ message: 'Geçersiz devam durumu' })
    }),
    mesai: z.preprocess(
        bosSayilanlariTemizle,
        z.coerce.number().min(0, 'Mesai negatif olamaz').optional().nullable()
    ),
    aciklama: opsiyonelMetin(500),
}).strict();

const izinKullanimSchema = z.object({
    personelId: z.coerce.number().int('Geçersiz personel').positive('Geçersiz personel'),
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100),
    kullanilanGun: z.coerce.number().min(-365, 'Geçersiz değer').max(365, 'Geçersiz değer'),
    aciklama: opsiyonelMetin(500),
}).strict();

const izinDurumuQuerySchema = z.object({
    yil: z.coerce.number().int('Geçersiz yıl').min(2000).max(2100).optional(),
});

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = {
    personelSchema, maasEkleSchema, maasGuncelleSchema, avansEkleSchema, devamEkleSchema, devamTopluEkleSchema,
    idParamSchema, izinKullanimSchema, izinDurumuQuerySchema
};