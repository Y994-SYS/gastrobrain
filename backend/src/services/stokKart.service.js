const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stokKartService = {

    async hepsiniGetir(tenantId) {
        return prisma.stokKart.findMany({
            where: { tenantId },
            include: { kategori: true, birim: true },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({
            where: { id, tenantId },
            include: { kategori: true, birim: true }
        });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');
        return stokKart;
    },

    async olustur(data, tenantId) {
        return prisma.stokKart.create({
            data: { ...data, tenantId },
            include: { kategori: true, birim: true }
        });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.stokKart.update({
            where: { id },
            data,
            include: { kategori: true, birim: true }
        });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.stokKart.delete({ where: { id } });
    }

};

module.exports = stokKartService;