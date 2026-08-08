const { z } = require('zod');

const tanımEkleSchema = z.object({
    stokKartId: z.number({ required_error: 'Stok kartı zorunlu' }).int().positive(),
    minStokSeviyesi: z.number().min(0).default(0),
    otomatiDagit: z.boolean().default(true),
    aciklama: z.string().optional(),
});

const manuelDagitSchema = z.object({
    merkezDepoId: z.number({ required_error: 'Merkez depo zorunlu' }).int().positive(),
    hedefSubeId: z.number({ required_error: 'Hedef şube zorunlu' }).int().positive(),
    miktar: z.number({ required_error: 'Miktar zorunlu' }).positive(),
    aciklama: z.string().optional(),
});

const gecmisQuerySchema = z.object({
    merkezDepoId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).default(50),
});

module.exports = { tanımEkleSchema, manuelDagitSchema, gecmisQuerySchema };