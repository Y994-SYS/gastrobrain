const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const satisService = {

    async hepsiniGetir(subeId, tarihBaslangic, tarihBitis) {
        const where = { subeId: Number(subeId) };
        if (tarihBaslangic && tarihBitis) {
            where.tarih = {
                gte: new Date(tarihBaslangic),
                lte: new Date(tarihBitis)
            };
        }
        return prisma.satis.findMany({
            where,
            include: { recete: true, sube: true },
            orderBy: { tarih: 'desc' }
        });
    },

    async gunlukToplam(subeId) {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);

        const satislar = await prisma.satis.findMany({
            where: {
                subeId: Number(subeId),
                tarih: { gte: bugun, lt: yarin }
            }
        });
        return satislar.reduce((t, s) => t + s.toplam, 0);
    },

    async ekle({ receteId, subeId, adet, birimFiyat, aciklama, tarih }) {
        const recete = await prisma.recete.findUnique({
            where: { id: Number(receteId) },
            include: {
                kalemler: { include: { stokKart: true } }
            }
        });
        if (!recete) throw new Error('Reçete bulunamadı');

        return prisma.$transaction(async (tx) => {
            const satis = await tx.satis.create({
                data: {
                    receteId: Number(receteId),
                    subeId: Number(subeId),
                    adet: Number(adet),
                    birimFiyat: Number(birimFiyat),
                    toplam: Number(adet) * Number(birimFiyat),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                }
            });

            // Reçete kalemlerine göre stok düş
            for (const kalem of recete.kalemler) {
                const gercekMiktar = ((kalem.miktar * kalem.carpan) / kalem.bolen) * Number(adet);
                await tx.stokHareket.create({
                    data: {
                        tip: 'SATIS',
                        miktar: gercekMiktar,
                        aciklama: `Satış — ${recete.ad} x${adet}`,
                        tarih: tarih ? new Date(tarih) : new Date(),
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        satisId: satis.id,
                    }
                });
            }

            return satis;
        });
    },

    async sil(id) {
        const satis = await prisma.satis.findUnique({ where: { id } });
        if (!satis) throw new Error('Satış bulunamadı');
        await prisma.stokHareket.deleteMany({ where: { satisId: id } });
        return prisma.satis.delete({ where: { id } });
    }

};

module.exports = satisService;