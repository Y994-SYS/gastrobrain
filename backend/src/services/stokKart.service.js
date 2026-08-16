const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDOR koruması: kategoriId ve/veya birimId gönderildiyse, bunların
// gerçekten istek sahibinin tenant'ına ait olduğunu doğrular.
// Aksi halde biri başka bir tenant'ın kategori/birim ID'sini vererek
// stok kartını yabancı bir kayda "bağlayabilir" (ör. include ile
// başka tenant'ın kategori adı sızdırılabilir).
async function iliskileriDogrula({ kategoriId, birimId }, tenantId) {
    const kontroller = [];

    if (kategoriId !== undefined && kategoriId !== null) {
        kontroller.push(
            prisma.kategori.findFirst({ where: { id: kategoriId, tenantId } })
                .then(k => { if (!k) throw new Error('Geçersiz kategori: bu kategori bulunamadı veya erişim yetkiniz yok'); })
        );
    }

    if (birimId !== undefined && birimId !== null) {
        kontroller.push(
            prisma.olcuBirimi.findFirst({ where: { id: birimId, tenantId } })
                .then(b => { if (!b) throw new Error('Geçersiz ölçü birimi: bu birim bulunamadı veya erişim yetkiniz yok'); })
        );
    }

    await Promise.all(kontroller);
}

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
        await iliskileriDogrula(data, tenantId);
        try {
            return await prisma.stokKart.create({
                data: { ...data, tenantId },
                include: { kategori: true, birim: true }
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new Error('Bu stok kodu zaten kullanılıyor, farklı bir kod seçin');
            }
            throw err;
        }
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
        await iliskileriDogrula(data, tenantId);
        try {
            return await prisma.stokKart.update({
                where: { id },
                data,
                include: { kategori: true, birim: true }
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new Error('Bu stok kodu zaten kullanılıyor, farklı bir kod seçin');
            }
            throw err;
        }
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