const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const kategoriService = {

    async hepsiniGetir() {
        return prisma.kategori.findMany({ orderBy: { ad: 'asc' } });
    },

    async biriniGetir(id) {
        const kategori = await prisma.kategori.findUnique({ where: { id } });
        if (!kategori) throw new Error('Kategori bulunamadı');
        return kategori;
    },

    async olustur(data) {
        return prisma.kategori.create({ data });
    },

    async guncelle(id, data) {
        await this.biriniGetir(id);
        return prisma.kategori.update({ where: { id }, data });
    },

    async sil(id) {
        await this.biriniGetir(id);
        return prisma.kategori.delete({ where: { id } });
    }

};

module.exports = kategoriService;