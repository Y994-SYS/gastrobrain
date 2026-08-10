const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mailService = require('./mail.service');

const GIRIS_TIPLER = new Set(['GIRIS_FATURA', 'IADE_FATURA', 'SUBE_TRANSFER_IN', 'AY_SONU_SAYIM']);

// Tenant'ın tüm kritik stoklarını hesapla
const kritikStoklariGetir = async (tenantId, subeId = null) => {
    const where = { tenantId, aktif: true, minStok: { gt: 0 } };

    const kartlar = await prisma.stokKart.findMany({
        where,
        include: {
            kategori: true,
            birim: true,
            stokHareketleri: {
                where: subeId ? { subeId } : {},
            }
        }
    });

    const subeler = await prisma.sube.findMany({
        where: { tenantId, aktif: true }
    });

    const kritikler = [];

    for (const kart of kartlar) {
        // Şube bazlı bakiye hesapla
        for (const sube of subeler) {
            if (subeId && sube.id !== subeId) continue;

            const hareketler = kart.stokHareketleri.filter(h => h.subeId === sube.id);

            const bakiye = hareketler.reduce((toplam, h) => {
                const miktar = h.miktar || 0;
                return toplam + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar);
            }, 0);

            if (bakiye <= kart.minStok) {
                kritikler.push({
                    id: kart.id,
                    ad: kart.ad,
                    kategori: kart.kategori?.ad || '-',
                    birim: kart.birim?.kisaltma || '',
                    mevcutStok: Math.round(bakiye * 1000) / 1000,
                    minStok: kart.minStok,
                    subeAd: subeler.length > 1 ? sube.ad : null,
                    subeId: sube.id,
                });
            }
        }
    }

    return kritikler;
};

const stokUyariService = {

    // Kritik stok maili gönder (manuel veya otomatik)
    async kritikStokKontrol() {
        const tenantlar = await prisma.tenant.findMany({
            where: { aktif: true }
        });

        let toplamGonderilen = 0;

        for (const tenant of tenantlar) {
            try {
                const kritikler = await kritikStoklariGetir(tenant.id);

                if (kritikler.length === 0) continue;

                // Tenant'ın admin emailini bul
                const admin = await prisma.kullanici.findFirst({
                    where: { tenantId: tenant.id, rol: 'TENANT_ADMIN', aktif: true }
                });

                if (!admin?.email) continue;

                await mailService.kritikStokUyariGonder(
                    admin.email,
                    tenant.ad,
                    kritikler
                );

                toplamGonderilen++;
                console.log(`[STOK UYARI] ${tenant.ad}: ${kritikler.length} kritik stok maili gönderildi`);
            } catch (err) {
                console.error(`[STOK UYARI HATA] ${tenant.ad}:`, err.message);
            }
        }

        return { toplamGonderilen };
    },

    // Günlük stok raporu gönder
    async gunlukRaporGonder() {
        const tenantlar = await prisma.tenant.findMany({
            where: { aktif: true }
        });

        let toplamGonderilen = 0;

        for (const tenant of tenantlar) {
            try {
                const kritikler = await kritikStoklariGetir(tenant.id);

                // Toplam stok kart sayısı
                const toplamKart = await prisma.stokKart.count({
                    where: { tenantId: tenant.id, aktif: true }
                });

                // Günlük ciro
                const bugunBaslangic = new Date();
                bugunBaslangic.setHours(0, 0, 0, 0);
                const ciro = await prisma.satis.aggregate({
                    where: {
                        sube: { tenantId: tenant.id },
                        tarih: { gte: bugunBaslangic }
                    },
                    _sum: { toplam: true }
                });

                const admin = await prisma.kullanici.findFirst({
                    where: { tenantId: tenant.id, rol: 'TENANT_ADMIN', aktif: true }
                });

                if (!admin?.email) continue;

                await mailService.gunlukStokRaporuGonder(
                    admin.email,
                    tenant.ad,
                    {
                        toplamKart,
                        kritikSayisi: kritikler.length,
                        kritikStoklar: kritikler,
                        gunlukCiro: ciro._sum.toplam || 0,
                    }
                );

                toplamGonderilen++;
                console.log(`[GÜNLÜK RAPOR] ${tenant.ad}: rapor gönderildi`);
            } catch (err) {
                console.error(`[GÜNLÜK RAPOR HATA] ${tenant.ad}:`, err.message);
            }
        }

        return { toplamGonderilen };
    }
};

module.exports = stokUyariService;