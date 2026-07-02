const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cariKartService = {

    async hepsiniGetir(tenantId) {
        return prisma.cariKart.findMany({
            where: { tenantId },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const cariKart = await prisma.cariKart.findFirst({
            where: { id, tenantId },
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

    async olustur(data, tenantId) {
        return prisma.cariKart.create({ data: { ...data, tenantId } });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.cariKart.update({ where: { id }, data });
    },

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);

        // CariHareket.cariKartId bu carta bağlı olabilir — foreign key
        // constraint'e düşmeden önce kontrol edip anlaşılır hata veriyoruz.
        const bagliHareketSayisi = await prisma.cariHareket.count({
            where: { cariKartId: id }
        });

        if (bagliHareketSayisi > 0) {
            throw new Error(
                `Bu cari kart silinemez: ${bagliHareketSayisi} adet cari hareket kaydı bulunuyor. ` +
                `Cari kartlar geçmiş işlem kaydı olduğu sürece silinemez — bunun yerine kartı pasif yapmayı düşünebilirsiniz.`
            );
        }

        return prisma.cariKart.delete({ where: { id } });
    },

    async bakiyeGetir(id, tenantId) {
        // Önce bu tenant'a ait olduğunu doğrula
        await this.biriniGetir(id, tenantId);
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