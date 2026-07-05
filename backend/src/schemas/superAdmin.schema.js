const { z } = require('zod');

const aktifPasifSchema = z.object({
    aktif: z.boolean({ required_error: 'aktif alanı zorunlu (true/false)' }),
}).strict();

const planGuncelleSchema = z.object({
    plan: z.enum(['BASLANGIC', 'PROFESYONEL', 'KURUMSAL'], {
        errorMap: () => ({ message: 'Geçersiz plan' })
    }),
}).strict();

const lisansGuncelleSchema = z.object({
    lisansBitis: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().optional().nullable()
    ),
    lisansNot: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().trim().max(1000).optional().nullable()
    ),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { aktifPasifSchema, planGuncelleSchema, lisansGuncelleSchema, idParamSchema };