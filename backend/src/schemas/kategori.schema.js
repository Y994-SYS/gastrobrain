const { z } = require('zod');

const renkRegex = /^#[0-9A-Fa-f]{6}$/;

const kategoriOlusturSchema = z.object({
    ad: z.string().trim().min(2, 'Kategori adı en az 2 karakter olmalı').max(50),
    tip: z.enum(['STOK', 'RECETE'], { errorMap: () => ({ message: 'Geçersiz kategori tipi' }) }),
    renk: z.string().regex(renkRegex, 'Geçerli bir renk kodu girin (örn. #4ADE80)').optional(),
    sira: z.coerce.number().int().optional(),
}).strict();

const kategoriGuncelleSchema = z.object({
    ad: z.string().trim().min(2, 'Kategori adı en az 2 karakter olmalı').max(50).optional(),
    renk: z.string().regex(renkRegex, 'Geçerli bir renk kodu girin (örn. #4ADE80)').optional(),
    aktif: z.boolean().optional(),
    sira: z.coerce.number().int().optional(),
    // tip ve tenantId burada YOK — service katmanında zaten filtreleniyor
    // ama şema seviyesinde de kabul edilmemesi ekstra güvenlik katmanı
}).strict();

const kategoriSiraSchema = z.object({
    siralama: z.array(z.object({
        id: z.coerce.number().int().positive(),
        sira: z.coerce.number().int(),
    })).min(1),
}).strict();

module.exports = { kategoriOlusturSchema, kategoriGuncelleSchema, kategoriSiraSchema };