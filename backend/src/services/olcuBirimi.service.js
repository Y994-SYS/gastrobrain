const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const olcuBirimiService = {

    async hepsiniGetir(tenantId) {
        return prisma.olcuBirimi.findMany({
            where: { tenantId },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const olcuBirimi = await prisma.olcuBirimi.findFirst({ where: { id, tenantId } });
        if (!olcuBirimi) throw new Error('Ölçü birimi bulunamadı');
        return olcuBirimi;
    },

    async olustur(data, tenantId) {
        return prisma.olcuBirimi.create({ data: { ...data, tenantId } });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.olcuBirimi.update({ where: { id }, data });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);

        // StokKart.birimId bu ölçü birimine bağlı olabilir — foreign key
        // constraint'e düşmeden önce kontrol edip anlaşılır hata veriyoruz.
        const bagliStokSayisi = await prisma.stokKart.count({
            where: { birimId: id, tenantId }
        });

        if (bagliStokSayisi > 0) {
            throw new Error(
                `Bu ölçü birimi silinemez: ${bagliStokSayisi} adet stok kartı bu birimi kullanıyor. ` +
                `Önce bu stok kartlarının birimini değiştirin veya kartları silin.`
            );
        }

        return prisma.olcuBirimi.delete({ where: { id } });
    }

};

module.exports = olcuBirimiService;