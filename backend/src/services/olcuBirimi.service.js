const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const olcuBirimiService = {

    async hepsiniGetir() {
        return prisma.olcuBirimi.findMany({ orderBy: { ad: 'asc' } });
    },

    async biriniGetir(id) {
        const olcuBirimi = await prisma.olcuBirimi.findUnique({ where: { id } });
        if (!olcuBirimi) throw new Error('Ölçü birimi bulunamadı');
        return olcuBirimi;
    },

    async olustur(data) {
        return prisma.olcuBirimi.create({ data });
    },

    async guncelle(id, data) {
        await this.biriniGetir(id);
        return prisma.olcuBirimi.update({ where: { id }, data });
    },

    async sil(id) {
        await this.biriniGetir(id);
        return prisma.olcuBirimi.delete({ where: { id } });
    }

};

module.exports = olcuBirimiService;