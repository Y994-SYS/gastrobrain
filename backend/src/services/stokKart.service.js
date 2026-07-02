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

        // StokKart üç farklı yerden referans alınabiliyor: stok hareketleri
        // (girişler/çıkışlar), reçete kalemleri, cari hareket kalemleri.
        // Herhangi biri varsa foreign key constraint'e düşer — önceden
        // kontrol edip hangi tablo(lar) yüzünden engellendiğini net söylüyoruz.
        const [hareketSayisi, receteKalemSayisi, cariKalemSayisi] = await Promise.all([
            prisma.stokHareket.count({ where: { stokKartId: id } }),
            prisma.receteKalem.count({ where: { stokKartId: id } }),
            prisma.cariHareketKalem.count({ where: { stokKartId: id } }),
        ]);

        const nedenler = [];
        if (hareketSayisi > 0) nedenler.push(`${hareketSayisi} adet stok hareketi (giriş/çıkış/satış kaydı)`);
        if (receteKalemSayisi > 0) nedenler.push(`${receteKalemSayisi} adet reçetede malzeme olarak kullanılıyor`);
        if (cariKalemSayisi > 0) nedenler.push(`${cariKalemSayisi} adet cari hareket kalemi`);

        if (nedenler.length > 0) {
            throw new Error(
                `Bu stok kartı silinemez: ${nedenler.join(', ')}. ` +
                `Geçmiş kayıtlar bulunduğu için silinemiyor — bunun yerine kartı pasif yapmayı düşünebilirsiniz.`
            );
        }

        return prisma.stokKart.delete({ where: { id } });
    }

};

module.exports = stokKartService;