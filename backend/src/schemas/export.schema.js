const { z } = require('zod');

const MODUL_ENUM = z.enum(['stok', 'satis', 'personel', 'cari', 'stok_hareketleri']);

const exportSchema = z.object({
    moduller: z.array(MODUL_ENUM)
        .min(1, 'En az bir modül seçmelisiniz')
        .max(5, 'Geçersiz modül sayısı'),
    subeId: z.preprocess(
        (val) => (val === '' || val === undefined || val === null ? undefined : val),
        z.coerce.number().int().positive().optional()
    ),
}).strict();

module.exports = { exportSchema };