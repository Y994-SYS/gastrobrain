const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const superAdminController = {

    async tenantlariGetir(req, res) {
        try {
            const tenantlar = await prisma.tenant.findMany({
                include: {
                    _count: {
                        select: {
                            kullanicilar: true,
                            subeler: true,
                            stokKartlari: true,
                        }
                    },
                },
                orderBy: { createdAt: 'desc' }
            });

            // Her tenant için bu ayki ciro
            const tenantlarCiro = await Promise.all(
                tenantlar.map(async (t) => {
                    const ayBaslangic = new Date();
                    ayBaslangic.setDate(1);
                    ayBaslangic.setHours(0, 0, 0, 0);

                    const ciro = await prisma.satis.aggregate({
                        where: { sube: { tenantId: t.id }, tarih: { gte: ayBaslangic } },
                        _sum: { toplam: true }
                    });

                    return {
                        ...t,
                        buAykiCiro: ciro._sum.toplam || 0
                    };
                })
            );

            res.json({ basarili: true, data: tenantlarCiro });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async tenantDetay(req, res) {
        try {
            const id = parseInt(req.params.id);
            const tenant = await prisma.tenant.findUnique({
                where: { id },
                include: {
                    subeler: true,
                    kullanicilar: {
                        select: { id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true }
                    },
                    _count: {
                        select: { stokKartlari: true, receteler: true, personeller: true }
                    },
                }
            });
            if (!tenant) return res.status(404).json({ basarili: false, mesaj: 'Tenant bulunamadı' });

            // Son 6 aylık ciro
            const altiAyOnce = new Date();
            altiAyOnce.setMonth(altiAyOnce.getMonth() - 6);
            const toplamCiro = await prisma.satis.aggregate({
                where: { sube: { tenantId: id }, tarih: { gte: altiAyOnce } },
                _sum: { toplam: true }
            });

            res.json({ basarili: true, data: { ...tenant, toplamCiro: toplamCiro._sum.toplam || 0 } });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async aktifPasifYap(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { aktif } = req.body;
            // Kendi tenant'ını pasife alamaz
            if (!aktif && id === req.kullanici.tenantId) {
                return res.status(400).json({ basarili: false, mesaj: 'Kendi firma hesabınızı pasife alamazsınız' });
            }
            const tenant = await prisma.tenant.update({
                where: { id },
                data: { aktif }
            });

            res.json({ basarili: true, data: tenant, mesaj: aktif ? 'Firma aktif edildi' : 'Firma pasife alındı' });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async planGuncelle(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { plan } = req.body;

            const gecerliPlanlar = ['BASLANGIC', 'PROFESYONEL', 'KURUMSAL'];
            if (!gecerliPlanlar.includes(plan)) {
                return res.status(400).json({ basarili: false, mesaj: 'Geçersiz plan' });
            }

            const tenant = await prisma.tenant.update({
                where: { id },
                data: { plan }
            });

            res.json({ basarili: true, data: tenant, mesaj: 'Plan güncellendi' });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async lisansGuncelle(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { lisansBitis, lisansNot } = req.body;

            const tenant = await prisma.tenant.update({
                where: { id },
                data: {
                    lisansBitis: lisansBitis ? new Date(lisansBitis) : null,
                    lisansNot: lisansNot || null,
                }
            });

            res.json({ basarili: true, data: tenant, mesaj: 'Lisans güncellendi' });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async lisansDurumlari(req, res) {
        try {
            const bugun = new Date();
            const otuzGunSonra = new Date();
            otuzGunSonra.setDate(otuzGunSonra.getDate() + 30);

            const tenantlar = await prisma.tenant.findMany({
                where: {
                    aktif: true,
                    lisansBitis: { not: null }
                },
                select: {
                    id: true, ad: true, slug: true, email: true,
                    lisansBitis: true, lisansNot: true, plan: true
                },
                orderBy: { lisansBitis: 'asc' }
            });

            const sonuclar = tenantlar.map(t => {
                const bitisTarihi = new Date(t.lisansBitis);
                const kalanGun = Math.ceil((bitisTarihi - bugun) / (1000 * 60 * 60 * 24));

                let durum;
                if (kalanGun < 0) durum = 'SURESI_DOLDU';
                else if (kalanGun <= 7) durum = 'KRITIK';
                else if (kalanGun <= 30) durum = 'UYARI';
                else durum = 'AKTIF';

                return { ...t, kalanGun, durum };
            });

            const ozet = {
                suresiDolan: sonuclar.filter(t => t.durum === 'SURESI_DOLDU').length,
                kritik: sonuclar.filter(t => t.durum === 'KRITIK').length,
                uyari: sonuclar.filter(t => t.durum === 'UYARI').length,
                aktif: sonuclar.filter(t => t.durum === 'AKTIF').length,
            };

            res.json({ basarili: true, data: { tenantlar: sonuclar, ozet } });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    },

    async istatistikler(req, res) {
        try {
            const toplamTenant = await prisma.tenant.count();
            const aktifTenant = await prisma.tenant.count({ where: { aktif: true } });

            const planDagilimi = await prisma.tenant.groupBy({
                by: ['plan'],
                _count: { plan: true }
            });

            const buAy = new Date();
            buAy.setDate(1); buAy.setHours(0, 0, 0, 0);
            const yeniKayitlar = await prisma.tenant.count({ where: { createdAt: { gte: buAy } } });

            const toplamKullanici = await prisma.kullanici.count();
            const toplamSatis = await prisma.satis.count();

            const toplamCiro = await prisma.satis.aggregate({ _sum: { toplam: true } });

            res.json({
                basarili: true,
                data: {
                    toplamTenant,
                    aktifTenant,
                    pasifTenant: toplamTenant - aktifTenant,
                    yeniKayitlar,
                    toplamKullanici,
                    toplamSatis,
                    toplamCiro: toplamCiro._sum.toplam || 0,
                    planDagilimi: planDagilimi.map(p => ({ plan: p.plan, sayi: p._count.plan }))
                }
            });
        } catch (err) {
            res.status(500).json({ basarili: false, mesaj: err.message });
        }
    }

};

module.exports = superAdminController;