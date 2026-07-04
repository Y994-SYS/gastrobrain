const { z } = require('zod');

const kategoriSchema = z.object({
    ad: z.string().trim().min(1, 'Kategori adı zorunlu').max(100),
    renk: z.string().trim().max(20).optional().nullable(),
}).strict(); // tanımlanmayan alan (örn. tenantId) gönderilirse reddet

// /:id gibi route parametrelerini doğrular, string'i number'a çevirir
const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { kategoriSchema, idParamSchema };