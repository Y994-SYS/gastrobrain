const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDOR koruması: kalemler[].stokKartId listesindeki her ID'nin gerçekten
// istek sahibinin tenant'ına ait olduğunu doğrular. Aksi halde biri başka
// bir tenant'ın stokKartId'sini vererek reçeteyi yabancı bir stok kartına
// bağlayabilir (maliyet hesaplama / include üzerinden veri sızıntısı riski).
async function kalemleriDogrula(kalemler, tenantId) {
    const idListesi = [...new Set(kalemler.map(k => Number(k.stokKartId)))];

    const bulunanlar = await prisma.stokKart.findMany({
        where: { id: { in: idListesi }, tenantId },
        select: { id: true }
    });

    if (bulunanlar.length !== idListesi.length) {
        const bulunanIdSeti = new Set(bulunanlar.map(b => b.id));
        const eksikler = idListesi.filter(id => !bulunanIdSeti.has(id));
        throw new Error(
            `Geçersiz stok kartı ID(leri): ${eksikler.join(', ')} — bulunamadı veya erişim yetkiniz yok`
        );
    }
}

// IDOR koruması + tip kontrolü: kategoriId hem istek sahibinin tenant'ına ait
// olmalı hem de tip='RECETE' olmalı — aksi halde biri başka bir tenant'ın
// kategorisini ya da bir STOK kategorisini (ör. "Et & Tavuk") reçeteye
// bağlayabilirdi. Boş/null gönderilirse (kategorisiz reçete) doğrulama
// atlanır ve null döner.
async function kategoriDogrula(kategoriId, tenantId) {
    if (kategoriId === undefined || kategoriId === null || kategoriId === '') return null;

    const kategori = await prisma.kategori.findFirst({
        where: { id: Number(kategoriId), tenantId, tip: 'RECETE' },
        select: { id: true }
    });

    if (!kategori) {
        throw new Error('Geçersiz kategori: bulunamadı, erişim yetkiniz yok veya bir reçete kategorisi değil');
    }
    return kategori.id;
}

const receteIncludeOrtak = {
    kategori: true,
    kalemler: {
        include: { stokKart: { include: { birim: true } } }
    }
};

const receteService = {

    async hepsiniGetir(tenantId) {
        return prisma.recete.findMany({
            where: { tenantId },
            include: receteIncludeOrtak,
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const recete = await prisma.recete.findFirst({
            where: { id, tenantId },
            include: receteIncludeOrtak
        });
        if (!recete) throw new Error('Reçete bulunamadı');
        return recete;
    },

    async maliyetHesapla(receteId, tenantId) {
        const recete = await this.biriniGetir(receteId, tenantId);
        const kalemMaliyetleri = await Promise.all(
            recete.kalemler.map(async (kalem) => {
                const sonHareket = await prisma.stokHareket.findFirst({
                    where: {
                        stokKartId: kalem.stokKartId,
                        tip: 'GIRIS_FATURA',
                        birimFiyat: { not: null },
                        stokKart: { tenantId }
                    },
                    orderBy: { tarih: 'desc' }
                });
                const birimFiyat = sonHareket?.birimFiyat || 0;
                const gercekMiktar = (kalem.miktar * kalem.carpan) / kalem.bolen;
                return {
                    stokAd: kalem.stokKart.ad,
                    miktar: gercekMiktar,
                    birim: kalem.stokKart.birim?.kisaltma,
                    birimFiyat,
                    toplam: gercekMiktar * birimFiyat
                };
            })
        );
        const toplamMaliyet = kalemMaliyetleri.reduce((t, k) => t + k.toplam, 0);

        // Porsiyon maliyeti varsa hesapla
        const porsiyonMaliyeti = recete.porsiyonSayisi
            ? toplamMaliyet / recete.porsiyonSayisi
            : null;

        return { recete, kalemMaliyetleri, toplamMaliyet, porsiyonMaliyeti };
    },

    async olustur({ ad, aciklama, satisKodu, satisFiyati, porsiyonSayisi, kategoriId, kalemler }, tenantId) {
        await kalemleriDogrula(kalemler, tenantId);
        const dogrulanmisKategoriId = await kategoriDogrula(kategoriId, tenantId);

        return prisma.recete.create({
            data: {
                ad, aciklama, satisKodu,
                satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                porsiyonSayisi: porsiyonSayisi ? Number(porsiyonSayisi) : null,
                kategoriId: dogrulanmisKategoriId,
                tenantId,
                kalemler: {
                    create: kalemler.map(k => ({
                        stokKartId: Number(k.stokKartId),
                        miktar: Number(k.miktar),
                        carpan: Number(k.carpan || 1),
                        bolen: Number(k.bolen || 1),
                        stokTakipZorunlu: k.stokTakipZorunlu === false ? false : true,
                    }))
                }
            },
            include: receteIncludeOrtak
        });
    },

    async guncelle(id, { ad, aciklama, satisKodu, satisFiyati, porsiyonSayisi, kategoriId, kalemler }, tenantId) {
        await this.biriniGetir(id, tenantId);
        await kalemleriDogrula(kalemler, tenantId);
        const dogrulanmisKategoriId = await kategoriDogrula(kategoriId, tenantId);

        // Kalem silme + yeniden oluşturma tek bir $transaction içinde yapılıyor.
        // Öncesinde: bu iki işlem ayrı adımlardı; aralarında hata olursa
        // (ör. DB bağlantı kopması) reçete kalemsiz kalabiliyordu.
        // $transaction ile ya ikisi de başarılı olur ya da hiçbiri uygulanmaz.
        return prisma.$transaction(async (tx) => {
            await tx.receteKalem.deleteMany({ where: { receteId: id } });
            return tx.recete.update({
                where: { id },
                data: {
                    ad, aciklama, satisKodu,
                    satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                    porsiyonSayisi: porsiyonSayisi ? Number(porsiyonSayisi) : null,
                    kategoriId: dogrulanmisKategoriId,
                    kalemler: {
                        create: kalemler.map(k => ({
                            stokKartId: Number(k.stokKartId),
                            miktar: Number(k.miktar),
                            carpan: Number(k.carpan || 1),
                            bolen: Number(k.bolen || 1),
                            stokTakipZorunlu: k.stokTakipZorunlu === false ? false : true,
                        }))
                    }
                },
                include: receteIncludeOrtak
            });
        });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        await prisma.receteKalem.deleteMany({ where: { receteId: id } });
        return prisma.recete.delete({ where: { id } });
    }

};

module.exports = receteService;