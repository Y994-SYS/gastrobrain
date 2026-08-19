const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// Şube ID'sini belirle
const subeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (rol === 'MUDUR' || rol === 'DEPO' || rol === 'KASA') {
        return req.kullanici.subeId;
    }
    return req.query.subeId ? Number(req.query.subeId) : null;
};

// ─── SATIŞ RAPORU ──────────────────────────────────────────────
const satisRaporu = async (req, res) => {
    try {
        const { baslangic, bitis, receteId } = req.query;
        const tenantId = req.kullanici.tenantId;
        const subeId = subeIdBelirle(req);

        const where = { sube: { tenantId } };
        if (subeId) where.subeId = subeId;
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

        // Şube bazlı özet (TENANT_ADMIN için)
        const subeGrup = {};
        for (const s of satislar) {
            const key = s.sube?.ad || 'Merkez';
            if (!subeGrup[key]) subeGrup[key] = { ad: key, adet: 0, ciro: 0 };
            subeGrup[key].adet += s.adet;
            subeGrup[key].ciro += s.toplam;
        }

        res.json({
            satislar,
            ozet: {
                toplamCiro, toplamAdet,
                satisAdedi: satislar.length,
                receteGrup: Object.values(receteGrup).sort((a, b) => b.ciro - a.ciro),
                subeGrup: Object.values(subeGrup).sort((a, b) => b.ciro - a.ciro),
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
        const subeId = subeIdBelirle(req);

        const where = { tenantId };
        if (kategoriId) where.kategoriId = parseInt(kategoriId);

        const stokKartlari = await prisma.stokKart.findMany({
            where,
            include: {
                kategori: true, birim: true,
                stokHareketleri: {
                    where: subeId ? { subeId } : {},
                    orderBy: { tarih: 'desc' }
                },
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

        // Cari hesap tenant bazlı — şube filtresi yok (tedarikçi tüm şubelerle çalışabilir)
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
        const subeId = subeIdBelirle(req);

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
                satislar: subeId ? { where: { subeId } } : true,
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

// ─── KÂR-ZARAR RAPORU (Gelir - Gider) ──────────────────────────
// Not: Maliyet (COGS) hesabı bilinçli olarak subeKarsilastirmasi'ndaki
// BASİTLEŞTİRİLMİŞ formülle aynı tutulmuştur (birimFiyat * kalem.miktar * satis.adet),
// satis.service.js'deki gerçek stok düşüm formülü (carpan/bölen/porsiyon oranlı)
// KULLANILMAMIŞTIR — amaç, "Raporlar" sayfasındaki Maliyet/Kâr rakamlarıyla
// birebir tutarlı kalmaktır.
const karZararRaporu = async (req, res) => {
    try {
        const { baslangic, bitis } = req.query;
        const tenantId = req.kullanici.tenantId;
        const subeId = subeIdBelirle(req);

        if (!baslangic || !bitis) {
            return res.status(400).json({ hata: 'Başlangıç ve bitiş tarihi zorunlu' });
        }
        const baslangicTarihi = new Date(baslangic);
        const bitisTarihi = new Date(bitis);
        bitisTarihi.setHours(23, 59, 59, 999);
        if (isNaN(baslangicTarihi.getTime()) || isNaN(bitisTarihi.getTime()) || bitisTarihi < baslangicTarihi) {
            return res.status(400).json({ hata: 'Geçersiz tarih aralığı' });
        }

        // ── GELİR: Satışlar ──────────────────────────────────────────
        const satisWhere = { sube: { tenantId }, tarih: { gte: baslangicTarihi, lte: bitisTarihi } };
        if (subeId) satisWhere.subeId = subeId;

        const satislar = await prisma.satis.findMany({
            where: satisWhere,
            include: {
                recete: {
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
                        }
                    }
                }
            }
        });

        const toplamGelir = satislar.reduce((t, s) => t + s.toplam, 0);

        // ── MALİYET (COGS) ────────────────────────────────────────────
        let toplamMaliyet = 0;
        for (const satis of satislar) {
            for (const kalem of satis.recete.kalemler) {
                const birimFiyat = kalem.stokKart.stokHareketleri[0]?.birimFiyat || 0;
                toplamMaliyet += birimFiyat * kalem.miktar * satis.adet;
            }
        }

        // ── PERSONEL MAAŞ (sadece FİİLEN ÖDENMİŞ olanlar — nakit çıkışı) ─
        // Avanslar bilinçli olarak DAHİL EDİLMEMİŞTİR: avans daha sonra
        // maaştan kesiliyorsa aynı tutar iki kez sayılmış olurdu. Bu
        // ilişkiyi kesin olarak izleyecek bir mekanizma bulunmadığından
        // (personelMaas ile personelAvans arasında bağlantı yok), çifte
        // sayım riskini almamak için avans bu raporun dışında tutulmuştur.
        const maaslar = await prisma.personelMaas.findMany({
            where: {
                odendi: true,
                tarih: { gte: baslangicTarihi, lte: bitisTarihi },
                personel: { tenantId, ...(subeId ? { subeId } : {}) },
            }
        });
        const toplamMaas = maaslar.reduce((t, m) => t + m.tutar, 0);

        // ── TEDARİKÇİ ÖDEMELERİ (cari — tenant bazlı, şubeye bölünemez) ─
        const odemeler = await prisma.cariHareket.findMany({
            where: {
                tip: 'ODEME',
                tarih: { gte: baslangicTarihi, lte: bitisTarihi },
                cariKart: { tenantId },
            }
        });
        const toplamTedarikciOdeme = odemeler.reduce((t, o) => t + o.tutar, 0);

        // ── ZAYİ GİDERİ (miktar × son giriş fiyatı) ───────────────────
        const zayiWhere = {
            tip: 'ZAYI',
            tarih: { gte: baslangicTarihi, lte: bitisTarihi },
            stokKart: { tenantId },
        };
        if (subeId) zayiWhere.subeId = subeId;
        const zayiHareketleri = await prisma.stokHareket.findMany({
            where: zayiWhere,
            include: {
                stokKart: {
                    include: {
                        stokHareketleri: { where: { tip: 'GIRIS_FATURA' }, orderBy: { tarih: 'desc' }, take: 1 }
                    }
                }
            }
        });
        let toplamZayiGideri = 0;
        for (const h of zayiHareketleri) {
            const sonFiyat = h.stokKart.stokHareketleri[0]?.birimFiyat || 0;
            toplamZayiGideri += sonFiyat * h.miktar;
        }

        // ── ÖZET ────────────────────────────────────────────────────
        const brutKar = toplamGelir - toplamMaliyet;
        const toplamGider = toplamMaliyet + toplamMaas + toplamTedarikciOdeme + toplamZayiGideri;
        const netKar = toplamGelir - toplamGider;

        res.json({
            donem: { baslangic: baslangicTarihi, bitis: bitisTarihi },
            gelir: {
                satisCiro: Math.round(toplamGelir * 100) / 100,
                satisAdedi: satislar.length,
            },
            giderler: {
                maliyet: Math.round(toplamMaliyet * 100) / 100,
                personelMaas: Math.round(toplamMaas * 100) / 100,
                tedarikciOdemeleri: Math.round(toplamTedarikciOdeme * 100) / 100,
                zayiGideri: Math.round(toplamZayiGideri * 100) / 100,
            },
            ozet: {
                toplamGelir: Math.round(toplamGelir * 100) / 100,
                brutKar: Math.round(brutKar * 100) / 100,
                brutKarMarji: toplamGelir > 0 ? Math.round((brutKar / toplamGelir) * 10000) / 100 : 0,
                toplamGider: Math.round(toplamGider * 100) / 100,
                netKar: Math.round(netKar * 100) / 100,
                netKarMarji: toplamGelir > 0 ? Math.round((netKar / toplamGelir) * 10000) / 100 : 0,
            },
            notlar: {
                // Frontend bu bayrakları kullanıcıya açıklayıcı not olarak gösterebilir
                cariTumIsletmeGeneli: true,
                avansDahilDegil: true,
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
        const subeId = subeIdBelirle(req);
        const wb = XLSX.utils.book_new();

        if (tip === 'satis') {
            const where = { sube: { tenantId } };
            if (subeId) where.subeId = subeId;
            if (baslangic || bitis) {
                where.tarih = {};
                if (baslangic) where.tarih.gte = new Date(baslangic);
                if (bitis) { const d = new Date(bitis); d.setHours(23, 59, 59, 999); where.tarih.lte = d; }
            }
            const satislar = await prisma.satis.findMany({
                where,
                include: { recete: true, sube: true },
                orderBy: { tarih: 'desc' }
            });
            const data = satislar.map(s => ({
                'Tarih': new Date(s.tarih).toLocaleDateString('tr-TR'),
                'Şube': s.sube?.ad || '-',
                'Reçete': s.recete.ad,
                'Adet': s.adet,
                'Birim Fiyat': s.birimFiyat,
                'Toplam': s.toplam,
                'Açıklama': s.aciklama || '',
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Satışlar');

        } else if (tip === 'stok') {
            const stokKartlari = await prisma.stokKart.findMany({
                where: { tenantId },
                include: {
                    kategori: true, birim: true,
                    stokHareketleri: {
                        where: subeId ? { subeId } : {},
                        orderBy: { tarih: 'desc' }
                    }
                },
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
                    'Birim': kart.birim.kisaltma,
                    'Mevcut Stok': Math.round(mevcutStok * 1000) / 1000,
                    'Min Stok': kart.minStok,
                    'Durum': mevcutStok <= kart.minStok ? 'KRİTİK' : 'NORMAL',
                    'Son Fiyat': sonFiyat,
                    'Stok Değeri': Math.round(sonFiyat * Math.max(mevcutStok, 0) * 100) / 100,
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
                    'Adres': kart.adres || '',
                    'Bakiye': Math.round(bakiye * 100) / 100,
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
                    satislar: subeId ? { where: { subeId } } : true,
                },
            });
            const data = receteler.map(r => {
                let maliyet = 0;
                for (const k of r.kalemler) { maliyet += (k.stokKart.stokHareketleri[0]?.birimFiyat || 0) * k.miktar; }
                const satisFiyati = r.satisFiyati || 0;
                return {
                    'Reçete': r.ad, 'Satış Kodu': r.satisKodu || '',
                    'Satış Fiyatı': satisFiyati,
                    'Maliyet': Math.round(maliyet * 100) / 100,
                    'Kâr': Math.round((satisFiyati - maliyet) * 100) / 100,
                    'Kâr Marjı %': satisFiyati > 0 ? Math.round((satisFiyati - maliyet) / satisFiyati * 10000) / 100 : 0,
                    'Toplam Satış Adedi': r.satislar.reduce((t, s) => t + s.adet, 0),
                    'Toplam Ciro': r.satislar.reduce((t, s) => t + s.toplam, 0),
                };
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Maliyet Analizi');
        }

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const dosyaAdi = `gastrobrain_${tip}_raporu_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${dosyaAdi}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};
// ─── ŞUBELER KARŞILAŞTIRMASI RAPORU ─────────────────────
const subeKarsilastirmasi = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;

        // Tüm şubeleri getir
        const subeler = await prisma.sube.findMany({
            where: { tenantId, aktif: true },
            include: {
                satislar: {
                    include: {
                        recete: {
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
                                }
                            }
                        }
                    }
                },
                stokHareketleri: true,
                personeller: { where: { aktif: true } }
            }
        });

        // Her şube için analiz
        const subeAnaliz = subeler.map(sube => {
            // Satış metrikleri
            const toplamSatis = sube.satislar.reduce((t, s) => t + s.toplam, 0);
            const toplamAdet = sube.satislar.reduce((t, s) => t + s.adet, 0);

            // Maliyet hesabı
            let toplamMaliyet = 0;
            for (const satis of sube.satislar) {
                for (const kalem of satis.recete.kalemler) {
                    const birimFiyat = kalem.stokKart.stokHareketleri[0]?.birimFiyat || 0;
                    toplamMaliyet += birimFiyat * kalem.miktar * satis.adet;
                }
            }

            const kar = toplamSatis - toplamMaliyet;
            const karMarji = toplamSatis > 0 ? (kar / toplamSatis) * 100 : 0;

            // Zayi hesabı
            const zayiMiktar = sube.stokHareketleri
                .filter(h => h.tip === 'ZAYI')
                .reduce((t, h) => t + h.miktar, 0);

            // Stok değeri
            const stokKartlari = new Set(sube.stokHareketleri.map(h => h.stokKartId));
            let toplamStokDegeri = 0;
            for (const hareketId of stokKartlari) {
                const hareketler = sube.stokHareketleri.filter(h => h.stokKartId === hareketId);
                let bakiye = 0;
                for (const h of hareketler) {
                    if (['GIRIS_FATURA', 'IADE_FATURA', 'SUBE_TRANSFER_IN'].includes(h.tip)) bakiye += h.miktar;
                    else bakiye -= h.miktar;
                }
                // Son fiyat (simplify — real: DB'den çekmek gerekir)
                const sonFiyat = hareketler.find(h => h.tip === 'GIRIS_FATURA')?.birimFiyat || 0;
                toplamStokDegeri += sonFiyat * Math.max(bakiye, 0);
            }

            return {
                id: sube.id,
                ad: sube.ad,
                toplamSatis: Math.round(toplamSatis * 100) / 100,
                toplamAdet,
                toplamMaliyet: Math.round(toplamMaliyet * 100) / 100,
                kar: Math.round(kar * 100) / 100,
                karMarji: Math.round(karMarji * 100) / 100,
                zayiMiktar: Math.round(zayiMiktar * 1000) / 1000,
                zayiOrani: toplamSatis > 0 ? Math.round((zayiMiktar / toplamAdet) * 100 * 100) / 100 : 0, // Satışa göre zayi %
                personelSayisi: sube.personeller.length,
                toplamStokDegeri: Math.round(toplamStokDegeri * 100) / 100,
            };
        });

        // En iyi şubeyi bul
        const enYuksekSatis = Math.max(...subeAnaliz.map(s => s.toplamSatis), 0);
        const enYuksekKar = Math.max(...subeAnaliz.map(s => s.karMarji), 0);
        const enDusukZayi = Math.min(...subeAnaliz.map(s => s.zayiOrani), Infinity);

        res.json({
            subeler: subeAnaliz.sort((a, b) => b.toplamSatis - a.toplamSatis),
            ozet: {
                toplamSubeSayisi: subeAnaliz.length,
                toplamCiro: Math.round(subeAnaliz.reduce((t, s) => t + s.toplamSatis, 0) * 100) / 100,
                toplamMaliyet: Math.round(subeAnaliz.reduce((t, s) => t + s.toplamMaliyet, 0) * 100) / 100,
                toplamKar: Math.round(subeAnaliz.reduce((t, s) => t + s.kar, 0) * 100) / 100,
                ortalamaKarMarji: subeAnaliz.length
                    ? Math.round(subeAnaliz.reduce((t, s) => t + s.karMarji, 0) / subeAnaliz.length * 100) / 100
                    : 0,
                toplamPersonel: subeAnaliz.reduce((t, s) => t + s.personelSayisi, 0),
            },
            enIyi: {
                enYuksekSatisSube: subeAnaliz.find(s => s.toplamSatis === enYuksekSatis)?.ad,
                enYuksekKarSube: subeAnaliz.find(s => s.karMarji === enYuksekKar)?.ad,
                enDusukZayiSube: subeAnaliz.find(s => s.zayiOrani === enDusukZayi)?.ad,
            },
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};
// ─── MERKEZ MUHASEBESİ RAPORU ──────────────────────────
const merkezMuhasebesi = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;

        // Tüm cari kartları ve hareketlerini getir
        const cariKartlar = await prisma.cariKart.findMany({
            where: { tenantId },
            include: {
                hareketler: {
                    include: {
                        kalemler: {
                            include: {
                                stokKart: true
                            }
                        }
                    }
                }
            }
        });

        // Her tedarikçi için şube bazlı borç/alacak hesapla
        const tedarikciAnaliz = cariKartlar.map(cari => {
            let toplamBorc = 0;
            let toplamAlacak = 0;

            for (const hareket of cari.hareketler) {
                if (hareket.tip === 'BORC') {
                    toplamBorc += hareket.tutar;
                } else if (['ALACAK', 'ODEME'].includes(hareket.tip)) {
                    // DÜZELTME: Bu alanda daha önce 'TAHSILAT' aranıyordu — bu
                    // enum değeri sistemde hiç kullanılmıyor (gerçek kayıt tipi
                    // 'ODEME'), bu yüzden yapılan tüm ödemeler borçtan hiç
                    // düşülmüyordu ve Merkez Muhasebesi raporu borcu olduğundan
                    // çok daha yüksek gösteriyordu. cariRaporu ile aynı enum'a
                    // (ODEME) çekildi.
                    toplamAlacak += hareket.tutar;
                }
            }

            const netBakiye = toplamAlacak - toplamBorc;

            return {
                id: cari.id,
                kod: cari.kod,
                ad: cari.ad,
                telefon: cari.telefon,
                email: cari.email,
                adres: cari.adres,
                toplamBorc: Math.round(toplamBorc * 100) / 100,
                toplamAlacak: Math.round(toplamAlacak * 100) / 100,
                netBakiye: Math.round(netBakiye * 100) / 100,
                durum: netBakiye < 0 ? 'BORÇLU' : netBakiye > 0 ? 'ALACAKLI' : 'SIFIR',
                hareketSayisi: cari.hareketler.length
            };
        });

        // ÖZET KARTLAR — Cari Raporu ile AYNI mantık kullanılır: ham BORC /
        // (ÖDEME+ALACAK) bileşen toplamları DEĞİL, sadece her tedarikçinin
        // NET BAKİYESİ toplanır. Önceki hesap (ham bileşen toplamı) kapanmış
        // hesapları da (örn. borcu tamamen ödenmiş bir tedarikçi) "Toplam
        // Borç" kartına dahil ediyordu — bu da alttaki "Net Durum" özetiyle
        // çelişen, yanıltıcı derecede büyük bir rakam üretiyordu.
        const toplamBorc = tedarikciAnaliz
            .filter(t => t.netBakiye < 0)
            .reduce((t, c) => t + Math.abs(c.netBakiye), 0);
        const toplamAlacak = tedarikciAnaliz
            .filter(t => t.netBakiye > 0)
            .reduce((t, c) => t + c.netBakiye, 0);
        const netToplam = toplamAlacak - toplamBorc;

        res.json({
            tedarikciler: tedarikciAnaliz
                .filter(t => t.toplamBorc > 0 || t.toplamAlacak > 0)
                .sort((a, b) => Math.abs(b.netBakiye) - Math.abs(a.netBakiye)),
            ozet: {
                toplamTedarikci: cariKartlar.length,
                borcletedarikci: tedarikciAnaliz.filter(t => t.durum === 'BORÇLU').length,
                alacakliTedarikci: tedarikciAnaliz.filter(t => t.durum === 'ALACAKLI').length,
                toplamBorc: Math.round(toplamBorc * 100) / 100,
                toplamAlacak: Math.round(toplamAlacak * 100) / 100,
                netToplam: Math.round(netToplam * 100) / 100,
            }
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { satisRaporu, stokRaporu, cariRaporu, maliyetRaporu, karZararRaporu, excelExport, subeKarsilastirmasi, merkezMuhasebesi };