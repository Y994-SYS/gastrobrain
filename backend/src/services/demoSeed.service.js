const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function demoBilgileriOlustur(tenantId, subeId) {
    try {
        // ─── KATEGORİLER ───────────────────────────────────────
        const kategoriler = await Promise.all([
            prisma.kategori.create({ data: { ad: 'Et & Tavuk', tenantId } }),
            prisma.kategori.create({ data: { ad: 'Sebze & Meyve', tenantId } }),
            prisma.kategori.create({ data: { ad: 'Kuru Gıda', tenantId } }),
            prisma.kategori.create({ data: { ad: 'Süt Ürünleri', tenantId } }),
            prisma.kategori.create({ data: { ad: 'İçecek', tenantId } }),
        ]);
        const katMap = Object.fromEntries(kategoriler.map(k => [k.ad, k.id]));

        // ─── ÖLÇÜ BİRİMLERİ ────────────────────────────────────
        const birimler = await Promise.all([
            prisma.olcuBirimi.create({ data: { ad: 'Kilogram', kisaltma: 'kg', tenantId } }),
            prisma.olcuBirimi.create({ data: { ad: 'Gram', kisaltma: 'gr', tenantId } }),
            prisma.olcuBirimi.create({ data: { ad: 'Litre', kisaltma: 'lt', tenantId } }),
            prisma.olcuBirimi.create({ data: { ad: 'Mililitre', kisaltma: 'ml', tenantId } }),
            prisma.olcuBirimi.create({ data: { ad: 'Adet', kisaltma: 'ad', tenantId } }),
        ]);
        const birMap = Object.fromEntries(birimler.map(b => [b.kisaltma, b.id]));

        // ─── STOK KARTLARI ─────────────────────────────────────
        const stoklar = [
            { kod: 'STK001', ad: 'Dana Kıyma', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 10 },
            { kod: 'STK002', ad: 'Tavuk Göğsü', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 8 },
            { kod: 'STK003', ad: 'Dana Kuşbaşı', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 5 },
            { kod: 'STK004', ad: 'Domates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 15 },
            { kod: 'STK005', ad: 'Soğan', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 20 },
            { kod: 'STK006', ad: 'Patates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 25 },
            { kod: 'STK007', ad: 'Biber', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 8 },
            { kod: 'STK008', ad: 'Un', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 30 },
            { kod: 'STK009', ad: 'Ayçiçek Yağı', kategoriId: katMap['Kuru Gıda'], birimId: birMap['lt'], minStok: 10 },
            { kod: 'STK010', ad: 'Tuz', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 5 },
            { kod: 'STK011', ad: 'Şeker', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 5 },
            { kod: 'STK012', ad: 'Tereyağı', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 3 },
            { kod: 'STK013', ad: 'Yoğurt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 5 },
            { kod: 'STK014', ad: 'Tam Yağlı Süt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['lt'], minStok: 8 },
            { kod: 'STK015', ad: 'Maden Suyu 500ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 48 },
            { kod: 'STK016', ad: 'Kola 330ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 24 },
            { kod: 'STK017', ad: 'Ayran 200ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 36 },
            { kod: 'STK018', ad: 'Sarımsak', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 3 },
        ];

        const stokKartlari = await Promise.all(
            stoklar.map(s => prisma.stokKart.create({ data: { ...s, tenantId } }))
        );
        const stokMap = Object.fromEntries(stokKartlari.map(s => [s.ad, s.id]));

        // ─── STOK GİRİŞLERİ ────────────────────────────────────
        const stokGirisleri = [
            { stokAd: 'Dana Kıyma', miktar: 30, birimFiyat: 380 },
            { stokAd: 'Tavuk Göğsü', miktar: 25, birimFiyat: 180 },
            { stokAd: 'Dana Kuşbaşı', miktar: 15, birimFiyat: 420 },
            { stokAd: 'Domates', miktar: 40, birimFiyat: 25 },
            { stokAd: 'Soğan', miktar: 50, birimFiyat: 15 },
            { stokAd: 'Patates', miktar: 60, birimFiyat: 18 },
            { stokAd: 'Biber', miktar: 20, birimFiyat: 30 },
            { stokAd: 'Un', miktar: 50, birimFiyat: 22 },
            { stokAd: 'Ayçiçek Yağı', miktar: 25, birimFiyat: 95 },
            { stokAd: 'Tuz', miktar: 10, birimFiyat: 12 },
            { stokAd: 'Şeker', miktar: 10, birimFiyat: 28 },
            { stokAd: 'Tereyağı', miktar: 8, birimFiyat: 220 },
            { stokAd: 'Yoğurt', miktar: 20, birimFiyat: 45 },
            { stokAd: 'Tam Yağlı Süt', miktar: 20, birimFiyat: 38 },
            { stokAd: 'Maden Suyu 500ml', miktar: 144, birimFiyat: 8 },
            { stokAd: 'Kola 330ml', miktar: 72, birimFiyat: 15 },
            { stokAd: 'Ayran 200ml', miktar: 96, birimFiyat: 10 },
            { stokAd: 'Sarımsak', miktar: 8, birimFiyat: 60 },
        ];

        await Promise.all(stokGirisleri.map(g => prisma.stokHareket.create({
            data: {
                tip: 'GIRIS_FATURA',
                miktar: g.miktar,
                birimFiyat: g.birimFiyat,
                aciklama: 'Demo açılış stoku',
                stokKartId: stokMap[g.stokAd],
                subeId,
            }
        })));

        // Zayi ve tüketim örnekleri
        await prisma.stokHareket.create({
            data: { tip: 'ZAYI', miktar: 1.5, aciklama: 'Bozulan ürün', stokKartId: stokMap['Domates'], subeId }
        });
        await prisma.stokHareket.create({
            data: { tip: 'ZAYI', miktar: 0.8, aciklama: 'Son kullanma tarihi geçti', stokKartId: stokMap['Tam Yağlı Süt'], subeId }
        });
        await prisma.stokHareket.create({
            data: { tip: 'TUKETIM', miktar: 2, aciklama: 'Personel tüketimi', stokKartId: stokMap['Ayçiçek Yağı'], subeId }
        });
        await prisma.stokHareket.create({
            data: { tip: 'TUKETIM', miktar: 0.5, aciklama: 'Temizlik malzemesi', stokKartId: stokMap['Tuz'], subeId }
        });

        // ─── CARİ KARTLAR ──────────────────────────────────────
        const cariler = await Promise.all([
            prisma.cariKart.create({ data: { kod: 'CAR001', ad: 'Örnek Gıda A.Ş.', telefon: '02121234567', adres: 'İstanbul, Bağcılar', tenantId } }),
            prisma.cariKart.create({ data: { kod: 'CAR002', ad: 'Demo Et Pazarı', telefon: '02164567890', adres: 'İstanbul, Ümraniye', tenantId } }),
            prisma.cariKart.create({ data: { kod: 'CAR003', ad: 'Test Sebze Kooperatif', telefon: '02623456789', adres: 'Kocaeli, Gebze', tenantId } }),
            prisma.cariKart.create({ data: { kod: 'CAR004', ad: 'Nur Süt Ürünleri', telefon: '02242345678', adres: 'Bursa, Nilüfer', tenantId } }),
        ]);

        // Cari hareketler — borç ve ödemeler
        await prisma.cariHareket.create({
            data: { tip: 'BORC', tutar: 11400, aciklama: 'Et alımı faturası', belgeNo: 'FTR-001', cariKartId: cariler[1].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'ODEME', tutar: 6000, aciklama: 'Kısmi ödeme', belgeNo: 'OD-001', cariKartId: cariler[1].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'BORC', tutar: 4750, aciklama: 'Sebze alımı faturası', belgeNo: 'FTR-002', cariKartId: cariler[2].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'ODEME', tutar: 4750, aciklama: 'Tam ödeme', belgeNo: 'OD-002', cariKartId: cariler[2].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'BORC', tutar: 8250, aciklama: 'Gıda alımı faturası', belgeNo: 'FTR-003', cariKartId: cariler[0].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'BORC', tutar: 3960, aciklama: 'Süt ürünleri faturası', belgeNo: 'FTR-004', cariKartId: cariler[3].id }
        });
        await prisma.cariHareket.create({
            data: { tip: 'ODEME', tutar: 2000, aciklama: 'Kısmi ödeme', belgeNo: 'OD-003', cariKartId: cariler[3].id }
        });

        // ─── REÇETELER ─────────────────────────────────────────
        const receteListesi = [
            {
                ad: 'Köfte Porsiyon', satisKodu: 'REC001', satisFiyati: 220,
                kalemler: [
                    { stokAd: 'Dana Kıyma', miktar: 0.200 },
                    { stokAd: 'Soğan', miktar: 0.050 },
                    { stokAd: 'Tuz', miktar: 0.005 },
                ],
            },
            {
                ad: 'Tavuk Şiş', satisKodu: 'REC002', satisFiyati: 190,
                kalemler: [
                    { stokAd: 'Tavuk Göğsü', miktar: 0.250 },
                    { stokAd: 'Biber', miktar: 0.050 },
                    { stokAd: 'Ayçiçek Yağı', miktar: 0.020 },
                    { stokAd: 'Tuz', miktar: 0.004 },
                ],
            },
            {
                ad: 'Patates Kızartması', satisKodu: 'REC003', satisFiyati: 80,
                kalemler: [
                    { stokAd: 'Patates', miktar: 0.300 },
                    { stokAd: 'Ayçiçek Yağı', miktar: 0.100 },
                    { stokAd: 'Tuz', miktar: 0.003 },
                ],
            },
            {
                ad: 'Dana Güveç', satisKodu: 'REC004', satisFiyati: 320,
                kalemler: [
                    { stokAd: 'Dana Kuşbaşı', miktar: 0.200 },
                    { stokAd: 'Domates', miktar: 0.100 },
                    { stokAd: 'Soğan', miktar: 0.075 },
                    { stokAd: 'Biber', miktar: 0.050 },
                    { stokAd: 'Tereyağı', miktar: 0.020 },
                    { stokAd: 'Sarımsak', miktar: 0.010 },
                    { stokAd: 'Tuz', miktar: 0.005 },
                ],
            },
        ];

        const olusturulanReceteler = [];
        for (const r of receteListesi) {
            const recete = await prisma.recete.create({
                data: { ad: r.ad, satisKodu: r.satisKodu, satisFiyati: r.satisFiyati, tenantId }
            });
            await prisma.receteKalem.createMany({
                data: r.kalemler.map(k => ({
                    receteId: recete.id,
                    stokKartId: stokMap[k.stokAd],
                    miktar: k.miktar,
                }))
            });
            olusturulanReceteler.push(recete);
        }

        const receteIdMap = Object.fromEntries(olusturulanReceteler.map(r => [r.satisKodu, r.id]));
        const satisFiyatMap = Object.fromEntries(olusturulanReceteler.map(r => [r.satisKodu, r.satisFiyati]));

        // ─── ÖRNEK SATIŞLAR (son 14 gün) ───────────────────────
        const bugun = new Date();
        for (let gun = 13; gun >= 0; gun--) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - gun);
            tarih.setHours(13, 0, 0, 0);

            const gunlukSatislar = [
                { satisKodu: 'REC001', adet: Math.floor(Math.random() * 15) + 8 },
                { satisKodu: 'REC002', adet: Math.floor(Math.random() * 12) + 6 },
                { satisKodu: 'REC003', adet: Math.floor(Math.random() * 25) + 10 },
                { satisKodu: 'REC004', adet: Math.floor(Math.random() * 8) + 3 },
            ];

            for (const s of gunlukSatislar) {
                const birimFiyat = satisFiyatMap[s.satisKodu];
                await prisma.satis.create({
                    data: {
                        receteId: receteIdMap[s.satisKodu],
                        subeId,
                        adet: s.adet,
                        birimFiyat,
                        toplam: s.adet * birimFiyat,
                        tarih,
                    }
                });
            }
        }

        // ─── PERSONEL ──────────────────────────────────────────
        const personeller = await Promise.all([
            prisma.personel.create({
                data: {
                    ad: 'Ahmet', soyad: 'Yılmaz', telefon: '05321234567',
                    baslangicTarihi: new Date('2024-01-15'),
                    maas: 25000, tenantId, subeId,
                }
            }),
            prisma.personel.create({
                data: {
                    ad: 'Fatma', soyad: 'Kaya', telefon: '05339876543',
                    baslangicTarihi: new Date('2024-03-01'),
                    maas: 22000, tenantId, subeId,
                }
            }),
            prisma.personel.create({
                data: {
                    ad: 'Mehmet', soyad: 'Demir', telefon: '05351112233',
                    baslangicTarihi: new Date('2023-08-10'),
                    maas: 28000, tenantId, subeId,
                }
            }),
            prisma.personel.create({
                data: {
                    ad: 'Ayşe', soyad: 'Çelik', telefon: '05364445566',
                    baslangicTarihi: new Date('2024-06-01'),
                    maas: 20000, tenantId, subeId,
                }
            }),
        ]);

        // Maaş kayıtları
        const buAy = new Date();
        for (const p of personeller) {
            await prisma.personelMaas.create({
                data: { personelId: p.id, yil: buAy.getFullYear(), ay: buAy.getMonth() + 1, tutar: p.maas, odendi: false }
            });
        }

        // Avans kaydı
        await prisma.personelAvans.create({
            data: { personelId: personeller[0].id, tutar: 3000, aciklama: 'Acil ihtiyaç avansı' }
        });
        await prisma.personelAvans.create({
            data: { personelId: personeller[2].id, tutar: 5000, aciklama: 'Kira avansı' }
        });

        // Devam kayıtları (son 7 gün)
        for (let gun = 6; gun >= 0; gun--) {
            const tarih = new Date(bugun);
            tarih.setDate(tarih.getDate() - gun);
            for (const p of personeller) {
                const durum = gun === 3 && p.id === personeller[1].id ? 'IZIN' : 'CALISTI';
                await prisma.personelDevam.create({
                    data: { personelId: p.id, tarih, durum, mesai: durum === 'CALISTI' ? 8 : null }
                });
            }
        }

        console.log(`✅ Demo verisi oluşturuldu — tenant: ${tenantId}`);
    } catch (err) {
        console.error('Demo seed hatası:', err.message);
    }
}

module.exports = { demoBilgileriOlustur };