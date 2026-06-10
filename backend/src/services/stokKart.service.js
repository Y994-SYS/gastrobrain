const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stokKartService = {

    async hepsiniGetir() {
        return prisma.stokKart.findMany({
            include: { kategori: true, birim: true },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id) {
        const stokKart = await prisma.stokKart.findUnique({
            where: { id },
            include: { kategori: true, birim: true }
        });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');
        return stokKart;
    },

    async olustur(data) {
        return prisma.stokKart.create({
            data,
            include: { kategori: true, birim: true }
        });
    },

    async guncelle(id, data) {
        await this.biriniGetir(id);
        return prisma.stokKart.update({
            where: { id },
            data,
            include: { kategori: true, birim: true }
        });
    },

    async sil(id) {
        await this.biriniGetir(id);
        return prisma.stokKart.delete({ where: { id } });
    }

};

module.exports = stokKartService;