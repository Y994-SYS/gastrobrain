const { z } = require('zod');

const planliTransferOlusturSchema = z.object({
    ad: z.string().min(1, 'Ad zorunlu').max(100),
    stokKartId: z.coerce.number().int().positive(),
    kaynakSubeId: z.coerce.number().int().positive(),
    hedefSubeId: z.coerce.number().int().positive(),
    miktar: z.coerce.number().positive('Miktar sıfırdan büyük olmalı'),
    gunler: z.string().min(1, 'En az bir gün seçin'), // "1,5" formatında
    saat: z.coerce.number().int().min(0).max(23).default(6),
    dakika: z.coerce.number().int().min(0).max(59).default(0),
    aktif: z.boolean().default(true),
    aciklama: z.string().optional(),
}).refine(d => d.kaynakSubeId !== d.hedefSubeId, {
    message: 'Kaynak ve hedef şube aynı olamaz',
    path: ['hedefSubeId']
});

const planliTransferGuncelleSchema = planliTransferOlusturSchema.partial();

module.exports = { planliTransferOlusturSchema, planliTransferGuncelleSchema };