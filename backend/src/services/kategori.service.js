const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const kategoriService = {

    async hepsiniGetir(tenantId, tip) {
        return prisma.kategori.findMany({
            where: { tenantId, ...(tip ? { tip } : {}) },
            orderBy: [{ sira: 'asc' }, { ad: 'asc' }]
        });
    },

    async biriniGetir(id, tenantId) {
        const kategori = await prisma.kategori.findFirst({ where: { id, tenantId } });
        if (!kategori) throw new Error('Kategori bulunamadı');
        return kategori;
    },

    async olustur(data, tenantId) {
        // tip belirtilmezse STOK varsayılan (Prisma şema default'u zaten
        // bunu yapar, ama burada da açık bırakmak controller tarafında
        // hangi tip gönderildiğini net görmeyi sağlıyor)
        return prisma.kategori.create({ data: { ...data, tenantId } });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        // tip ve tenantId body'den gelse bile üzerine yazılmasın —
        // bir kategori sonradan STOK'tan RECETE'ye "kayarsa" mevcut
        // ilişkili kayıtlar (stokKart/recete) sahipsiz kalabilir.
        const { tip, tenantId: _tid, ...guncellenebilir } = data;
        return prisma.kategori.update({ where: { id }, data: guncellenebilir });
    },

    async siraGuncelle(siraliIdListesi, tenantId) {
        // [{id: 3, sira: 0}, {id: 1, sira: 1}, ...] — sürükle-bırak sonrası
        // toplu sıra güncellemesi için
        await Promise.all(
            siraliIdListesi.map(({ id, sira }) =>
                prisma.kategori.updateMany({
                    where: { id, tenantId },
                    data: { sira }
                })
            )
        );
        return this.hepsiniGetir(tenantId);
    },

    async sil(id, tenantId) {
        const kategori = await this.biriniGetir(id, tenantId);

        // Bu kategoriye bağlı stok kartı ya da reçete var mı kontrol et —
        // ikisi de foreign key ile ilişkili olabilir (tip'e göre biri
        // dolu olur), her ikisini de kontrol ediyoruz ki kategori tipi
        // yanlışlıkla değiştirilmiş olsa bile doğru mesaj dönsün.
        const [bagliStokSayisi, bagliReceteSayisi] = await Promise.all([
            prisma.stokKart.count({ where: { kategoriId: id, tenantId } }),
            prisma.recete.count({ where: { kategoriId: id, tenantId } }),
        ]);

        if (bagliStokSayisi > 0) {
            throw new Error(
                `Bu kategori silinemez: ${bagliStokSayisi} adet stok kartı bu kategoriyi kullanıyor. ` +
                `Önce bu stok kartlarını başka bir kategoriye taşıyın veya silin.`
            );
        }
        if (bagliReceteSayisi > 0) {
            throw new Error(
                `Bu kategori silinemez: ${bagliReceteSayisi} adet reçete bu kategoriyi kullanıyor. ` +
                `Önce bu reçeteleri başka bir kategoriye taşıyın veya silin.`
            );
        }

        return prisma.kategori.delete({ where: { id } });
    }

};

module.exports = kategoriService;