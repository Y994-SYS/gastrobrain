const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// ─── SATIŞ RAPORU ──────────────────────────────────────────────
const satisRaporu = async (req, res) => {
    try {
        const { baslangic, bitis, receteId } = req.query;
        const tenantId = req.kullanici.tenantId;

        const where = { sube: { tenantId } };
        if (baslangic || bitis) {
            where.tarih = {};
            if (baslangic) where.tarih.gte = new Date(baslangic);
            if (bitis) { const d = new Date(bitis); d.setHours(23, 59, 59, 999); where.tarih.lte = d; }
        }
        if (receteId) where.receteId = parseInt(receteId);

        const satislar = await prisma.satis.findMany({
            where,
            include: { recete: true, sube: true },
            orderBy: { tarih: 'desc' },
        });

        const toplamCiro = satislar.reduce((t, s) => t + s.toplam, 0);
        const toplamAdet = satislar.reduce((t, s) => t + s.adet, 0);

        const receteGrup = {};
        for (const s of satislar) {
            const key = s.recete.ad;
            if (!receteGrup[key]) receteGrup[key] = { ad: key, adet: 0, ciro: 0 };
            receteGrup[key].adet += s.adet;
            receteGrup[key].ciro += s.toplam;
        }

        res.json({
            satislar,
            ozet: {
                toplamCiro, toplamAdet,
                satisAdedi: satislar.length,
                receteGrup: Object.values(receteGrup).sort((a, b) => b.ciro - a.ciro),
            },
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── STOK RAPORU ───────────────────────────────────────────────
const stokRaporu = async (req, res) => {
    try {
        const { kategoriId, sadecekritik } = req.query;
        const tenantId = req.kullanici.tenantId;

        const where = { tenantId };
        if (kategoriId) where.kategoriId = parseInt(kategoriId);

        const stokKartlari = await prisma.stokKart.findMany({
            where,
            include: {
                kategori: true, birim: true,
                stokHareketleri: { orderBy: { tarih: 'desc' } },
            },
        });

        const stokDurumlari = stokKartlari.map(kart => {
            let mevcutStok = 0;
            for (const h of kart.stokHareketleri) {
                if (['GIRIS_FATURA', 'SUBE_TRANSFER_IN', 'AY_SONU_SAYIM'].includes(h.tip)) mevcutStok += h.miktar;
                else mevcutStok -= h.miktar;
            }
            const sonGiris = kart.stokHareketleri.find(h => h.tip === 'GIRIS_FATURA');
            return {
                id: kart.id, kod: kart.kod, ad: kart.ad,
                kategori: kart.kategori.ad, birim: kart.birim.kisaltma,
                mevcutStok: Math.round(mevcutStok * 1000) / 1000,
                minStok: kart.minStok, kritikMi: mevcutStok <= kart.minStok,
                sonBirimFiyat: sonGiris?.birimFiyat || 0,
                stokDegeri: (sonGiris?.birimFiyat || 0) * Math.max(mevcutStok, 0),
            };
        });

        const filtrelenmis = sadecekritik === 'true' ? stokDurumlari.filter(s => s.kritikMi) : stokDurumlari;
        const toplamDeger = filtrelenmis.reduce((t, s) => t + s.stokDegeri, 0);
        const kritikSayisi = stokDurumlari.filter(s => s.kritikMi).length;

        res.json({
            stoklar: filtrelenmis,
            ozet: { toplamKart: stokDurumlari.length, kritikSayisi, toplamDeger },
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── CARİ RAPORU ───────────────────────────────────────────────
const cariRaporu = async (req, res) => {
    try {
        const { cariKartId, baslangic, bitis } = req.query;
        const tenantId = req.kullanici.tenantId;

        const where = { cariKart: { tenantId } };
        if (cariKartId) where.cariKartId = parseInt(cariKartId);
        if (baslangic || bitis) {
            where.tarih = {};
            if (baslangic) where.tarih.gte = new Date(baslangic);
            if (bitis) { const d = new Date(bitis); d.setHours(23, 59, 59, 999); where.tarih.lte = d; }
        }

        const hareketler = await prisma.cariHareket.findMany({
            where,
            include: { cariKart: true },
            orderBy: { tarih: 'desc' },
        });

        const cariKartlar = await prisma.cariKart.findMany({
            where: { tenantId },
            include: { hareketler: true },
        });

        const bakiyeler = cariKartlar.map(kart => {
            let bakiye = 0;
            for (const h of kart.hareketler) {
                if (h.tip === 'BORC') bakiye -= h.tutar;
                else if (['ALACAK', 'ODEME'].includes(h.tip)) bakiye += h.tutar;
            }
            return {
                id: kart.id, kod: kart.kod, ad: kart.ad, telefon: kart.telefon,
                bakiye: Math.round(bakiye * 100) / 100,
                hareketSayisi: kart.hareketler.length,
            };
        });

        const toplamBorc = bakiyeler.filter(b => b.bakiye < 0).reduce((t, b) => t + Math.abs(b.bakiye), 0);
        const toplamAlacak = bakiyeler.filter(b => b.bakiye > 0).reduce((t, b) => t + b.bakiye, 0);

        res.json({
            hareketler,
            bakiyeler: bakiyeler.sort((a, b) => a.bakiye - b.bakiye),
            ozet: { toplamBorc, toplamAlacak, netBakiye: toplamAlacak - toplamBorc },
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── MALİYET RAPORU ────────────────────────────────────────────
const maliyetRaporu = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;

        const receteler = await prisma.recete.findMany({
            where: { tenantId },
            include: {
                kalemler: {
                    include: {
                        stokKart: {
                            include: {
                                stokHareketleri: {
                                    where: { tip: 'GIRIS_FATURA' },
                                    orderBy: { tarih: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                satislar: true,
            },
        });

        const maliyetler = receteler.map(recete => {
            let toplamMaliyet = 0;
            const kalemDetay = recete.kalemler.map(kalem => {
                const sonFiyat = kalem.stokKart.stokHareketleri[0]?.birimFiyat || 0;
                const kalemMaliyet = sonFiyat * kalem.miktar;
                toplamMaliyet += kalemMaliyet;
                return { stokAd: kalem.stokKart.ad, miktar: kalem.miktar, birimFiyat: sonFiyat, maliyet: kalemMaliyet };
            });

            const satisFiyati = recete.satisFiyati || 0;
            const karMarji = satisFiyati > 0 ? ((satisFiyati - toplamMaliyet) / satisFiyati) * 100 : 0;

            return {
                id: recete.id, ad: recete.ad, satisKodu: recete.satisKodu, satisFiyati,
                toplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
                karMiktari: Math.round((satisFiyati - toplamMaliyet) * 100) / 100,
                karMarji: Math.round(karMarji * 100) / 100,
                toplamSatis: recete.satislar.reduce((t, s) => t + s.adet, 0),
                toplamCiro: recete.satislar.reduce((t, s) => t + s.toplam, 0),
                kalemDetay,
            };
        });

        res.json({
            maliyetler: maliyetler.sort((a, b) => b.toplamCiro - a.toplamCiro),
            ozet: {
                receteSayisi: maliyetler.length,
                ortalamaKarMarji: maliyetler.length
                    ? Math.round(maliyetler.reduce((t, m) => t + m.karMarji, 0) / maliyetler.length * 100) / 100
                    : 0,
            },
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── EXCEL EXPORT ──────────────────────────────────────────────
const excelExport = async (req, res) => {
    try {
        const { tip, baslangic, bitis } = req.query;
        const tenantId = req.kullanici.tenantId;
        const wb = XLSX.utils.book_new();

        if (tip === 'satis') {
            const where = { sube: { tenantId } };
            if (baslangic || bitis) {
                where.tarih = {};
                if (baslangic) where.tarih.gte = new Date(baslangic);
                if (bitis) { const d = new Date(bitis); d.setHours(23, 59, 59, 999); where.tarih.lte = d; }
            }
            const satislar = await prisma.satis.findMany({ where, include: { recete: true }, orderBy: { tarih: 'desc' } });
            const data = satislar.map(s => ({
                'Tarih': new Date(s.tarih).toLocaleDateString('tr-TR'),
                'Reçete': s.recete.ad, 'Adet': s.adet,
                'Birim Fiyat': s.birimFiyat, 'Toplam': s.toplam, 'Açıklama': s.aciklama || '',
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Satışlar');

        } else if (tip === 'stok') {
            const stokKartlari = await prisma.stokKart.findMany({
                where: { tenantId },
                include: { kategori: true, birim: true, stokHareketleri: { orderBy: { tarih: 'desc' } } },
            });
            const data = stokKartlari.map(kart => {
                let mevcutStok = 0;
                for (const h of kart.stokHareketleri) {
                    if (['GIRIS_FATURA', 'SUBE_TRANSFER_IN', 'AY_SONU_SAYIM'].includes(h.tip)) mevcutStok += h.miktar;
                    else mevcutStok -= h.miktar;
                }
                const sonFiyat = kart.stokHareketleri.find(h => h.tip === 'GIRIS_FATURA')?.birimFiyat || 0;
                return {
                    'Kod': kart.kod, 'Ad': kart.ad, 'Kategori': kart.kategori.ad,
                    'Birim': kart.birim.kisaltma, 'Mevcut Stok': Math.round(mevcutStok * 1000) / 1000,
                    'Min Stok': kart.minStok, 'Durum': mevcutStok <= kart.minStok ? 'KRİTİK' : 'NORMAL',
                    'Son Fiyat': sonFiyat, 'Stok Değeri': Math.round(sonFiyat * Math.max(mevcutStok, 0) * 100) / 100,
                };
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Stok Durumu');

        } else if (tip === 'cari') {
            const cariKartlar = await prisma.cariKart.findMany({
                where: { tenantId },
                include: { hareketler: true }
            });
            const data = cariKartlar.map(kart => {
                let bakiye = 0;
                for (const h of kart.hareketler) {
                    if (h.tip === 'BORC') bakiye -= h.tutar;
                    else if (['ALACAK', 'ODEME'].includes(h.tip)) bakiye += h.tutar;
                }
                return {
                    'Kod': kart.kod, 'Ad': kart.ad, 'Telefon': kart.telefon || '',
                    'Adres': kart.adres || '', 'Bakiye': Math.round(bakiye * 100) / 100,
                    'Durum': bakiye < 0 ? 'BORÇLU' : bakiye > 0 ? 'ALACAKLI' : 'SIFIR',
                };
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Cari Bakiyeler');

        } else if (tip === 'maliyet') {
            const receteler = await prisma.recete.findMany({
                where: { tenantId },
                include: {
                    kalemler: {
                        include: {
                            stokKart: {
                                include: { stokHareketleri: { where: { tip: 'GIRIS_FATURA' }, orderBy: { tarih: 'desc' }, take: 1 } }
                            }
                        }
                    },
                    satislar: true,
                },
            });
            const data = receteler.map(r => {
                let maliyet = 0;
                for (const k of r.kalemler) { maliyet += (k.stokKart.stokHareketleri[0]?.birimFiyat || 0) * k.miktar; }
                const satisFiyati = r.satisFiyati || 0;
                return {
                    'Reçete': r.ad, 'Satış Kodu': r.satisKodu || '',
                    'Satış Fiyatı': satisFiyati, 'Maliyet': Math.round(maliyet * 100) / 100,
                    'Kâr': Math.round((satisFiyati - maliyet) * 100) / 100,
                    'Kâr Marjı %': satisFiyati > 0 ? Math.round((satisFiyati - maliyet) / satisFiyati * 10000) / 100 : 0,
                    'Toplam Satış Adedi': r.satislar.reduce((t, s) => t + s.adet, 0),
                    'Toplam Ciro': r.satislar.reduce((t, s) => t + s.toplam, 0),
                };
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Maliyet Analizi');
        }

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const dosyaAdi = `gastroiq_${tip}_raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { satisRaporu, stokRaporu, cariRaporu, maliyetRaporu, excelExport };