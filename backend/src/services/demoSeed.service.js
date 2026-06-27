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

        // ─── STOK KARTLARI (sıfır bakiye — hareket yok) ────────
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