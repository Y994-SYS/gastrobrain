const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditLog = require('./auditLog.service');

const satisService = {

    async hepsiniGetir(subeId, tarihBaslangic, tarihBitis, tenantId) {
        // subeId null ise tüm şubeler (TENANT_ADMIN), değilse o şube
        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId } }
            : { sube: { tenantId } };

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

    async gunlukToplam(subeId, tenantId) {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);

        // subeId null ise tüm şubeler
        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId }, tarih: { gte: bugun, lt: yarin } }
            : { sube: { tenantId }, tarih: { gte: bugun, lt: yarin } };

        const satislar = await prisma.satis.findMany({ where });
        return satislar.reduce((t, s) => t + s.toplam, 0);
    },

    async ekle({ receteId, subeId, adet, birimFiyat, aciklama, tarih }, tenantId) {
        const recete = await prisma.recete.findFirst({
            where: { id: Number(receteId), tenantId },
            include: {
                kalemler: { include: { stokKart: true } }
            }
        });
        if (!recete) throw new Error('Reçete bulunamadı');

        const sube = await prisma.sube.findFirst({
            where: { id: Number(subeId), tenantId }
        });
        if (!sube) throw new Error('Şube bulunamadı');

        return prisma.$transaction(async (tx) => {
            // Stok kontrolü — transaction içinde, atomik
            for (const kalem of recete.kalemler) {
                const gercekMiktar = ((kalem.miktar * kalem.carpan) / kalem.bolen) * Number(adet);

                const girisler = await tx.stokHareket.aggregate({
                    where: {
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        tip: { in: ['GIRIS_FATURA', 'AY_SONU_SAYIM', 'SUBE_TRANSFER_IN'] }
                    },
                    _sum: { miktar: true }
                });

                const cikislar = await tx.stokHareket.aggregate({
                    where: {
                        stokKartId: kalem.stokKartId,
                        subeId: Number(subeId),
                        tip: { in: ['IADE_FATURA', 'SATIS', 'ZAYI', 'TUKETIM', 'SUBE_TRANSFER_OUT'] }
                    },
                    _sum: { miktar: true }
                });

                const mevcutMiktar = (girisler._sum.miktar || 0) - (cikislar._sum.miktar || 0);

                if (mevcutMiktar < gercekMiktar) {
                    throw new Error(
                        `Yetersiz stok: ${kalem.stokKart.ad} (mevcut: ${mevcutMiktar.toFixed(2)}, gereken: ${gercekMiktar.toFixed(2)})`
                    );
                }
            }

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

    async sil(id, tenantId) {
        const satis = await prisma.satis.findFirst({
            where: { id, sube: { tenantId } }
        });
        if (!satis) throw new Error('Satış bulunamadı');
        await prisma.stokHareket.deleteMany({ where: { satisId: id } });
        return prisma.satis.delete({ where: { id } });
    }

};

module.exports = satisService;