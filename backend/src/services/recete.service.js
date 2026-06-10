const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const receteService = {

    async hepsiniGetir() {
        return prisma.recete.findMany({
            include: {
                kalemler: {
                    include: { stokKart: { include: { birim: true } } }
                }
            },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id) {
        const recete = await prisma.recete.findUnique({
            where: { id },
            include: {
                kalemler: {
                    include: { stokKart: { include: { birim: true } } }
                }
            }
        });
        if (!recete) throw new Error('Reçete bulunamadı');
        return recete;
    },

    async maliyetHesapla(receteId, subeId = 1) {
        const recete = await this.biriniGetir(receteId);
        const kalemMaliyetleri = await Promise.all(
            recete.kalemler.map(async (kalem) => {
                const sonHareket = await prisma.stokHareket.findFirst({
                    where: {
                        stokKartId: kalem.stokKartId,
                        tip: 'GIRIS_FATURA',
                        birimFiyat: { not: null }
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
        return { recete, kalemMaliyetleri, toplamMaliyet };
    },

    async olustur({ ad, aciklama, satisKodu, satisFiyati, kalemler }) {
        return prisma.recete.create({
            data: {
                ad, aciklama, satisKodu, satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                kalemler: {
                    create: kalemler.map(k => ({
                        stokKartId: Number(k.stokKartId),
                        miktar: Number(k.miktar),
                        carpan: Number(k.carpan || 1),
                        bolen: Number(k.bolen || 1),
                    }))
                }
            },
            include: {
                kalemler: { include: { stokKart: { include: { birim: true } } } }
            }
        });
    },

    async guncelle(id, { ad, aciklama, satisKodu, satisFiyati, kalemler }) {
        await this.biriniGetir(id);
        await prisma.receteKalem.deleteMany({ where: { receteId: id } });
        return prisma.recete.update({
            where: { id },
            data: {
                ad, aciklama, satisKodu, satisFiyati: satisFiyati ? Number(satisFiyati) : null,
                kalemler: {
                    create: kalemler.map(k => ({
                        stokKartId: Number(k.stokKartId),
                        miktar: Number(k.miktar),
                        carpan: Number(k.carpan || 1),
                        bolen: Number(k.bolen || 1),
                    }))
                }
            },
            include: {
                kalemler: { include: { stokKart: { include: { birim: true } } } }
            }
        });
    },

    async sil(id) {
        await this.biriniGetir(id);
        await prisma.receteKalem.deleteMany({ where: { receteId: id } });
        return prisma.recete.delete({ where: { id } });
    }

};

module.exports = receteService;