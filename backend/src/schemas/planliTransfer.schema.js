const { z } = require('zod');

// Base schema (refine YOK)
const planliTransferBaseSchema = z.object({
    ad: z.string().min(1, 'Ad zorunlu').max(100),
    stokKartId: z.coerce.number().int().positive(),
    kaynakSubeId: z.coerce.number().int().positive(),
    hedefSubeId: z.coerce.number().int().positive(),
    miktar: z.coerce.number().positive('Miktar sıfırdan büyük olmalı'),
    gunler: z.string().min(1, 'En az bir gün seçin'),
    saat: z.coerce.number().int().min(0).max(23).default(6),
    dakika: z.coerce.number().int().min(0).max(59).default(0),
    aktif: z.boolean().default(true),
    aciklama: z.string().optional(),
});

// Oluşturma schema'sı — refine burada
const planliTransferOlusturSchema = planliTransferBaseSchema.refine(
    (d) => d.kaynakSubeId !== d.hedefSubeId,
    { message: 'Kaynak ve hedef şube aynı olamaz', path: ['hedefSubeId'] }
);

// Güncelleme schema'sı — partial burada (refine YOK)
const planliTransferGuncelleSchema = planliTransferBaseSchema.partial();

module.exports = { planliTransferOlusturSchema, planliTransferGuncelleSchema };