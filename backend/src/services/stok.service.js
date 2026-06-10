const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stokService = {

    async hareketleriGetir(stokKartId) {
        return prisma.stokHareket.findMany({
            where: stokKartId ? { stokKartId: Number(stokKartId) } : {},
            include: { stokKart: { include: { birim: true } }, sube: true },
            orderBy: { tarih: 'desc' },
            take: 100
        });
    },

    async mevcutStokGetir(stokKartId, subeId) {
        const hareketler = await prisma.stokHareket.findMany({
            where: {
                stokKartId: Number(stokKartId),
                subeId: Number(subeId)
            }
        });
        return hareketler.reduce((toplam, h) => {
            const girisler = ['GIRIS_FATURA', 'AY_SONU_SAYIM', 'SUBE_TRANSFER_IN'];
            const cikislar = ['IADE_FATURA', 'SATIS', 'ZAYI', 'TUKETIM', 'SUBE_TRANSFER_OUT'];
            if (girisler.includes(h.tip)) return toplam + h.miktar;
            if (cikislar.includes(h.tip)) return toplam - h.miktar;
            return toplam;
        }, 0);
    },

    async tumStokDurumu(subeId) {
        const stokKartlari = await prisma.stokKart.findMany({
            include: { birim: true, kategori: true }
        });
        const sonuc = await Promise.all(
            stokKartlari.map(async (kart) => {
                const miktar = await this.mevcutStokGetir(kart.id, subeId);
                return { ...kart, mevcutStok: miktar, kritik: miktar <= kart.minStok };
            })
        );
        return sonuc;
    },

    async girisFaturasiEkle({ stokKartId, subeId, miktar, birimFiyat, aciklama, tarih, cariKartId }) {
        return prisma.$transaction(async (tx) => {
            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'GIRIS_FATURA',
                    miktar: Number(miktar),
                    birimFiyat: Number(birimFiyat),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: Number(subeId),
                }
            });

            if (cariKartId) {
                await tx.cariHareket.create({
                    data: {
                        tip: 'BORC',
                        tutar: Number(miktar) * Number(birimFiyat),
                        aciklama: aciklama || 'Giriş faturası',
                        tarih: tarih ? new Date(tarih) : new Date(),
                        cariKartId: Number(cariKartId),
                    }
                });
            }

            return hareket;
        });
    },

    async iadeFaturasiEkle({ stokKartId, subeId, miktar, birimFiyat, aciklama, tarih, cariKartId }) {
        return prisma.$transaction(async (tx) => {
            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'IADE_FATURA',
                    miktar: Number(miktar),
                    birimFiyat: Number(birimFiyat),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: Number(subeId),
                }
            });

            if (cariKartId) {
                await tx.cariHareket.create({
                    data: {
                        tip: 'ALACAK',
                        tutar: Number(miktar) * Number(birimFiyat),
                        aciklama: aciklama || 'İade faturası',
                        tarih: tarih ? new Date(tarih) : new Date(),
                        cariKartId: Number(cariKartId),
                    }
                });
            }

            return hareket;
        });
    },

    async zayiEkle({ stokKartId, subeId, miktar, aciklama, tarih }) {
        return prisma.stokHareket.create({
            data: {
                tip: 'ZAYI',
                miktar: Number(miktar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
                stokKartId: Number(stokKartId),
                subeId: Number(subeId),
            }
        });
    },

    async tuketimEkle({ stokKartId, subeId, miktar, aciklama, tarih }) {
        return prisma.stokHareket.create({
            data: {
                tip: 'TUKETIM',
                miktar: Number(miktar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
                stokKartId: Number(stokKartId),
                subeId: Number(subeId),
            }
        });
    },

    async aySonuSayimEkle({ stokKartId, subeId, sayimMiktari, aciklama }) {
        return prisma.$transaction(async (tx) => {
            const mevcutStok = await this.mevcutStokGetir(stokKartId, subeId);
            const fark = Number(sayimMiktari) - mevcutStok;

            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'AY_SONU_SAYIM',
                    miktar: Math.abs(fark),
                    aciklama: aciklama || `Ay sonu sayım — fark: ${fark > 0 ? '+' : ''}${fark.toFixed(2)}`,
                    stokKartId: Number(stokKartId),
                    subeId: Number(subeId),
                }
            });

            return { hareket, mevcutStok, sayimMiktari: Number(sayimMiktari), fark };
        });
    }

};

module.exports = stokService;