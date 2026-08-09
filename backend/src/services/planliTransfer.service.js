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

    async olustur({ tenantId, ad, gunler, saat, dakika, aktif, aciklama, kalemler }) {
        if (!kalemler || kalemler.length === 0) {
            throw new Error('En az bir kalem ekleyin');
        }

        // Tüm şube ve stok kartlarının bu tenant'a ait olduğunu doğrula
        for (const kalem of kalemler) {
            const [kaynak, hedef, stok] = await Promise.all([
                prisma.sube.findFirst({ where: { id: kalem.kaynakSubeId, tenantId } }),
                prisma.sube.findFirst({ where: { id: kalem.hedefSubeId, tenantId } }),
                prisma.stokKart.findFirst({ where: { id: kalem.stokKartId, tenantId } }),
            ]);
            if (!kaynak) throw new Error('Kaynak şube bulunamadı');
            if (!hedef) throw new Error('Hedef şube bulunamadı');
            if (!stok) throw new Error('Stok kartı bulunamadı');
            if (kalem.kaynakSubeId === kalem.hedefSubeId) throw new Error('Kaynak ve hedef şube aynı olamaz');
        }

        return await prisma.planliTransfer.create({
            data: {
                tenantId, ad, gunler, saat, dakika,
                aktif: aktif ?? true,
                aciklama,
                kalemler: {
                    create: kalemler.map(k => ({
                        stokKartId: k.stokKartId,
                        kaynakSubeId: k.kaynakSubeId,
                        hedefSubeId: k.hedefSubeId,
                        miktar: k.miktar,
                        aciklama: k.aciklama || null,
                    }))
                }
            },
            include: {
                kalemler: {
                    include: {
                        stokKart: { include: { birim: true } },
                        kaynakSube: true,
                        hedefSube: true,
                    }
                }
            }
        });
    },

    async tumunuGetir(tenantId) {
        return await prisma.planliTransfer.findMany({
            where: { tenantId },
            include: {
                kalemler: {
                    include: {
                        stokKart: { include: { birim: true } },
                        kaynakSube: true,
                        hedefSube: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
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
                kalemler: {
                    include: {
                        stokKart: { include: { birim: true } },
                        kaynakSube: true,
                        hedefSube: true,
                    }
                }
            }
        });
    },

    async hemenCalistir(id, tenantId) {
        const plan = await prisma.planliTransfer.findFirst({
            where: { id, tenantId },
            include: {
                kalemler: {
                    include: {
                        stokKart: true,
                        kaynakSube: true,
                        hedefSube: true,
                    }
                }
            }
        });

        if (!plan) throw new Error('Plan bulunamadı');
        if (plan.kalemler.length === 0) throw new Error('Planda kalem yok');

        // Tüm kalemlerin bakiyesini kontrol et
        for (const kalem of plan.kalemler) {
            const bakiye = await bakiyeHesapla(kalem.kaynakSubeId, kalem.stokKartId);
            if (bakiye < kalem.miktar) {
                throw new Error(
                    `Yetersiz stok: ${kalem.stokKart.ad} — Mevcut: ${bakiye}, Gereken: ${kalem.miktar}`
                );
            }
        }

        const tarih = new Date();

        await prisma.$transaction(async (tx) => {
            for (const kalem of plan.kalemler) {
                const aciklama = `[PLANLI TRANSFER] ${plan.ad}`;

                await tx.stokHareket.create({
                    data: {
                        tip: 'SUBE_TRANSFER_OUT',
                        miktar: kalem.miktar,
                        aciklama,
                        tarih,
                        stokKartId: kalem.stokKartId,
                        subeId: kalem.kaynakSubeId,
                    }
                });

                await tx.stokHareket.create({
                    data: {
                        tip: 'SUBE_TRANSFER_IN',
                        miktar: kalem.miktar,
                        aciklama,
                        tarih,
                        stokKartId: kalem.stokKartId,
                        subeId: kalem.hedefSubeId,
                    }
                });
            }

            await tx.planliTransfer.update({
                where: { id },
                data: { sonCalisma: tarih }
            });
        });

        return {
            mesaj: 'Transfer tamamlandı',
            plan: plan.ad,
            kalemSayisi: plan.kalemler.length,
        };
    },

    async zamanlanmisCalistir() {
        const simdi = new Date();
        const bugunGun = simdi.getDay();
        const simdikiSaat = simdi.getHours();
        const simdikiDakika = simdi.getMinutes();

        const planlar = await prisma.planliTransfer.findMany({
            where: { aktif: true },
            include: {
                kalemler: {
                    include: {
                        stokKart: true,
                        kaynakSube: true,
                        hedefSube: true,
                    }
                }
            }
        });

        const sonuclar = [];

        for (const plan of planlar) {
            const planGunler = plan.gunler.split(',').map(Number);
            if (!planGunler.includes(bugunGun)) continue;
            if (plan.saat !== simdikiSaat) continue;
            if (Math.abs(plan.dakika - simdikiDakika) > 2) continue;

            try {
                const sonuc = await this.hemenCalistir(plan.id, plan.tenantId);
                sonuclar.push({ basarili: true, ...sonuc });
            } catch (err) {
                sonuclar.push({ basarili: false, plan: plan.ad, hata: err.message });
            }
        }

        return sonuclar;
    }
};

module.exports = planliTransferService;