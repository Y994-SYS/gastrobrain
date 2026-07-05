const { z } = require('zod');

// Boş string gönderilirse (frontend '' gönderiyor) opsiyonel sayı alanı
// yanlışlıkla 0 olarak kaydolmasın diye önce undefined'a çeviriyoruz
const opsiyonelSayi = (validasyon) => z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    validasyon.optional()
);

const receteKalemSchema = z.object({
    stokKartId: z.coerce.number().int('Geçersiz stok kartı').positive('Geçersiz stok kartı'),
    miktar: z.coerce.number().positive('Miktar 0’dan büyük olmalı'),
    carpan: opsiyonelSayi(z.coerce.number().positive('Çarpan 0’dan büyük olmalı')),
    bolen: opsiyonelSayi(z.coerce.number().positive('Bölen 0’dan büyük olmalı')),
    stokTakipZorunlu: z.boolean().optional(),
}).strict();

const receteSchema = z.object({
    ad: z.string().trim().min(1, 'Reçete adı zorunlu').max(150),
    aciklama: z.string().trim().max(500).optional().nullable(),
    satisKodu: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().trim().max(50).optional().nullable()
    ),
    satisFiyati: opsiyonelSayi(z.coerce.number().min(0, 'Satış fiyatı negatif olamaz')),
    porsiyonSayisi: opsiyonelSayi(z.coerce.number().int('Porsiyon sayısı tam sayı olmalı').positive('Porsiyon sayısı 0’dan büyük olmalı')),
    kalemler: z.array(receteKalemSchema).min(1, 'En az bir kalem eklenmeli'),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { receteSchema, idParamSchema };