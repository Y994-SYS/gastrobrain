const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Giriş tipleri — bakiyeye eklenir
const GIRIS_TIPLER = new Set([
    'GIRIS_FATURA',
    'SUBE_TRANSFER_IN',
]);

// Çıkış tipleri — bakiyeden düşülür
const CIKIS_TIPLER = new Set([
    'IADE_FATURA',
    'SATIS',
    'ZAYI',
    'TUKETIM',
    'SUBE_TRANSFER_OUT',
]);

// AY_SONU_SAYIM özel: fark hareketi olarak kaydedilir.
// Fark pozitifse miktar pozitif (giriş gibi), negatifse miktar Math.abs() ile
// kaydedilip negatif işlenmesi gerekir. Acıklama içindeki fark işaretine bakılır.
// Daha temiz çözüm: AY_SONU_SAYIM her zaman "hedef miktar" olarak işlenir —
// mevcut stoku sıfırlar ve yeni miktarı ekler. Bunun için ayrı hesaplama gerekir.
// Şimdilik: acıklamadaki fark işaretine göre giriş/çıkış say.
const bakiyeHesapla = (hareketler) => {
    return hareketler.reduce((toplam, h) => {
        if (GIRIS_TIPLER.has(h.tip)) return toplam + h.miktar;
        if (CIKIS_TIPLER.has(h.tip)) return toplam - h.miktar;
        if (h.tip === 'AY_SONU_SAYIM') {
            // acıklama "fark: +X" ya da "fark: -X" içerir
            const eslesme = h.aciklama?.match(/fark:\s*([+-]?\d+(\.\d+)?)/);
            if (eslesme) return toplam + Number(eslesme[1]);
            // acıklama yoksa pozitif say (eski davranış)
            return toplam + h.miktar;
        }
        return toplam;
    }, 0);
};

const getSubeId = async (subeId, tenantId) => {
    if (subeId) {
        const sube = await prisma.sube.findFirst({ where: { id: Number(subeId), tenantId } });
        if (!sube) throw new Error('Şube bulunamadı');
        return sube.id;
    }
    const ilkSube = await prisma.sube.findFirst({ where: { tenantId } });
    if (!ilkSube) throw new Error('Şube bulunamadı');
    return ilkSube.id;
};

const stokService = {

    async hareketleriGetir(stokKartId, tenantId) {
        return prisma.stokHareket.findMany({
            where: {
                ...(stokKartId ? { stokKartId: Number(stokKartId) } : {}),
                stokKart: { tenantId }
            },
            include: { stokKart: { include: { birim: true } }, sube: true },
            orderBy: { tarih: 'desc' },
            take: 100
        });
    },

    async mevcutStokGetir(stokKartId, subeId, tenantId) {
        const where = {
            stokKartId: Number(stokKartId),
            stokKart: { tenantId },
            ...(subeId ? { subeId: Number(subeId) } : {})
        };
        const hareketler = await prisma.stokHareket.findMany({ where });
        return bakiyeHesapla(hareketler);
    },

    async tumStokDurumu(subeId, tenantId) {
        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId },
            include: { birim: true, kategori: true }
        });

        // Tüm hareketleri tek sorguda çek — N+1 önlemi
        const hareketler = await prisma.stokHareket.findMany({
            where: {
                stokKart: { tenantId },
                ...(subeId ? { subeId: Number(subeId) } : {})
            }
        });

        // Kart bazında grupla
        const kartHareketMap = new Map();
        for (const h of hareketler) {
            if (!kartHareketMap.has(h.stokKartId)) {
                kartHareketMap.set(h.stokKartId, []);
            }
            kartHareketMap.get(h.stokKartId).push(h);
        }

        return stokKartlari.map(kart => {
            const kartHareketleri = kartHareketMap.get(kart.id) || [];
            const miktar = bakiyeHesapla(kartHareketleri);
            return { ...kart, mevcutStok: miktar, kritik: miktar <= kart.minStok };
        });
    },

    async girisFaturasiEkle({ stokKartId, subeId, miktar, birimFiyat, aciklama, tarih, cariKartId }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        if (cariKartId) {
            const cari = await prisma.cariKart.findFirst({ where: { id: Number(cariKartId), tenantId } });
            if (!cari) throw new Error('Cari kart bulunamadı');
        }

        return prisma.$transaction(async (tx) => {
            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'GIRIS_FATURA',
                    miktar: Number(miktar),
                    birimFiyat: Number(birimFiyat),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });

            if (cariKartId) {
                await tx.cariHareket.create({
                    data: {
                        tip: 'BORC',
                        tutar: Number(miktar) * Number(birimFiyat),
                        aciklama: aciklama || 'Giriş faturası',
                        tarih: tarih ? new Date(tarih) : new Date(),
                        cariKartId: Number(cariKartId),
                    }
                });
            }

            return hareket;
        });
    },

    async iadeFaturasiEkle({ stokKartId, subeId, miktar, birimFiyat, aciklama, tarih, cariKartId }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        return prisma.$transaction(async (tx) => {
            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'IADE_FATURA',
                    miktar: Number(miktar),
                    birimFiyat: Number(birimFiyat),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });

            if (cariKartId) {
                await tx.cariHareket.create({
                    data: {
                        tip: 'ALACAK',
                        tutar: Number(miktar) * Number(birimFiyat),
                        aciklama: aciklama || 'İade faturası',
                        tarih: tarih ? new Date(tarih) : new Date(),
                        cariKartId: Number(cariKartId),
                    }
                });
            }

            return hareket;
        });
    },

    async zayiEkle({ stokKartId, subeId, miktar, aciklama, tarih }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        const mevcutStok = await stokService.mevcutStokGetir(stokKartId, gercekSubeId, tenantId);
        if (mevcutStok < Number(miktar)) {
            throw new Error(`Yetersiz stok: ${stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, girilen: ${miktar})`);
        }

        return prisma.stokHareket.create({
            data: {
                tip: 'ZAYI',
                miktar: Number(miktar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
                stokKartId: Number(stokKartId),
                subeId: gercekSubeId,
            }
        });
    },

    async tuketimEkle({ stokKartId, subeId, miktar, aciklama, tarih }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        const mevcutStok = await stokService.mevcutStokGetir(stokKartId, gercekSubeId, tenantId);
        if (mevcutStok < Number(miktar)) {
            throw new Error(`Yetersiz stok: ${stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, girilen: ${miktar})`);
        }

        return prisma.stokHareket.create({
            data: {
                tip: 'TUKETIM',
                miktar: Number(miktar),
                aciklama,
                tarih: tarih ? new Date(tarih) : new Date(),
                stokKartId: Number(stokKartId),
                subeId: gercekSubeId,
            }
        });
    },

    async aySonuSayimEkle({ stokKartId, subeId, sayimMiktari, aciklama }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        return prisma.$transaction(async (tx) => {
            const mevcutStok = await stokService.mevcutStokGetir(stokKartId, gercekSubeId, tenantId);
            const fark = Number(sayimMiktari) - mevcutStok;

            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'AY_SONU_SAYIM',
                    miktar: Math.abs(fark),
                    aciklama: aciklama || `Ay sonu sayım — fark: ${fark > 0 ? '+' : ''}${fark.toFixed(2)}`,
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });

            return { hareket, mevcutStok, sayimMiktari: Number(sayimMiktari), fark };
        });
    }
};

module.exports = stokService;