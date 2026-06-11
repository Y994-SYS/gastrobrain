const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seed başlıyor...');

    // ─── KATEGORİLER ───────────────────────────────────────────
    const kategoriler = await Promise.all([
        prisma.kategori.upsert({ where: { ad: 'Kuru Gıda' }, update: {}, create: { ad: 'Kuru Gıda' } }),
        prisma.kategori.upsert({ where: { ad: 'Et & Tavuk' }, update: {}, create: { ad: 'Et & Tavuk' } }),
        prisma.kategori.upsert({ where: { ad: 'Sebze & Meyve' }, update: {}, create: { ad: 'Sebze & Meyve' } }),
        prisma.kategori.upsert({ where: { ad: 'Süt Ürünleri' }, update: {}, create: { ad: 'Süt Ürünleri' } }),
        prisma.kategori.upsert({ where: { ad: 'İçecek' }, update: {}, create: { ad: 'İçecek' } }),
    ]);
    console.log('✅ Kategoriler tamam');

    // ─── ÖLÇÜ BİRİMLERİ ────────────────────────────────────────
    const birimler = await Promise.all([
        prisma.olcuBirimi.upsert({ where: { ad: 'Kilogram' }, update: {}, create: { ad: 'Kilogram', kisaltma: 'kg' } }),
        prisma.olcuBirimi.upsert({ where: { ad: 'Gram' }, update: {}, create: { ad: 'Gram', kisaltma: 'gr' } }),
        prisma.olcuBirimi.upsert({ where: { ad: 'Litre' }, update: {}, create: { ad: 'Litre', kisaltma: 'lt' } }),
        prisma.olcuBirimi.upsert({ where: { ad: 'Mililitre' }, update: {}, create: { ad: 'Mililitre', kisaltma: 'ml' } }),
        prisma.olcuBirimi.upsert({ where: { ad: 'Adet' }, update: {}, create: { ad: 'Adet', kisaltma: 'ad' } }),
    ]);
    console.log('✅ Ölçü birimleri tamam');

    const katMap = Object.fromEntries(kategoriler.map(k => [k.ad, k.id]));
    const birMap = Object.fromEntries(birimler.map(b => [b.kisaltma, b.id]));

    // ─── STOK KARTLARI ─────────────────────────────────────────
    const stoklar = [
        { kod: 'STK001', ad: 'Un (Buğday)', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 50 },
        { kod: 'STK002', ad: 'Ayçiçek Yağı', kategoriId: katMap['Kuru Gıda'], birimId: birMap['lt'], minStok: 20 },
        { kod: 'STK003', ad: 'Tuz', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 10 },
        { kod: 'STK004', ad: 'Şeker', kategoriId: katMap['Kuru Gıda'], birimId: birMap['kg'], minStok: 20 },
        { kod: 'STK005', ad: 'Dana Kıyma', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 10 },
        { kod: 'STK006', ad: 'Tavuk Göğsü', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 10 },
        { kod: 'STK007', ad: 'Dana Kuşbaşı', kategoriId: katMap['Et & Tavuk'], birimId: birMap['kg'], minStok: 5 },
        { kod: 'STK008', ad: 'Domates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 15 },
        { kod: 'STK009', ad: 'Soğan', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 20 },
        { kod: 'STK010', ad: 'Patates', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 30 },
        { kod: 'STK011', ad: 'Biber (Yeşil)', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 10 },
        { kod: 'STK012', ad: 'Tereyağı', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 5 },
        { kod: 'STK013', ad: 'Tam Yağlı Süt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['lt'], minStok: 10 },
        { kod: 'STK014', ad: 'Yoğurt', kategoriId: katMap['Süt Ürünleri'], birimId: birMap['kg'], minStok: 8 },
        { kod: 'STK015', ad: 'Maden Suyu 500ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 48 },
        { kod: 'STK016', ad: 'Kola 330ml', kategoriId: katMap['İçecek'], birimId: birMap['ad'], minStok: 24 },
        { kod: 'STK017', ad: 'Limon', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 5 },
        { kod: 'STK018', ad: 'Sarımsak', kategoriId: katMap['Sebze & Meyve'], birimId: birMap['kg'], minStok: 3 },
    ];

    const stokKartlari = [];
    for (const s of stoklar) {
        const kart = await prisma.stokKart.upsert({
            where: { kod: s.kod },
            update: { ad: s.ad },
            create: s,
        });
        stokKartlari.push(kart);
    }
    console.log(`✅ ${stokKartlari.length} stok kartı tamam`);

    const stokMap = Object.fromEntries(stokKartlari.map(s => [s.ad, s.id]));

    // ─── CARİ KARTLAR ──────────────────────────────────────────
    const cariler = [
        { kod: 'CAR001', ad: 'Merkez Gıda A.Ş.', telefon: '02125550101', adres: 'İstanbul, Bağcılar' },
        { kod: 'CAR002', ad: 'Güven Et Pazarı', telefon: '02164440202', adres: 'İstanbul, Ümraniye' },
        { kod: 'CAR003', ad: 'Taze Sebze Kooperatif', telefon: '02623330303', adres: 'Kocaeli, Gebze' },
        { kod: 'CAR004', ad: 'Nur Süt Ürünleri', telefon: '02242220404', adres: 'Bursa, Nilüfer' },
        { kod: 'CAR005', ad: 'Efes İçecek Dağıtım', telefon: '02121110505', adres: 'İstanbul, Esenyurt' },
    ];

    for (const c of cariler) {
        await prisma.cariKart.upsert({
            where: { kod: c.kod },
            update: {},
            create: c,
        });
    }
    console.log('✅ Cari kartlar tamam');

    // ─── REÇETELER ─────────────────────────────────────────────
    const receteler = [
        {
            ad: 'Köfte Porsiyon',
            satisKodu: 'REC001',
            satisFiyati: 180.00,
            kalemler: [
                { stokAd: 'Dana Kıyma', miktar: 0.200 },
                { stokAd: 'Soğan', miktar: 0.050 },
                { stokAd: 'Tuz', miktar: 0.005 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.020 },
            ],
        },
        {
            ad: 'Tavuk Şiş Porsiyon',
            satisKodu: 'REC002',
            satisFiyati: 150.00,
            kalemler: [
                { stokAd: 'Tavuk Göğsü', miktar: 0.250 },
                { stokAd: 'Biber (Yeşil)', miktar: 0.050 },
                { stokAd: 'Domates', miktar: 0.050 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.015 },
                { stokAd: 'Tuz', miktar: 0.004 },
            ],
        },
        {
            ad: 'Patates Kızartması',
            satisKodu: 'REC003',
            satisFiyati: 65.00,
            kalemler: [
                { stokAd: 'Patates', miktar: 0.300 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.100 },
                { stokAd: 'Tuz', miktar: 0.003 },
            ],
        },
        {
            ad: 'Dana Güveç',
            satisKodu: 'REC004',
            satisFiyati: 280.00,
            kalemler: [
                { stokAd: 'Dana Kuşbaşı', miktar: 0.200 },
                { stokAd: 'Domates', miktar: 0.100 },
                { stokAd: 'Soğan', miktar: 0.075 },
                { stokAd: 'Biber (Yeşil)', miktar: 0.050 },
                { stokAd: 'Tereyağı', miktar: 0.020 },
                { stokAd: 'Tuz', miktar: 0.005 },
                { stokAd: 'Sarımsak', miktar: 0.010 },
            ],
        },
    ];

    for (const r of receteler) {
        const recete = await prisma.recete.upsert({
            where: { satisKodu: r.satisKodu },
            update: { satisFiyati: r.satisFiyati },
            create: {
                ad: r.ad,
                satisKodu: r.satisKodu,
                satisFiyati: r.satisFiyati,
            },
        });

        await prisma.receteKalem.deleteMany({ where: { receteId: recete.id } });
        await prisma.receteKalem.createMany({
            data: r.kalemler.map(k => ({
                receteId: recete.id,
                stokKartId: stokMap[k.stokAd],
                miktar: k.miktar,
            })),
        });
    }
    console.log(`✅ ${receteler.length} reçete tamam`);

    console.log('\n🎉 Seed tamamlandı!');
    console.log('   📦 18 stok kartı');
    console.log('   🏢 5 cari kart');
    console.log('   🍽️  4 reçete');
}

main()
    .catch(e => { console.error('❌ Hata:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());