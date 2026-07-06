const { z } = require('zod');

const subeStoklarQuerySchema = z.object({
    subeId: z.coerce
        .number({ invalid_type_error: 'subeId sayısal olmalıdır' })
        .int('subeId tam sayı olmalıdır')
        .positive('subeId geçerli değil'),
}).strict();

const transferYapSchema = z.object({
    kaynakSubeId: z.coerce
        .number({ invalid_type_error: 'kaynakSubeId sayısal olmalıdır' })
        .int()
        .positive(),
    hedefSubeId: z.coerce
        .number({ invalid_type_error: 'hedefSubeId sayısal olmalıdır' })
        .int()
        .positive(),
    stokKartId: z.coerce
        .number({ invalid_type_error: 'stokKartId sayısal olmalıdır' })
        .int()
        .positive(),
    miktar: z.coerce
        .number({ invalid_type_error: 'miktar sayısal olmalıdır' })
        .positive('Miktar sıfırdan büyük olmalı'),
    aciklama: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().max(500, 'aciklama en fazla 500 karakter olabilir').optional()
    ),
}).strict().refine(
    (data) => data.kaynakSubeId !== data.hedefSubeId,
    { message: 'Kaynak ve hedef şube aynı olamaz', path: ['hedefSubeId'] }
);

const transferGecmisiQuerySchema = z.object({
    subeId: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        z.coerce.number().int().positive().optional()
    ),
    limit: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        z.coerce.number().int().positive().max(200).optional().default(50)
    ),
}).strict();

module.exports = { subeStoklarQuerySchema, transferYapSchema, transferGecmisiQuerySchema };