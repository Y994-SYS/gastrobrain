const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const personelService = {

    async hepsiniGetir(tenantId, subeId = null) {
        const where = { tenantId };
        if (subeId) where.subeId = Number(subeId);
        return prisma.personel.findMany({
            where,
            include: { sube: true },
            orderBy: { ad: 'asc' }
        });
    },

    async biriniGetir(id, tenantId) {
        const personel = await prisma.personel.findFirst({
            where: { id, tenantId },
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

    async olustur(data, tenantId) {
        return prisma.personel.create({
            data: {
                ...data,
                tenantId,
                subeId: Number(data.subeId),
                maas: Number(data.maas),
                baslangicTarihi: new Date(data.baslangicTarihi),
            },
            include: { sube: true }
        });
    },

    async guncelle(id, data, tenantId) {
        await this.biriniGetir(id, tenantId);
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

    async sil(id, tenantId) {
        await this.biriniGetir(id, tenantId);
        return prisma.personel.delete({ where: { id } });
    },

    async maasEkle({ personelId, yil, ay, tutar, odendi, tarih }, tenantId) {
        await this.biriniGetir(Number(personelId), tenantId);

        // Aynı ay için maaş kaydı var mı kontrol et
        const mevcutMaas = await prisma.personelMaas.findFirst({
            where: {
                personelId: Number(personelId),
                yil: Number(yil),
                ay: Number(ay),
            }
        });

        if (mevcutMaas) {
            throw new Error(
                `Bu personel için ${ay}. ay ${yil} maaşı zaten kayıtlı. ` +
                `Durum: ${mevcutMaas.odendi ? 'Ödendi' : 'Bekliyor'}`
            );
        }

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
    async maasOdendi(id, tenantId) {
        const maas = await prisma.personelMaas.findFirst({
            where: { id },
            include: { personel: true }
        });
        if (!maas || maas.personel.tenantId !== tenantId) throw new Error('Maaş kaydı bulunamadı');
        return prisma.personelMaas.update({
            where: { id },
            data: { odendi: true }
        });
    },

    async avansEkle({ personelId, tutar, aciklama, tarih }, tenantId) {
        await this.biriniGetir(Number(personelId), tenantId);
        return prisma.personelAvans.create({
            data: {
                personelId: Number(personelId),
                tutar: Number(tutar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
            }
        });
    },

    async devamEkle({ personelId, tarih, durum, mesai, aciklama }, tenantId) {
        await this.biriniGetir(Number(personelId), tenantId);
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