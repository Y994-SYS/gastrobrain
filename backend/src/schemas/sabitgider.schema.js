const { z } = require('zod');

const KATEGORILER = ['KIRA', 'ELEKTRIK', 'SU', 'DOGALGAZ', 'INTERNET', 'TELEFON', 'SIGORTA', 'DIGER'];

const sabitGiderSchema = z.object({
    kategori: z.enum(KATEGORILER, { message: 'Geçerli bir kategori seçin' }),
    ad: z.string().trim().max(120).optional(),
    yil: z.coerce.number().int().min(2020).max(2100),
    ay: z.coerce.number().int().min(1).max(12),
    tutar: z.coerce.number().positive({ message: 'Tutar sıfırdan büyük olmalı' }),
    aciklama: z.string().trim().max(500).optional(),
    // Boş string / null → tüm işletme geneli. Sayı gelirse ilgili şube.
    subeId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
});

// Güncellemede tüm alanlar opsiyonel — sadece gönderilen alan değişir.
const sabitGiderGuncelleSchema = sabitGiderSchema.partial();

const idParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

module.exports = { sabitGiderSchema, sabitGiderGuncelleSchema, idParamSchema, KATEGORILER };