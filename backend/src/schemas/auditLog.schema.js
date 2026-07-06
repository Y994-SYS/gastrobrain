const { z } = require('zod');

const auditLogQuerySchema = z.object({
    limit: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        z.coerce
            .number({ invalid_type_error: 'limit sayısal olmalıdır' })
            .int('limit tam sayı olmalıdır')
            .positive('limit pozitif olmalıdır')
            .max(1000, 'limit en fazla 1000 olabilir')
            .optional()
            .default(100)
    ),
}).strict();

module.exports = { auditLogQuerySchema };