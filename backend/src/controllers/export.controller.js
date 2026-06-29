const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const prisma = new PrismaClient();

// Giriş sayılan stok hareket tipleri
const GIRIS_TIPLER = new Set(['GIRIS_FATURA', 'IADE_FATURA', 'SUBE_TRANSFER_IN']);

const bakiyeHesapla = (hareketler) =>
    hareketler.reduce((t, h) => t + (GIRIS_TIPLER.has(h.tip) ? h.miktar : -h.miktar), 0);

// Başlık stili
const baslikStil = {
    font: { bold: true, color: { argb: 'FF09090B' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA3E635' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
        bottom: { style: 'thin', color: { argb: 'FF27272A' } },
    },
};

const satirStil = (satirNo) => ({
    fill: {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: satirNo % 2 === 0 ? 'FF18181B' : 'FF09090B' },
    },
});

const kolonAyarla = (sheet, kolonlar) => {
    kolonlar.forEach(({ header, key, width }, i) => {
        const col = sheet.getColumn(i + 1);
        col.header = header;
        col.key = key;
        col.width = width || 18;
        sheet.getRow(1).getCell(i + 1).style = baslikStil;
    });
    sheet.getRow(1).height = 22;
};

// POST /api/export
// body: { moduller: ['stok', 'satis', 'personel', 'cari'] }
const tumVeriExport = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const moduller = req.body.moduller || [];

        if (!moduller.length) {
            return res.status(400).json({ hata: 'En az bir modül seçmelisiniz' });
        }

        const wb = new ExcelJS.Workbook();
        wb.creator = 'GastroBrain';
        wb.created = new Date();

        // ── ÖZET sayfası ────────────────────────────────────────────────────
        const ozet = wb.addWorksheet('Özet');
        ozet.mergeCells('A1:D1');
        ozet.getCell('A1').value = 'GastroBrain — Veri Dışa Aktarım';
        ozet.getCell('A1').style = { font: { bold: true, size: 14 }, alignment: { horizontal: 'center' } };
        ozet.getRow(3).values = ['Tenant', 'Dışa Aktarım Tarihi', 'Modüller', ''];
        ozet.getRow(4).values = [
            tenantId,
            new Date().toLocaleString('tr-TR'),
            moduller.join(', '),
            '',
        ];
        ozet.columns = [{ width: 20 }, { width: 25 }, { width: 30 }, { width: 20 }];

        // ── STOK sayfası ─────────────────────────────────────────────────────
        if (moduller.includes('stok')) {
            const sheet = wb.addWorksheet('Stok Durumu');
            kolonAyarla(sheet, [
                { header: 'Kod', key: 'kod', width: 12 },
                { header: 'Stok Adı', key: 'ad', width: 25 },
                { header: 'Kategori', key: 'kategori', width: 18 },
                { header: 'Birim', key: 'birim', width: 10 },
                { header: 'Min. Stok', key: 'minStok', width: 12 },
                { header: 'Mevcut Stok', key: 'mevcut', width: 14 },
                { header: 'Durum', key: 'durum', width: 12 },
            ]);

            const stokKartlari = await prisma.stokKart.findMany({
                where: { tenantId },
                include: { birim: true, kategori: true },
                orderBy: { ad: 'asc' },
            });

            const hareketler = await prisma.stokHareket.groupBy({
                by: ['stokKartId', 'tip'],
                where: { stokKart: { tenantId } },
                _sum: { miktar: true },
            });

            const bakiyeMap = new Map();
            for (const h of hareketler) {
                const mevcut = bakiyeMap.get(h.stokKartId) || 0;
                bakiyeMap.set(h.stokKartId, mevcut + (GIRIS_TIPLER.has(h.tip) ? h._sum.miktar : -h._sum.miktar));
            }

            stokKartlari.forEach((k, i) => {
                const mevcut = Math.round((bakiyeMap.get(k.id) || 0) * 1000) / 1000;
                const satir = sheet.addRow({
                    kod: k.kod,
                    ad: k.ad,
                    kategori: k.kategori?.ad || '',
                    birim: k.birim?.kisaltma || '',
                    minStok: k.minStok,
                    mevcut,
                    durum: mevcut <= k.minStok && k.minStok > 0 ? 'KRİTİK' : 'NORMAL',
                });
                satir.eachCell(c => { c.style = { ...satirStil(i + 2) }; });
                const durumCell = satir.getCell('durum');
                durumCell.font = { color: { argb: mevcut <= k.minStok && k.minStok > 0 ? 'FFEF4444' : 'FF84CC16' } };
            });
        }

        // ── SATIŞ sayfası ────────────────────────────────────────────────────
        if (moduller.includes('satis')) {
            const sheet = wb.addWorksheet('Satışlar');
            kolonAyarla(sheet, [
                { header: 'Tarih', key: 'tarih', width: 20 },
                { header: 'Şube', key: 'sube', width: 20 },
                { header: 'Reçete', key: 'recete', width: 25 },
                { header: 'Adet', key: 'adet', width: 10 },
                { header: 'Birim Fiyat (₺)', key: 'birimFiyat', width: 16 },
                { header: 'Toplam (₺)', key: 'toplam', width: 14 },
            ]);

            const satislar = await prisma.satis.findMany({
                where: { sube: { tenantId } },
                include: {
                    recete: { select: { ad: true } },
                    sube: { select: { ad: true } },
                },
                orderBy: { tarih: 'desc' },
            });

            satislar.forEach((s, i) => {
                const satir = sheet.addRow({
                    tarih: new Date(s.tarih).toLocaleString('tr-TR'),
                    sube: s.sube?.ad || '',
                    recete: s.recete?.ad || '',
                    adet: s.adet,
                    birimFiyat: s.birimFiyat,
                    toplam: s.toplam,
                });
                satir.eachCell(c => { c.style = { ...satirStil(i + 2) }; });
                satir.getCell('toplam').font = { color: { argb: 'FF84CC16' } };
            });

            // Toplam satırı
            const toplamSatir = sheet.addRow({
                tarih: 'TOPLAM',
                toplam: satislar.reduce((t, s) => t + s.toplam, 0),
            });
            toplamSatir.getCell('tarih').font = { bold: true };
            toplamSatir.getCell('toplam').font = { bold: true, color: { argb: 'FF84CC16' } };
        }

        // ── PERSONEL sayfası ─────────────────────────────────────────────────
        if (moduller.includes('personel')) {
            const sheet = wb.addWorksheet('Personel');
            kolonAyarla(sheet, [
                { header: 'Ad', key: 'ad', width: 15 },
                { header: 'Soyad', key: 'soyad', width: 15 },
                { header: 'Telefon', key: 'telefon', width: 15 },
                { header: 'TC Kimlik', key: 'tcKimlik', width: 15 },
                { header: 'Şube', key: 'sube', width: 20 },
                { header: 'Başlangıç Tarihi', key: 'baslangic', width: 18 },
                { header: 'Maaş (₺)', key: 'maas', width: 12 },
                { header: 'Durum', key: 'durum', width: 10 },
            ]);

            const personeller = await prisma.personel.findMany({
                where: { tenantId },
                include: { sube: { select: { ad: true } } },
                orderBy: [{ sube: { ad: 'asc' } }, { ad: 'asc' }],
            });

            personeller.forEach((p, i) => {
                const satir = sheet.addRow({
                    ad: p.ad,
                    soyad: p.soyad,
                    telefon: p.telefon || '',
                    tcKimlik: p.tcKimlik || '',
                    sube: p.sube?.ad || '',
                    baslangic: new Date(p.baslangicTarihi).toLocaleDateString('tr-TR'),
                    maas: p.maas,
                    durum: p.aktif ? 'Aktif' : 'Pasif',
                });
                satir.eachCell(c => { c.style = { ...satirStil(i + 2) }; });
                const durumCell = satir.getCell('durum');
                durumCell.font = { color: { argb: p.aktif ? 'FF84CC16' : 'FFEF4444' } };
            });
        }

        // ── CARİ sayfası ─────────────────────────────────────────────────────
        if (moduller.includes('cari')) {
            const sheet = wb.addWorksheet('Cari Hesaplar');
            kolonAyarla(sheet, [
                { header: 'Kod', key: 'kod', width: 12 },
                { header: 'Cari Adı', key: 'ad', width: 25 },
                { header: 'Telefon', key: 'telefon', width: 15 },
                { header: 'E-posta', key: 'email', width: 22 },
                { header: 'Adres', key: 'adres', width: 30 },
                { header: 'Bakiye (₺)', key: 'bakiye', width: 14 },
            ]);

            const cariKartlar = await prisma.cariKart.findMany({
                where: { tenantId },
                include: { hareketler: true },
                orderBy: { ad: 'asc' },
            });

            cariKartlar.forEach((c, i) => {
                const bakiye = c.hareketler.reduce((t, h) => {
                    if (h.tip === 'BORC') return t + h.tutar;
                    if (h.tip === 'ALACAK' || h.tip === 'ODEME') return t - h.tutar;
                    return t;
                }, 0);

                const satir = sheet.addRow({
                    kod: c.kod,
                    ad: c.ad,
                    telefon: c.telefon || '',
                    email: c.email || '',
                    adres: c.adres || '',
                    bakiye,
                });
                satir.eachCell(cell => { cell.style = { ...satirStil(i + 2) }; });
                const bakiyeCell = satir.getCell('bakiye');
                bakiyeCell.font = { color: { argb: bakiye > 0 ? 'FFEF4444' : bakiye < 0 ? 'FF84CC16' : 'FFA1A1AA' } };
            });
        }

        // ── STOK HAREKETLERİ sayfası ─────────────────────────────────────────
        if (moduller.includes('stok_hareketleri')) {
            const sheet = wb.addWorksheet('Stok Hareketleri');
            kolonAyarla(sheet, [
                { header: 'Tarih', key: 'tarih', width: 20 },
                { header: 'Şube', key: 'sube', width: 20 },
                { header: 'Stok Adı', key: 'stok', width: 25 },
                { header: 'Tip', key: 'tip', width: 18 },
                { header: 'Miktar', key: 'miktar', width: 12 },
                { header: 'Birim Fiyat (₺)', key: 'birimFiyat', width: 16 },
                { header: 'Açıklama', key: 'aciklama', width: 30 },
            ]);

            const hareketler = await prisma.stokHareket.findMany({
                where: { sube: { tenantId } },
                include: {
                    stokKart: { select: { ad: true } },
                    sube: { select: { ad: true } },
                },
                orderBy: { tarih: 'desc' },
                take: 5000, // max 5000 satır
            });

            const TIP_ETIKET = {
                GIRIS_FATURA: 'Giriş Faturası',
                IADE_FATURA: 'İade Faturası',
                SATIS: 'Satış',
                ZAYI: 'Zayi',
                TUKETIM: 'Tüketim',
                AY_SONU_SAYIM: 'Ay Sonu Sayım',
                SUBE_TRANSFER_IN: 'Transfer Giriş',
                SUBE_TRANSFER_OUT: 'Transfer Çıkış',
            };

            hareketler.forEach((h, i) => {
                const satir = sheet.addRow({
                    tarih: new Date(h.tarih).toLocaleString('tr-TR'),
                    sube: h.sube?.ad || '',
                    stok: h.stokKart?.ad || '',
                    tip: TIP_ETIKET[h.tip] || h.tip,
                    miktar: h.miktar,
                    birimFiyat: h.birimFiyat || '',
                    aciklama: h.aciklama || '',
                });
                satir.eachCell(c => { c.style = { ...satirStil(i + 2) }; });
            });
        }

        // ── Excel'i gönder ───────────────────────────────────────────────────
        const dosyaAdi = `gastrobrain_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Export hatası:', err);
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { tumVeriExport };