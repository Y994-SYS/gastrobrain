const { z } = require('zod');

const feedbackSchema = z.object({
    tip: z.enum(['oneri', 'hata', 'diger'], {
        errorMap: () => ({ message: 'Geçersiz geri bildirim tipi' })
    }).optional(),
    mesaj: z.string().trim().min(1, 'Mesaj boş olamaz').max(5000, 'Mesaj çok uzun (max 5000 karakter)'),
}).strict();

module.exports = { feedbackSchema };