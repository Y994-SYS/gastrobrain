const { z } = require('zod');

// Boş string gönderilirse email formatı kontrolüne takılmasın diye
// önce boş string'i undefined'a çeviriyoruz, sonra opsiyonel email kontrolü yapıyoruz
const opsiyonelEmail = z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().trim().toLowerCase().email('Geçerli bir email adresi girin').max(255).optional()
);

const opsiyonelMetin = (maxLen) => z.string().trim().max(maxLen).optional().nullable();

const cariKartSchema = z.object({
    kod: z.string().trim().min(1, 'Cari kart kodu zorunlu').max(50),
    ad: z.string().trim().min(1, 'Firma adı zorunlu').max(150),
    vergiNo: opsiyonelMetin(20),
    telefon: opsiyonelMetin(20),
    email: opsiyonelEmail,
    adres: opsiyonelMetin(500),
    aktif: z.boolean().optional(),
}).strict();

const idParamSchema = z.object({
    id: z.coerce.number().int('Geçersiz id').positive('Geçersiz id'),
});

module.exports = { cariKartSchema, idParamSchema };