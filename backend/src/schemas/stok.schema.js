const { z } = require('zod');

const stokKartId = z.coerce.number().int('Geçersiz stok kartı').positive('Geçersiz stok kartı');
const subeId = z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube').optional();
const miktar = z.coerce.number().positive('Miktar 0’dan büyük olmalı');
const birimFiyat = z.coerce.number().min(0, 'Birim fiyat negatif olamaz');
const aciklama = z.string().trim().max(500).optional().nullable();
const tarih = z.string().datetime({ message: 'Geçersiz tarih formatı' }).optional()
    .or(z.string().date('Geçersiz tarih formatı')).optional();
const cariKartId = z.coerce.number().int('Geçersiz cari kart').positive('Geçersiz cari kart').optional();

// Giriş / iade faturası — birimFiyat zorunlu (tutar hesaplamada kullanılıyor)
const faturaSchema = z.object({
    stokKartId,
    subeId,
    miktar,
    birimFiyat,
    aciklama,
    tarih,
    cariKartId,
}).strict();

// Zayi / tüketim — birimFiyat yok
const hareketSchema = z.object({
    stokKartId,
    subeId,
    miktar,
    aciklama,
    tarih,
}).strict();

// Ay sonu sayım — sayimMiktari negatif OLABİLİR mi? Servise göre hayır ama
// sıfır girilebilmeli (stok tükenmiş sayımı), o yüzden min(0) kullanıyoruz
const aySonuSayimSchema = z.object({
    stokKartId,
    subeId,
    sayimMiktari: z.coerce.number().min(0, 'Sayım miktarı negatif olamaz'),
    aciklama,
}).strict();

// Reçete ile tüketim — controller kendi kontrolünü zaten yapıyor,
// burada sadece tip güvenliği ve temel format kontrolü ekliyoruz
const tuketimReceteSchema = z.object({
    receteId: z.coerce.number().int('Geçersiz reçete').positive('Geçersiz reçete'),
    porsiyonSayisi: z.coerce.number().positive('Porsiyon sayısı 0’dan büyük olmalı'),
    aciklama,
    tarih,
    zorla: z.boolean().optional(),
}).strict();

// /mevcut/:stokKartId/:subeId route parametreleri
const mevcutStokParamsSchema = z.object({
    stokKartId: z.coerce.number().int('Geçersiz stok kartı').positive('Geçersiz stok kartı'),
    subeId: z.coerce.number().int('Geçersiz şube').positive('Geçersiz şube'),
});

module.exports = {
    faturaSchema,
    hareketSchema,
    aySonuSayimSchema,
    tuketimReceteSchema,
    mevcutStokParamsSchema,
};