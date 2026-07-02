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

        // Bu kategoriye bağlı stok kartı var mı kontrol et — varsa veritabanı
        // zaten foreign key constraint ile engelliyordu, ama ham Prisma hatası
        // kullanıcıya anlamsız görünüyordu. Önceden kontrol edip anlaşılır
        // bir mesaj döndürüyoruz.
        const bagliStokSayisi = await prisma.stokKart.count({
            where: { kategoriId: id, tenantId }
        });

        if (bagliStokSayisi > 0) {
            throw new Error(
                `Bu kategori silinemez: ${bagliStokSayisi} adet stok kartı bu kategoriyi kullanıyor. ` +
                `Önce bu stok kartlarını başka bir kategoriye taşıyın veya silin.`
            );
        }

        return prisma.kategori.delete({ where: { id } });
    }

};

module.exports = kategoriService;