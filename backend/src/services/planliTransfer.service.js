const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GIRIS_TIPLER = new Set(['GIRIS_FATURA', 'IADE_FATURA', 'SUBE_TRANSFER_IN']);

const bakiyeHesapla = async (subeId, stokKartId) => {
    const hareketler = await prisma.stokHareket.groupBy({
        by: ['tip'],
        where: { subeId, stokKartId },
        _sum: { miktar: true },
    });
    return hareketler.reduce((toplam, h) => {
        const miktar = h._sum.miktar || 0;
        return toplam + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar);
    }, 0);
};

const planliTransferService = {

    async olustur({ tenantId, ad, stokKartId, kaynakSubeId, hedefSubeId, miktar, gunler, saat, dakika, aktif, aciklama }) {
        // Sahiplik kontrolleri
        const [kaynakSube, hedefSube, stokKart] = await Promise.all([
            prisma.sube.findFirst({ where: { id: kaynakSubeId, tenantId } }),
            prisma.sube.findFirst({ where: { id: hedefSubeId, tenantId } }),
            prisma.stokKart.findFirst({ where: { id: stokKartId, tenantId } }),
        ]);

        if (!kaynakSube) throw new Error('Kaynak şube bulunamadı');
        if (!hedefSube) throw new Error('Hedef şube bulunamadı');
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        return await prisma.planliTransfer.create({
            data: { tenantId, ad, stokKartId, kaynakSubeId, hedefSubeId, miktar, gunler, saat, dakika, aktif: aktif ?? true, aciklama },
            include: {
                stokKart: { include: { birim: true } },
                kaynakSube: true,
                hedefSube: true,
            }
        });
    },

    async tumunuGetir(tenantId) {
        return await prisma.planliTransfer.findMany({
            where: { tenantId },
            include: {
                stokKart: { include: { birim: true } },
                kaynakSube: true,
                hedefSube: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    },

    async guncelle(id, tenantId, data) {
        const mevcut = await prisma.planliTransfer.findFirst({ where: { id, tenantId } });
        if (!mevcut) throw new Error('Plan bulunamadı');

        return await prisma.planliTransfer.update({
            where: { id },
            data,
            include: {
                stokKart: { include: { birim: true } },
                kaynakSube: true,
                hedefSube: true,
            }
        });
    },

    async sil(id, tenantId) {
        const mevcut = await prisma.planliTransfer.findFirst({ where: { id, tenantId } });
        if (!mevcut) throw new Error('Plan bulunamadı');
        return await prisma.planliTransfer.delete({ where: { id } });
    },

    async aktifPasifYap(id, tenantId, aktif) {
        const mevcut = await prisma.planliTransfer.findFirst({ where: { id, tenantId } });
        if (!mevcut) throw new Error('Plan bulunamadı');
        return await prisma.planliTransfer.update({
            where: { id },
            data: { aktif },
            include: {
                stokKart: { include: { birim: true } },
                kaynakSube: true,
                hedefSube: true,
            }
        });
    },

    // Manuel tetikleme (hemen çalıştır)
    async hemenCalistir(id, tenantId) {
        const plan = await prisma.planliTransfer.findFirst({
            where: { id, tenantId },
            include: { stokKart: true, kaynakSube: true, hedefSube: true }
        });

        if (!plan) throw new Error('Plan bulunamadı');

        // Bakiye kontrolü
        const mevcutBakiye = await bakiyeHesapla(plan.kaynakSubeId, plan.stokKartId);
        if (mevcutBakiye < plan.miktar) {
            throw new Error(`Yetersiz stok. Mevcut: ${mevcutBakiye} ${plan.stokKart.ad}`);
        }

        const tarih = new Date();
        const aciklamaMetni = `[PLANLI TRANSFER] ${plan.ad}`;

        await prisma.$transaction(async (tx) => {
            await tx.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_OUT',
                    miktar: plan.miktar,
                    aciklama: aciklamaMetni,
                    tarih,
                    stokKartId: plan.stokKartId,
                    subeId: plan.kaynakSubeId,
                }
            });

            await tx.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_IN',
                    miktar: plan.miktar,
                    aciklama: aciklamaMetni,
                    tarih,
                    stokKartId: plan.stokKartId,
                    subeId: plan.hedefSubeId,
                }
            });

            await tx.planliTransfer.update({
                where: { id },
                data: { sonCalisma: tarih }
            });
        });

        return {
            mesaj: 'Transfer tamamlandı',
            plan: plan.ad,
            miktar: plan.miktar,
            kaynakSube: plan.kaynakSube.ad,
            hedefSube: plan.hedefSube.ad,
        };
    },

    // Cron job tarafından çağrılır
    async zamanlanmisCalistir() {
        const simdi = new Date();
        const bugunGun = simdi.getDay(); // 0=Pazar, 1=Pazartesi...
        const simdikiSaat = simdi.getHours();
        const simdikiDakika = simdi.getMinutes();

        // Aktif tüm planları getir
        const planlar = await prisma.planliTransfer.findMany({
            where: { aktif: true },
            include: {
                stokKart: true,
                kaynakSube: true,
                hedefSube: true,
                tenant: true,
            }
        });

        const sonuclar = [];

        for (const plan of planlar) {
            // Gün ve saat kontrolü
            const planGunler = plan.gunler.split(',').map(Number);
            if (!planGunler.includes(bugunGun)) continue;
            if (plan.saat !== simdikiSaat) continue;
            if (Math.abs(plan.dakika - simdikiDakika) > 2) continue; // 2 dakika tolerans

            try {
                const sonuc = await this.hemenCalistir(plan.id, plan.tenantId);
                sonuclar.push({ basarili: true, ...sonuc });
            } catch (err) {
                sonuclar.push({
                    basarili: false,
                    plan: plan.ad,
                    hata: err.message
                });
            }
        }

        return sonuclar;
    }
};

module.exports = planliTransferService;