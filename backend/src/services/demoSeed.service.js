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

        // ─── STOK KARTLARI ──────────────────────────────────────
        // baslangicOrani: min. stok seviyesine göre ilk giriş faturası
        // miktarının oranı. Çoğu ürün min'in üstünde (Normal/yeşil),
        // birkaçı bilinçli olarak min'in altında (Kritik/kırmızı)
        // bırakıldı — böylece yeni kullanıcı ilk girişte hem dolu hem
        // gerçekçi/çeşitli bir stok tablosu görüyor, renk kodlamasının
        // (lime=normal, red=kritik) ne işe yaradığını da örnekten anlıyor.
        const stoklar = [
            { kod: 'STK001', ad: 'Dana Kıyma', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 10, baslangicOrani: 1.8 },
            { kod: 'STK002', ad: 'Tavuk Göğsü', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 8, baslangicOrani: 1.6 },
            { kod: 'STK003', ad: 'Dana Kuşbaşı', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 5, baslangicOrani: 0.6 }, // kritik örneği
            { kod: 'STK004', ad: 'Domates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 15, baslangicOrani: 1.7 },
            { kod: 'STK005', ad: 'Soğan', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 20, baslangicOrani: 1.5 },
            { kod: 'STK006', ad: 'Patates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 25, baslangicOrani: 1.4 },
            { kod: 'STK007', ad: 'Biber', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 8, baslangicOrani: 1.6 },
            { kod: 'STK008', ad: 'Un', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 30, baslangicOrani: 1.3 },
            { kod: 'STK009', ad: 'Ayçiçek Yağı', kategoriId: katMap['Kuru Gıda'], birimId: birMap['lt'], minStok: 10, baslangicOrani: 1.5 },
            { kod: 'STK010', ad: 'Tuz', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 5, baslangicOrani: 2.0 },
            { kod: 'STK011', ad: 'Şeker', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 5, baslangicOrani: 2.0 },
            { kod: 'STK012', ad: 'Tereyağı', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 3, baslangicOrani: 0.5 }, // kritik örneği
            { kod: 'STK013', ad: 'Yoğurt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 5, baslangicOrani: 1.4 },
            { kod: 'STK014', ad: 'Tam Yağlı Süt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['lt'], minStok: 8, baslangicOrani: 1.5 },
            { kod: 'STK015', ad: 'Maden Suyu 500ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 48, baslangicOrani: 1.5 },
            { kod: 'STK016', ad: 'Kola 330ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 24, baslangicOrani: 1.5 },
            { kod: 'STK017', ad: 'Ayran 200ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 36, baslangicOrani: 0.7 }, // kritik örneği
            { kod: 'STK018', ad: 'Sarımsak', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 3, baslangicOrani: 1.7 },
        ];

        const stokKartlari = await Promise.all(
            stoklar.map(s => prisma.stokKart.create({
                data: {
                    kod: s.kod, ad: s.ad, kategoriId: s.kategoriId, birimId: s.birimId, minStok: s.minStok,
                    tenantId
                }
            }))
        );
        const stokMap = Object.fromEntries(stokKartlari.map(s => [s.ad, s.id]));

        // ─── BAŞLANGIÇ STOK HAREKETLERİ (Giriş Faturası) ───────
        // subeId verilmişse o şubeye, verilmemişse hareket oluşturulmaz
        // (tenant kaydında henüz bir şube yoksa hata almamak için).
        if (subeId) {
            await Promise.all(
                stoklar.map(s => {
                    const miktar = Math.round(s.minStok * s.baslangicOrani * 100) / 100;
                    return prisma.stokHareket.create({
                        data: {
                            tip: 'GIRIS_FATURA',
                            miktar,
                            birimFiyat: 0,
                            aciklama: 'Başlangıç stok girişi (örnek veri)',
                            tarih: new Date(),
                            stokKartId: stokMap[s.ad],
                            subeId,
                        }
                    });
                })
            );
        }

        // ─── REÇETELER (örnek — kullanıcı düzenleyebilir) ──────
        const receteListesi = [
            {
                ad: 'Köfte Porsiyon', satisKodu: 'REC001', satisFiyati: 0,
                kalemler: [
                    { stokAd: 'Dana Kıyma', miktar: 0.200 },
                    { stokAd: 'Soğan', miktar: 0.050 },
                    { stokAd: 'Tuz', miktar: 0.005 },
                ],
            },
            {
                ad: 'Tavuk Şiş', satisKodu: 'REC002', satisFiyati: 0,
                kalemler: [
                    { stokAd: 'Tavuk Göğsü', miktar: 0.250 },
                    { stokAd: 'Biber', miktar: 0.050 },
                    { stokAd: 'Ayçiçek Yağı', miktar: 0.020 },
                    { stokAd: 'Tuz', miktar: 0.004 },
                ],
            },
            {
                ad: 'Patates Kızartması', satisKodu: 'REC003', satisFiyati: 0,
                kalemler: [
                    { stokAd: 'Patates', miktar: 0.300 },
                    { stokAd: 'Ayçiçek Yağı', miktar: 0.100 },
                    { stokAd: 'Tuz', miktar: 0.003 },
                ],
            },
            {
                ad: 'Dana Güveç', satisKodu: 'REC004', satisFiyati: 0,
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
        }

        console.log(`✅ Başlangıç tanımlamaları oluşturuldu — tenant: ${tenantId}`);
    } catch (err) {
        console.error('Demo seed hatası:', err.message);
    }
}

module.exports = { demoBilgileriOlustur };