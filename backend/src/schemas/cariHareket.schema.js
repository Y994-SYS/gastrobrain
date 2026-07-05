const { z } = require('zod');

const odemeSchema = z.object({
    cariKartId: z.coerce.number().int('Geçersiz cari kart').positive('Geçersiz cari kart'),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı'),
    aciklama: z.string().trim().max(500).optional().nullable(),
    belgeNo: z.string().trim().max(50).optional().nullable(),
    tarih: z.string().optional(),
}).strict();

// Manuel hareket: tip kullanıcı tarafından seçiliyor — enum ile sınırlıyoruz
const manuelHareketSchema = z.object({
    cariKartId: z.coerce.number().int('Geçersiz cari kart').positive('Geçersiz cari kart'),
    tip: z.enum(['BORC', 'ALACAK', 'ODEME', 'TAHSILAT'], {
        errorMap: () => ({ message: 'Geçersiz hareket tipi' })
    }),
    tutar: z.coerce.number().positive('Tutar 0’dan büyük olmalı'),
    aciklama: z.string().trim().max(500).optional().nullable(),
    belgeNo: z.string().trim().max(50).optional().nullable(),
    tarih: z.string().optional(),
}).strict();

const cariKartIdParamSchema = z.object({
    cariKartId: z.coerce.number().int('Geçersiz cari kart').positive('Geçersiz cari kart'),
});

module.exports = { odemeSchema, manuelHareketSchema, cariKartIdParamSchema };