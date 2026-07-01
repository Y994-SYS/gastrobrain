const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const receteService = {

    async hepsiniGetir(tenantId) {
        return prisma.recete.findMany({
            where: { tenantId },
            include: {
                kalemler: {
                    include: { stokKart: { include: { birim: true } } }
                }
            },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const recete = await prisma.recete.findFirst({
            where: { id, tenantId },
            include: {
                kalemler: {
                    include: { stokKart: { include: { birim: true } } }
                }
            }
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

    async olustur({ ad, aciklama, satisKodu, satisFiyati, porsiyonSayisi, kalemler }, tenantId) {
        return prisma.recete.create({
            data: {
                ad, aciklama, satisKodu,
                satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                porsiyonSayisi: porsiyonSayisi ? Number(porsiyonSayisi) : null,
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
            include: {
                kalemler: { include: { stokKart: { include: { birim: true } } } }
            }
        });
    },

    async guncelle(id, { ad, aciklama, satisKodu, satisFiyati, porsiyonSayisi, kalemler }, tenantId) {
        await this.biriniGetir(id, tenantId);
        await prisma.receteKalem.deleteMany({ where: { receteId: id } });
        return prisma.recete.update({
            where: { id },
            data: {
                ad, aciklama, satisKodu,
                satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                porsiyonSayisi: porsiyonSayisi ? Number(porsiyonSayisi) : null,
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
            include: {
                kalemler: { include: { stokKart: { include: { birim: true } } } }
            }
        });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        await prisma.receteKalem.deleteMany({ where: { receteId: id } });
        return prisma.recete.delete({ where: { id } });
    }

};

module.exports = receteService;