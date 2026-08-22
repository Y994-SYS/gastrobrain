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
        // aktif: true yerine "aktif !== false" mantığı kullanılıyor —
        // migration/push sonrası eski kayıtlarda aktif alanı NULL kalmışsa
        // bile bu personeller yanlışlıkla listeden düşmesin diye.
        const where = { tenantId, aktif: { not: false } };
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
        // Gerçek silme yerine "pasif" işaretleniyor (soft delete). Böylece
        // maaş/avans/devam gibi geçmiş kayıtlar korunur ve foreign key
        // hatası yaşanmaz; personel sadece listeden kayboluyor.
        return prisma.personel.update({
            where: { id },
            data: { aktif: false, silinmeTarihi: new Date() }
        });
    },

    async geriYukle(id, tenantId) {
        const personel = await prisma.personel.findFirst({ where: { id, tenantId } });
        if (!personel) throw new Error('Personel bulunamadı');
        return prisma.personel.update({
            where: { id },
            data: { aktif: true, silinmeTarihi: null }
        });
    },

    async maasEkle({ personelId, yil, ay, tutar, odendi, tarih }, tenantId) {
        await this.biriniGetir(Number(personelId), tenantId);

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

    /**
     * Mevcut bir maaş kaydını (tutar, ödendi durumu, tarih, gerekirse yıl/ay)
     * günceller. Frontend'de "bu dönem için zaten kayıt var" durumunda
     * kullanıcı yeni kayıt yerine bunu tetikler, böylece maasEkle'deki
     * "zaten kayıtlı" hatasına takılmadan üzerine yazılabilir.
     */
    async maasGuncelle(id, { yil, ay, tutar, odendi, tarih }, tenantId) {
        const maas = await prisma.personelMaas.findFirst({
            where: { id },
            include: { personel: true }
        });
        if (!maas || maas.personel.tenantId !== tenantId) throw new Error('Maaş kaydı bulunamadı');

        // Yıl/ay değiştiriliyorsa, hedef dönemde bu kayıt DIŞINDA başka bir
        // kayıt olmadığından emin ol (aksi halde iki kayıt aynı döneme düşer)
        if (
            (yil !== undefined && Number(yil) !== maas.yil) ||
            (ay !== undefined && Number(ay) !== maas.ay)
        ) {
            const hedefYil = yil !== undefined ? Number(yil) : maas.yil;
            const hedefAy = ay !== undefined ? Number(ay) : maas.ay;

            const cakisan = await prisma.personelMaas.findFirst({
                where: {
                    personelId: maas.personelId,
                    yil: hedefYil,
                    ay: hedefAy,
                    NOT: { id },
                }
            });
            if (cakisan) {
                throw new Error(
                    `Bu personel için ${hedefAy}. ay ${hedefYil} maaşı zaten kayıtlı. ` +
                    `Durum: ${cakisan.odendi ? 'Ödendi' : 'Bekliyor'}`
                );
            }
        }

        return prisma.personelMaas.update({
            where: { id },
            data: {
                yil: yil !== undefined ? Number(yil) : undefined,
                ay: ay !== undefined ? Number(ay) : undefined,
                tutar: tutar !== undefined ? Number(tutar) : undefined,
                odendi: odendi !== undefined ? odendi : undefined,
                tarih: tarih ? new Date(tarih) : undefined,
            }
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

    /**
     * Tarih aralığındaki her gün için ayrı bir PersonelDevam kaydı oluşturur.
     * Örn. 15.07.2026 - 19.07.2026 arası "İzin" seçilirse 5 ayrı gün kaydı açar.
     */
    async devamTopluEkle({ personelId, baslangicTarihi, bitisTarihi, durum, mesai, aciklama }, tenantId) {
        await this.biriniGetir(Number(personelId), tenantId);

        const baslangic = new Date(baslangicTarihi);
        const bitis = new Date(bitisTarihi);
        if (bitis < baslangic) {
            throw new Error('Bitiş tarihi başlangıç tarihinden önce olamaz');
        }

        const gunler = [];
        const gun = new Date(baslangic);
        while (gun <= bitis) {
            gunler.push(new Date(gun));
            gun.setDate(gun.getDate() + 1);
        }

        if (gunler.length > 90) {
            throw new Error('Tek seferde en fazla 90 gün girilebilir');
        }

        const veriler = gunler.map((tarih) => ({
            personelId: Number(personelId),
            tarih,
            durum,
            mesai: mesai ? Number(mesai) : null,
            aciklama,
        }));

        await prisma.personelDevam.createMany({ data: veriler });

        return { eklenenGunSayisi: gunler.length, ilkGun: gunler[0], sonGun: gunler[gunler.length - 1] };
    },

    // ── Yıllık izin takibi ───────────────────────────────────────────────────

    /**
     * Bir personelin belirli bir yıl için izin durumunu hesaplar.
     * kullanılanGun = otomatikGun (Devam Kaydı'ndaki IZIN kayıtlarının sayısı)
     *               + manuelDuzeltme (admin tarafından elle girilen ek/eksi düzeltme)
     */
    async izinDurumuGetir(personelId, yil, tenantId) {
        const personel = await this.biriniGetir(Number(personelId), tenantId);

        const hedefYil = yil ? Number(yil) : new Date().getFullYear();
        const yilBaslangic = new Date(hedefYil, 0, 1);
        const yilBitis = new Date(hedefYil, 11, 31, 23, 59, 59, 999);

        const referansTarihi = new Date(hedefYil, 11, 31);
        const kidemYili = tamYilHesapla(new Date(personel.baslangicTarihi), referansTarihi);
        const hakEdilenGun = yillikIzinHakkiHesapla(
            kidemYili,
            personel.dogumTarihi,
            referansTarihi
        );

        const otomatikGun = await prisma.personelDevam.count({
            where: {
                personelId: Number(personelId),
                durum: 'IZIN',
                tarih: { gte: yilBaslangic, lte: yilBitis },
            }
        });

        const kayit = await prisma.personelIzin.findUnique({
            where: { personelId_yil: { personelId: Number(personelId), yil: hedefYil } }
        });
        const manuelDuzeltme = kayit?.kullanilanGun || 0;

        const kullanilanGun = otomatikGun + manuelDuzeltme;

        return {
            personelId: Number(personelId),
            yil: hedefYil,
            kidemYili,
            hakEdilenGun,
            otomatikGun,
            manuelDuzeltme,
            kullanilanGun,
            kalanGun: hakEdilenGun - kullanilanGun,
        };
    },

    /**
     * Manuel düzeltme miktarını kaydeder. Bu TOPLAM kullanılan gün DEĞİL,
     * otomatik sayıma eklenecek/çıkarılacak ek miktardır (negatif olabilir).
     */
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