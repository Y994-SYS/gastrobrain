const { PrismaClient, Prisma } = require('@prisma/client');
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

// Yetersiz stok durumunu diğer hatalardan ayırmak için özel hata sınıfı
class YetersizStokError extends Error { }

// AY_SONU_SAYIM özel: fark hareketi olarak kaydedilir.
// Fark pozitifse miktar pozitif (giriş gibi), negatifse miktar Math.abs() ile
// kaydedilip negatif işlenmesi gerekir. Acıklama içindeki fark işaretine bakılır.
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

// Bakiye hesaplama artık hem normal prisma instance'ı hem de bir transaction
// client'ı ($transaction callback'indeki `tx`) kabul ediyor — böylece
// zayiEkle/tuketimEkle gibi fonksiyonlarda "bakiyeyi oku, sonra yaz" işlemi
// TEK bir transaction içinde atomik olarak yapılabiliyor (TOCTOU önlemi).
const mevcutStokHesapla = async (client, stokKartId, subeId, tenantId) => {
    const where = {
        stokKartId: Number(stokKartId),
        stokKart: { tenantId },
        ...(subeId ? { subeId: Number(subeId) } : {})
    };
    const hareketler = await client.stokHareket.findMany({ where });
    return bakiyeHesapla(hareketler);
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

    YetersizStokError, // controller'ın `instanceof` ile ayırt edebilmesi için export edildi

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
        return mevcutStokHesapla(prisma, stokKartId, subeId, tenantId);
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

    // GÜVENLİK DÜZELTMESİ: Bakiye kontrolü ile kayıt oluşturma artık TEK bir
    // serializable transaction içinde yapılıyor (transfer.controller.js'deki
    // düzeltmeyle aynı desen). Öncesinde iki eşzamanlı zayi isteği aynı stok
    // kartını kontrol edip ikisi de "yeterli" görüp stoku negatife
    // düşürebiliyordu (TOCTOU race condition).
    async zayiEkle({ stokKartId, subeId, miktar, aciklama, tarih }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        return prisma.$transaction(async (tx) => {
            const mevcutStok = await mevcutStokHesapla(tx, stokKartId, gercekSubeId, tenantId);
            if (mevcutStok < Number(miktar)) {
                throw new YetersizStokError(
                    `Yetersiz stok: ${stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, girilen: ${miktar})`
                );
            }

            return tx.stokHareket.create({
                data: {
                    tip: 'ZAYI',
                    miktar: Number(miktar),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });
        }, {
            isolation: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
        });
    },

    // Aynı düzeltme tuketimEkle için de uygulandı.
    async tuketimEkle({ stokKartId, subeId, miktar, aciklama, tarih }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        return prisma.$transaction(async (tx) => {
            const mevcutStok = await mevcutStokHesapla(tx, stokKartId, gercekSubeId, tenantId);
            if (mevcutStok < Number(miktar)) {
                throw new YetersizStokError(
                    `Yetersiz stok: ${stokKart.ad} (mevcut: ${mevcutStok.toFixed(2)}, girilen: ${miktar})`
                );
            }

            return tx.stokHareket.create({
                data: {
                    tip: 'TUKETIM',
                    miktar: Number(miktar),
                    aciklama,
                    tarih: tarih ? new Date(tarih) : new Date(),
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });
        }, {
            isolation: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
        });
    },

    // DÜZELTME (fark bug): Frontend'den her zaman sabit bir aciklama
    // ('Ay sonu sayım') geldiği için `aciklama || fallback-metin` ifadesi hep
    // sol tarafı seçiyordu — "fark: ±X" hiç kaydedilmiyordu. bakiyeHesapla bu
    // deseni bulamayınca miktarı HER ZAMAN pozitif sayıyordu (eski davranış
    // fallback'i), bu da negatif farkların bile bakiyeye eklenmesine yol
    // açıyordu (örn. 125 sistemde, 5 sayıldı, fark -120 iken sonuç 245
    // çıkıyordu). Artık kullanıcının açıklaması varsa KORUNUYOR ama fark
    // bilgisi her zaman sona ekleniyor, üzerine yazılmıyor.
    //
    // mevcutStok da (önceki düzeltmeyle aynı şekilde) `prisma` yerine `tx`
    // üzerinden okunuyor ki "oku sonra hesapla" adımı transaction'ın
    // tutarlılık garantisinden faydalansın.
    async aySonuSayimEkle({ stokKartId, subeId, sayimMiktari, aciklama }, tenantId) {
        const stokKart = await prisma.stokKart.findFirst({ where: { id: Number(stokKartId), tenantId } });
        if (!stokKart) throw new Error('Stok kartı bulunamadı');

        const gercekSubeId = await getSubeId(subeId, tenantId);

        return prisma.$transaction(async (tx) => {
            const mevcutStok = await mevcutStokHesapla(tx, stokKartId, gercekSubeId, tenantId);
            const fark = Number(sayimMiktari) - mevcutStok;
            const farkMetni = `fark: ${fark > 0 ? '+' : ''}${fark.toFixed(2)}`;
            const temelAciklama = (aciklama && aciklama.trim()) || 'Ay sonu sayım';

            const hareket = await tx.stokHareket.create({
                data: {
                    tip: 'AY_SONU_SAYIM',
                    miktar: Math.abs(fark),
                    aciklama: `${temelAciklama} — ${farkMetni}`,
                    stokKartId: Number(stokKartId),
                    subeId: gercekSubeId,
                }
            });

            return { hareket, mevcutStok, sayimMiktari: Number(sayimMiktari), fark };
        }, {
            isolation: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5000,
            timeout: 10000,
        });
    }
};

module.exports = stokService;