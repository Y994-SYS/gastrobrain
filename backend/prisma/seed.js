const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seed başlıyor...');

    // ─── TENANT ────────────────────────────────────────────────
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'merkez-restoran' },
        update: {},
        create: {
            ad: 'Merkez Restoran',
            slug: 'merkez-restoran',
            email: 'info@merkezrestoran.com',
            telefon: '02121234567',
            plan: 'PROFESYONEL',
        },
    });
    console.log(`✅ Tenant: ${tenant.ad} (id:${tenant.id})`);

    // ─── ŞUBE ──────────────────────────────────────────────────
    const sube = await prisma.sube.upsert({
        where: { id: 1 },
        update: {},
        create: {
            ad: 'Merkez Şube',
            adres: 'İstanbul, Kadıköy',
            telefon: '02161234567',
            tenantId: tenant.id,
        },
    });
    console.log(`✅ Şube: ${sube.ad} (id:${sube.id})`);

    // ─── KULLANICILAR ──────────────────────────────────────────
    const adminSifre = await bcrypt.hash('123456', 10);

    await prisma.kullanici.upsert({
        where: { email_tenantId: { email: 'admin@gastrobrain.com', tenantId: tenant.id } },
        update: {},
        create: {
            ad: 'Admin Kullanıcı',
            email: 'admin@gastrobrain.com',
            sifre: adminSifre,
            rol: 'TENANT_ADMIN',
            tenantId: tenant.id,
            subeId: sube.id,
        },
    });

    await prisma.kullanici.upsert({
        where: { email_tenantId: { email: 'test@gastrobrain.com', tenantId: tenant.id } },
        update: {},
        create: {
            ad: 'Test Kullanıcı',
            email: 'test@gastrobrain.com',
            sifre: adminSifre,
            rol: 'MUDUR',
            tenantId: tenant.id,
            subeId: sube.id,
        },
    });
    console.log('✅ Kullanıcılar tamam (şifre: 123456)');

    // ─── KATEGORİLER ───────────────────────────────────────────
    const kategoriListesi = [
        { ad: 'Kuru Gıda' },
        { ad: 'Et & Tavuk' },
        { ad: 'Sebze & Meyve' },
        { ad: 'Süt Ürünleri' },
        { ad: 'İçecek' },
    ];

    const kategoriler = [];
    for (const k of kategoriListesi) {
        const kat = await prisma.kategori.upsert({
            where: { ad_tenantId: { ad: k.ad, tenantId: tenant.id } },
            update: {},
            create: { ad: k.ad, tenantId: tenant.id },
        });
        kategoriler.push(kat);
    }
    console.log('✅ Kategoriler tamam');

    // ─── ÖLÇÜ BİRİMLERİ ────────────────────────────────────────
    const birimListesi = [
        { ad: 'Kilogram', kisaltma: 'kg' },
        { ad: 'Gram', kisaltma: 'gr' },
        { ad: 'Litre', kisaltma: 'lt' },
        { ad: 'Mililitre', kisaltma: 'ml' },
        { ad: 'Adet', kisaltma: 'ad' },
    ];

    const birimler = [];
    for (const b of birimListesi) {
        const birim = await prisma.olcuBirimi.upsert({
            where: { ad_tenantId: { ad: b.ad, tenantId: tenant.id } },
            update: {},
            create: { ad: b.ad, kisaltma: b.kisaltma, tenantId: tenant.id },
        });
        birimler.push(birim);
    }
    console.log('✅ Ölçü birimleri tamam');

    const katMap = Object.fromEntries(kategoriler.map(k => [k.ad, k.id]));
    const birMap = Object.fromEntries(birimler.map(b => [b.kisaltma, b.id]));

    // ─── STOK KARTLARI ─────────────────────────────────────────
    const stokListesi = [
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
    for (const s of stokListesi) {
        const kart = await prisma.stokKart.upsert({
            where: { kod_tenantId: { kod: s.kod, tenantId: tenant.id } },
            update: { ad: s.ad },
            create: { ...s, tenantId: tenant.id },
        });
        stokKartlari.push(kart);
    }
    console.log(`✅ ${stokKartlari.length} stok kartı tamam`);

    const stokMap = Object.fromEntries(stokKartlari.map(s => [s.ad, s.id]));

    // ─── CARİ KARTLAR ──────────────────────────────────────────
    const cariListesi = [
        { kod: 'CAR001', ad: 'Merkez Gıda A.Ş.', telefon: '02125550101', adres: 'İstanbul, Bağcılar' },
        { kod: 'CAR002', ad: 'Güven Et Pazarı', telefon: '02164440202', adres: 'İstanbul, Ümraniye' },
        { kod: 'CAR003', ad: 'Taze Sebze Kooperatif', telefon: '02623330303', adres: 'Kocaeli, Gebze' },
        { kod: 'CAR004', ad: 'Nur Süt Ürünleri', telefon: '02242220404', adres: 'Bursa, Nilüfer' },
        { kod: 'CAR005', ad: 'Uludag İçecek Dağıtım', telefon: '02121110505', adres: 'İstanbul, Esenyurt' },
    ];

    for (const c of cariListesi) {
        await prisma.cariKart.upsert({
            where: { kod_tenantId: { kod: c.kod, tenantId: tenant.id } },
            update: {},
            create: { ...c, tenantId: tenant.id },
        });
    }
    console.log('✅ Cari kartlar tamam');

    // ─── REÇETELER ─────────────────────────────────────────────
    const receteListesi = [
        {
            ad: 'Köfte Porsiyon', satisKodu: 'REC001', satisFiyati: 180.00,
            kalemler: [
                { stokAd: 'Dana Kıyma', miktar: 0.200 },
                { stokAd: 'Soğan', miktar: 0.050 },
                { stokAd: 'Tuz', miktar: 0.005 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.020 },
            ],
        },
        {
            ad: 'Tavuk Şiş Porsiyon', satisKodu: 'REC002', satisFiyati: 150.00,
            kalemler: [
                { stokAd: 'Tavuk Göğsü', miktar: 0.250 },
                { stokAd: 'Biber (Yeşil)', miktar: 0.050 },
                { stokAd: 'Domates', miktar: 0.050 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.015 },
                { stokAd: 'Tuz', miktar: 0.004 },
            ],
        },
        {
            ad: 'Patates Kızartması', satisKodu: 'REC003', satisFiyati: 65.00,
            kalemler: [
                { stokAd: 'Patates', miktar: 0.300 },
                { stokAd: 'Ayçiçek Yağı', miktar: 0.100 },
                { stokAd: 'Tuz', miktar: 0.003 },
            ],
        },
        {
            ad: 'Dana Güveç', satisKodu: 'REC004', satisFiyati: 280.00,
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

    for (const r of receteListesi) {
        const recete = await prisma.recete.upsert({
            where: { satisKodu_tenantId: { satisKodu: r.satisKodu, tenantId: tenant.id } },
            update: { satisFiyati: r.satisFiyati },
            create: {
                ad: r.ad,
                satisKodu: r.satisKodu,
                satisFiyati: r.satisFiyati,
                tenantId: tenant.id,
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
    console.log(`✅ ${receteListesi.length} reçete tamam`);

    console.log('\n🎉 Seed tamamlandı!');
    console.log(`   🏢 Tenant: ${tenant.ad} (id:${tenant.id})`);
    console.log('   🏪 1 şube');
    console.log('   👤 2 kullanıcı (admin@gastroiq.com / test@gastroiq.com, şifre: 123456)');
    console.log('   📦 18 stok kartı');
    console.log('   🤝 5 cari kart');
    console.log('   🍽️  4 reçete');
}

main()
    .catch(e => { console.error('❌ Hata:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());