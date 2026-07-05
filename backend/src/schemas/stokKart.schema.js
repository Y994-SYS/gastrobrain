const { z } = require('zod');

const stokKartSchema = z.object({
    kod: z.string().trim().min(1, 'Stok kodu zorunlu').max(50),
    ad: z.string().trim().min(1, 'Stok adı zorunlu').max(150),
    aciklama: z.string().trim().max(500).optional().nullable(),
    minStok: z.coerce.number().min(0, 'Min stok negatif olamaz').optional(),
    kategoriId: z.coerce.number().int('Geçersiz kategori').positive('Geçersiz kategori'),
    birimId: z.coerce.number().int('Geçersiz ölçü birimi').positive('Geçersiz ölçü birimi'),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { stokKartSchema, idParamSchema };