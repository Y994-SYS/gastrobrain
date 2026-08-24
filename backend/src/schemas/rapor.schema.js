
const { z } = require('zod');

// Tarih string'leri opsiyonel — boş string gelirse undefined'a çevir
const opsiyonelTarih = z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
);
const opsiyonelId = z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce.number().int().positive().optional()
);

const satisRaporuQuery = z.object({
    baslangic: opsiyonelTarih,
    bitis: opsiyonelTarih,
    receteId: opsiyonelId,
    subeId: opsiyonelId,
});

const stokRaporuQuery = z.object({
    kategoriId: opsiyonelId,
    sadecekritik: z.enum(['true', 'false']).optional(),
    subeId: opsiyonelId,
});

const cariRaporuQuery = z.object({
    cariKartId: opsiyonelId,
    baslangic: opsiyonelTarih,
    bitis: opsiyonelTarih,
});

const maliyetRaporuQuery = z.object({
    subeId: opsiyonelId,
});

// DÜZELTME: 'sube-karsilastirmasi' ve 'merkezmuhasebesi' eklendi — bu iki
// rapor için de artık gerçek Excel export var (rapor.controller.js).
// Öncesinde frontend'deki "Excel İndir" butonu bu sekmelerde de görünüyordu
// ama şema sadece 4 klasik rapor tipini kabul ettiği için tıklanınca
// "Invalid option" hatası veriyordu.
const excelExportQuery = z.object({
    tip: z.enum(['satis', 'stok', 'cari', 'maliyet', 'sube-karsilastirmasi', 'merkezmuhasebesi'], {
        errorMap: () => ({ message: 'Geçersiz rapor tipi' })
    }),
    baslangic: opsiyonelTarih,
    bitis: opsiyonelTarih,
    subeId: opsiyonelId,
});

module.exports = {
    satisRaporuQuery,
    stokRaporuQuery,
    cariRaporuQuery,
    maliyetRaporuQuery,
    excelExportQuery,
};