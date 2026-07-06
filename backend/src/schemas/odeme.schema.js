const { z } = require('zod');

// PERIYOT_GUN ve planMap (controller) ile birebir eşleşmeli —
// buradaki enum'lar controller'daki sabit anahtarlarla senkron tutulmalı.
const PLAN_ENUM = ['baslangic', 'profesyonel', 'kurumsal'];
const PERIYOT_ENUM = ['aylik', 'yillik'];
const DURUM_ENUM = ['BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI'];

// POST /api/odeme/bildir
const bildirimOlusturSchema = z.object({
    plan: z.enum(PLAN_ENUM, {
        errorMap: () => ({ message: `Plan şunlardan biri olmalı: ${PLAN_ENUM.join(', ')}` }),
    }),
    periyot: z.enum(PERIYOT_ENUM, {
        errorMap: () => ({ message: `Periyot şunlardan biri olmalı: ${PERIYOT_ENUM.join(', ')}` }),
    }),
    tutar: z.coerce.number({ invalid_type_error: 'Tutar sayı olmalı' })
        .positive('Tutar sıfırdan büyük olmalı'),
    // Boş string geldiğinde undefined'a çevir — aksi halde DB'ye '' yazılabilir
    not: z.preprocess(
        (v) => (v === '' ? undefined : v),
        z.string().max(1000, 'Not en fazla 1000 karakter olabilir').optional()
    ),
}).strict();

// GET /api/odeme/bekleyenler?durum=...
const bekleyenlerQuerySchema = z.object({
    durum: z.enum(DURUM_ENUM, {
        errorMap: () => ({ message: `Durum şunlardan biri olmalı: ${DURUM_ENUM.join(', ')}` }),
    }).optional(),
}).strict();

// PATCH /api/odeme/:id/onayla ve /:id/reddet — ortak param şeması
const idParamSchema = z.object({
    id: z.coerce.number({ invalid_type_error: 'Geçersiz id' })
        .int('id tam sayı olmalı')
        .positive('id pozitif olmalı'),
}).strict();

// PATCH /api/odeme/:id/reddet
const reddetSchema = z.object({
    redNotu: z.preprocess(
        (v) => (v === '' ? undefined : v),
        z.string().max(1000, 'Red notu en fazla 1000 karakter olabilir').optional()
    ),
}).strict();

module.exports = {
    bildirimOlusturSchema,
    bekleyenlerQuerySchema,
    idParamSchema,
    reddetSchema,
};