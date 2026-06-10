const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cariKartService = {

    async hepsiniGetir() {
        return prisma.cariKart.findMany({ orderBy: { ad: 'asc' } });
    },

    async biriniGetir(id) {
        const cariKart = await prisma.cariKart.findUnique({
            where: { id },
            include: {
                hareketler: {
                    orderBy: { tarih: 'desc' },
                    take: 10
                }
            }
        });
        if (!cariKart) throw new Error('Cari kart bulunamadı');
        return cariKart;
    },

    async olustur(data) {
        return prisma.cariKart.create({ data });
    },

    async guncelle(id, data) {
        await this.biriniGetir(id);
        return prisma.cariKart.update({ where: { id }, data });
    },

    async sil(id) {
        await this.biriniGetir(id);
        return prisma.cariKart.delete({ where: { id } });
    },

    async bakiyeGetir(id) {
        const hareketler = await prisma.cariHareket.findMany({
            where: { cariKartId: id }
        });
        const bakiye = hareketler.reduce((toplam, h) => {
            if (h.tip === 'BORC') return toplam + h.tutar;
            if (h.tip === 'ALACAK' || h.tip === 'ODEME') return toplam - h.tutar;
            return toplam;
        }, 0);
        return bakiye;
    }

};

module.exports = cariKartService;