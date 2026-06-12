const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const kategoriService = {

    async hepsiniGetir(tenantId) {
        return prisma.kategori.findMany({
            where: { tenantId },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const kategori = await prisma.kategori.findFirst({ where: { id, tenantId } });
        if (!kategori) throw new Error('Kategori bulunamadı');
        return kategori;
    },

    async olustur(data, tenantId) {
        return prisma.kategori.create({ data: { ...data, tenantId } });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.kategori.update({ where: { id }, data });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.kategori.delete({ where: { id } });
    }

};

module.exports = kategoriService;