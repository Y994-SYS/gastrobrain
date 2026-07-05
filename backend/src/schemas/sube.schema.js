const { z } = require('zod');

const opsiyonelMetin = (maxLen) => z.string().trim().max(maxLen).optional().nullable();

const subeOlusturSchema = z.object({
    ad: z.string().trim().min(1, 'Şube adı zorunlu').max(150),
    adres: opsiyonelMetin(500),
    telefon: opsiyonelMetin(20),
}).strict();

// Güncellemede tüm alanlar opsiyonel olabilir — controller ad/adres/telefon/aktif
// hangisi gelirse onu güncelliyor (undefined gelenler Prisma'da dokunulmadan kalır
// ama burada hepsi body'den doğrudan geçiyor, o yüzden opsiyonel bırakıyoruz)
const subeGuncelleSchema = z.object({
    ad: z.string().trim().min(1, 'Şube adı boş olamaz').max(150).optional(),
    adres: opsiyonelMetin(500),
    telefon: opsiyonelMetin(20),
    aktif: z.boolean().optional(),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { subeOlusturSchema, subeGuncelleSchema, idParamSchema };