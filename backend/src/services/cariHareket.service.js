const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cariHareketService = {

    async hareketleriGetir(cariKartId, tenantId) {
        // Önce cari kartın bu tenant'a ait olduğunu doğrula
        const cariKart = await prisma.cariKart.findFirst({
            where: { id: Number(cariKartId), tenantId }
        });
        if (!cariKart) throw new Error('Cari kart bulunamadı');

        return prisma.cariHareket.findMany({
            where: { cariKartId: Number(cariKartId) },
            orderBy: { tarih: 'desc' }
        });
    },

    async bakiyeGetir(cariKartId, tenantId) {
        const cariKart = await prisma.cariKart.findFirst({
            where: { id: Number(cariKartId), tenantId }
        });
        if (!cariKart) throw new Error('Cari kart bulunamadı');

        const hareketler = await prisma.cariHareket.findMany({
            where: { cariKartId: Number(cariKartId) }
        });
        return hareketler.reduce((toplam, h) => {
            if (h.tip === 'BORC') return toplam + h.tutar;
            if (h.tip === 'ALACAK' || h.tip === 'ODEME') return toplam - h.tutar;
            return toplam;
        }, 0);
    },

    async tumCarilerinBakiyeleriGetir(tenantId) {
        const cariKartlar = await prisma.cariKart.findMany({
            where: { aktif: true, tenantId },
            orderBy: { ad: 'asc' }
        });
        const sonuc = await Promise.all(
            cariKartlar.map(async (kart) => {
                const bakiye = await this.bakiyeGetir(kart.id, tenantId);
                return { ...kart, bakiye };
            })
        );
        return sonuc;
    },

    async odemeEkle({ cariKartId, tutar, aciklama, belgeNo, tarih }, tenantId) {
        const cariKart = await prisma.cariKart.findFirst({
            where: { id: Number(cariKartId), tenantId }
        });
        if (!cariKart) throw new Error('Cari kart bulunamadı');

        return prisma.cariHareket.create({
            data: {
                tip: 'ODEME',
                tutar: Number(tutar),
                aciklama,
                belgeNo,
                tarih: tarih ? new Date(tarih) : new Date(),
                cariKartId: Number(cariKartId),
            }
        });
    },

    async manuelHareketEkle({ cariKartId, tip, tutar, aciklama, belgeNo, tarih }, tenantId) {
        const cariKart = await prisma.cariKart.findFirst({
            where: { id: Number(cariKartId), tenantId }
        });
        if (!cariKart) throw new Error('Cari kart bulunamadı');

        return prisma.cariHareket.create({
            data: {
                tip,
                tutar: Number(tutar),
                aciklama,
                belgeNo,
                tarih: tarih ? new Date(tarih) : new Date(),
                cariKartId: Number(cariKartId),
            }
        });
    }

};

module.exports = cariHareketService;