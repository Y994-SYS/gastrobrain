const { z } = require('zod');

const opsiyonelSayi = (validasyon) => z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    validasyon.optional()
);

const satisSchema = z.object({
    receteId: z.coerce.number().int('Geçersiz reçete').positive('Geçersiz reçete'),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional(),
    adet: z.coerce.number().positive('Adet 0’dan büyük olmalı'),
    birimFiyat: z.coerce.number().min(0, 'Birim fiyat negatif olamaz'),
    aciklama: z.string().trim().max(500).optional().nullable(),
    tarih: z.string().optional(), // tarih formatı service'te new Date() ile parse ediliyor
    zorla: z.boolean().optional(),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { satisSchema, idParamSchema };