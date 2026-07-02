const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditLog = require('./auditLog.service');

// Stok yetersizliğini bilerek geçebilecek roller
const ZORLA_IZINLI_ROLLER = ['TENANT_ADMIN', 'ADMIN', 'MUDUR'];

const satisService = {

    async hepsiniGetir(subeId, tarihBaslangic, tarihBitis, tenantId) {
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

        const where = subeId
            ? { subeId: Number(subeId), sube: { tenantId }, tarih: { gte: bugun, lt: yarin } }
            : { sube: { tenantId }, tarih: { gte: bugun, lt: yarin } };

        const satislar = await prisma.satis.findMany({ where });
        return satislar.reduce((t, s) => t + s.toplam, 0);
    },

    /**
     * @param {object} data - receteId, subeId, adet, birimFiyat, aciklama, tarih
     * @param {number} tenantId
     * @param {object} opts - { zorla: boolean, rol: string }
     *   zorla: true ise ve rol yetkiliyse, yetersiz stok satışı engellemez.
     */
    async ekle({ receteId, subeId, adet, birimFiyat, aciklama, tarih }, tenantId, opts = {}) {
        const { zorla = false, rol = null } = opts;
        // zorla=true isteği ROL kontrolünden geçmiyorsa görmezden gelinir —
        // frontend'den gelen bayrağa asla körü körüne güvenilmez.
        const zorlamaYetkisiVar = zorla && ZORLA_IZINLI_ROLLER.includes(rol);

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

        const eksikKalemler = [];

        return prisma.$transaction(async (tx) => {
            for (const kalem of recete.kalemler) {
                if (kalem.stokTakipZorunlu === false) continue;

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
                    if (zorlamaYetkisiVar) {
                        eksikKalemler.push({
                            ad: kalem.stokKart.ad,
                            mevcut: mevcutMiktar,
                            gereken: gercekMiktar
                        });
                        continue;
                    }
                    throw new Error(
                        `Yetersiz stok: ${kalem.stokKart.ad} (mevcut: ${mevcutMiktar.toFixed(2)}, gereken: ${gercekMiktar.toFixed(2)})`
                    );
                }
            }

            const zorlamaNotu = eksikKalemler.length
                ? ` [ZORLA KAYDEDİLDİ — yetersiz: ${eksikKalemler.map(k => k.ad).join(', ')}]`
                : '';

            const satis = await tx.satis.create({
                data: {
                    receteId: Number(receteId),
                    subeId: Number(subeId),
                    adet: Number(adet),
                    birimFiyat: Number(birimFiyat),
                    toplam: Number(adet) * Number(birimFiyat),
                    aciklama: (aciklama || '') + zorlamaNotu,
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

            return { satis, zorlandi: eksikKalemler.length > 0, eksikKalemler };
        });
    },

    async sil(id, tenantId) {
        const satis = await prisma.satis.findFirst({
            where: { id, sube: { tenantId } }
        });
        if (!satis) throw new Error('Satış bulunamadı');
        // Not: stokHareket kayıtları silinir — bu, satışla düşülen stoğu
        // fiilen geri yükler. Frontend uyarı metni buna göre yazıldı.
        await prisma.stokHareket.deleteMany({ where: { satisId: id } });
        return prisma.satis.delete({ where: { id } });
    }

};

module.exports = satisService;