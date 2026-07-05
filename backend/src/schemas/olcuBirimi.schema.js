const { z } = require('zod');

const olcuBirimiSchema = z.object({
    ad: z.string().trim().min(1, 'Ölçü birimi adı zorunlu').max(100),
    kisaltma: z.string().trim().min(1, 'Kısaltma zorunlu').max(10),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { olcuBirimiSchema, idParamSchema };