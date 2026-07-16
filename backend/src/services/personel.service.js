const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────

/**
 * Bir tarihe göre, verilen referans tarihi itibarıyla kaç tam yıl geçtiğini
 * hesaplar (yıldönümü henüz gelmediyse 1 eksik sayar).
 */
function tamYilHesapla(baslangicTarihi, referansTarihi = new Date()) {
    let yil = referansTarihi.getFullYear() - baslangicTarihi.getFullYear();
    const yilDonumuBuYil = new Date(
        referansTarihi.getFullYear(),
        baslangicTarihi.getMonth(),
        baslangicTarihi.getDate()
    );
    if (referansTarihi < yilDonumuBuYil) yil -= 1;
    return Math.max(yil, 0);
}

/**
 * TC İş Kanunu Madde 53'e göre yıllık ücretli izin hakkını hesaplar.
 * - 1 yıldan az kıdem: 0 gün (hak henüz doğmadı)
 * - 1-5 yıl (5 dahil): 14 gün
 * - 5-15 yıl arası (5 hariç, 15 dahil): 20 gün
 * - 15 yıl ve üzeri: 26 gün
 * İstisna: 18 yaşından küçük veya 50 yaşından büyük çalışanlara kıdeme
 * bakılmaksızın en az 20 gün verilir.
 */
function yillikIzinHakkiHesapla(kidemYili, dogumTarihi, referansTarihi = new Date()) {
    let hak;
    if (kidemYili < 1) hak = 0;
    else if (kidemYili <= 5) hak = 14;
    else if (kidemYili <= 15) hak = 20;
    else hak = 26;

    if (dogumTarihi) {
        const yas = tamYilHesapla(new Date(dogumTarihi), referansTarihi);
        if ((yas < 18 || yas >= 50) && hak < 20) {
            hak = 20;
        }
    }

    return hak;
}

// ── Servis ────────────────────────────────────────────────────────────────────

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
    },

    // ── Yıllık izin takibi ───────────────────────────────────────────────────

    async izinDurumuGetir(personelId, yil, tenantId) {
        const personel = await this.biriniGetir(Number(personelId), tenantId);

        const hedefYil = yil ? Number(yil) : new Date().getFullYear();
        // Kıdem, ilgili yılın son günü itibarıyla hesaplanır
        const referansTarihi = new Date(hedefYil, 11, 31);
        const kidemYili = tamYilHesapla(new Date(personel.baslangicTarihi), referansTarihi);
        const hakEdilenGun = yillikIzinHakkiHesapla(
            kidemYili,
            personel.dogumTarihi,
            referansTarihi
        );

        const kayit = await prisma.personelIzin.findUnique({
            where: { personelId_yil: { personelId: Number(personelId), yil: hedefYil } }
        });
        const kullanilanGun = kayit?.kullanilanGun || 0;

        return {
            personelId: Number(personelId),
            yil: hedefYil,
            kidemYili,
            hakEdilenGun,
            kullanilanGun,
            kalanGun: hakEdilenGun - kullanilanGun,
        };
    },

    async izinKullanimGuncelle({ personelId, yil, kullanilanGun, aciklama }, tenantId, guncelleyenId) {
        await this.biriniGetir(Number(personelId), tenantId);

        return prisma.personelIzin.upsert({
            where: {
                personelId_yil: { personelId: Number(personelId), yil: Number(yil) }
            },
            update: {
                kullanilanGun: Number(kullanilanGun),
                aciklama,
                guncelleyen: guncelleyenId,
            },
            create: {
                personelId: Number(personelId),
                yil: Number(yil),
                kullanilanGun: Number(kullanilanGun),
                aciklama,
                guncelleyen: guncelleyenId,
            }
        });
    },

};

module.exports = personelService;