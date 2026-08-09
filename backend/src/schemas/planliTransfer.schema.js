const { z } = require('zod');

const kalemSchema = z.object({
    stokKartId: z.coerce.number().int().positive(),
    kaynakSubeId: z.coerce.number().int().positive(),
    hedefSubeId: z.coerce.number().int().positive(),
    miktar: z.coerce.number().positive(),
    aciklama: z.string().optional(),
});

const planliTransferOlusturSchema = z.object({
    ad: z.string().min(1, 'Ad zorunlu').max(100),
    gunler: z.string().min(1, 'En az bir gün seçin'),
    saat: z.coerce.number().int().min(0).max(23).default(6),
    dakika: z.coerce.number().int().min(0).max(59).default(0),
    aktif: z.boolean().default(true),
    aciklama: z.string().optional(),
    kalemler: z.array(kalemSchema).min(1, 'En az bir kalem ekleyin'),
});

const planliTransferGuncelleSchema = z.object({
    ad: z.string().min(1).max(100).optional(),
    gunler: z.string().optional(),
    saat: z.coerce.number().int().min(0).max(23).optional(),
    dakika: z.coerce.number().int().min(0).max(59).optional(),
    aktif: z.boolean().optional(),
    aciklama: z.string().optional(),
});

module.exports = { planliTransferOlusturSchema, planliTransferGuncelleSchema };