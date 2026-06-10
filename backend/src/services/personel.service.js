const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const personelService = {

    async hepsiniGetir() {
        return prisma.personel.findMany({
            include: { sube: true },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id) {
        const personel = await prisma.personel.findUnique({
            where: { id },
            include: {
                sube: true,
                maaslar: { orderBy: { tarih: 'desc' }, take: 12 },
                avanslar: { orderBy: { tarih: 'desc' }, take: 10 },
                devamlar: { orderBy: { tarih: 'desc' }, take: 30 },
            }
        });
        if (!personel) throw new Error('Personel bulunamadı');
        return personel;
    },

    async olustur(data) {
        return prisma.personel.create({
            data: {
                ...data,
                subeId: Number(data.subeId),
                maas: Number(data.maas),
                baslangicTarihi: new Date(data.baslangicTarihi),
            },
            include: { sube: true }
        });
    },

    async guncelle(id, data) {
        await this.biriniGetir(id);
        return prisma.personel.update({
            where: { id },
            data: {
                ...data,
                subeId: data.subeId ? Number(data.subeId) : undefined,
                maas: data.maas ? Number(data.maas) : undefined,
                baslangicTarihi: data.baslangicTarihi ? new Date(data.baslangicTarihi) : undefined,
            },
            include: { sube: true }
        });
    },

    async sil(id) {
        await this.biriniGetir(id);
        return prisma.personel.delete({ where: { id } });
    },

    async maasEkle({ personelId, yil, ay, tutar, odendi, tarih }) {
        return prisma.personelMaas.create({
            data: {
                personelId: Number(personelId),
                yil: Number(yil),
                ay: Number(ay),
                tutar: Number(tutar),
                odendi: odendi || false,
                tarih: tarih ? new Date(tarih) : new Date(),
            }
        });
    },

    async maasOdendi(id) {
        return prisma.personelMaas.update({
            where: { id },
            data: { odendi: true }
        });
    },

    async avansEkle({ personelId, tutar, aciklama, tarih }) {
        return prisma.personelAvans.create({
            data: {
                personelId: Number(personelId),
                tutar: Number(tutar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
            }
        });
    },

    async devamEkle({ personelId, tarih, durum, mesai, aciklama }) {
        return prisma.personelDevam.create({
            data: {
                personelId: Number(personelId),
                tarih: new Date(tarih),
                durum,
                mesai: mesai ? Number(mesai) : null,
                aciklama,
            }
        });
    }

};

module.exports = personelService;