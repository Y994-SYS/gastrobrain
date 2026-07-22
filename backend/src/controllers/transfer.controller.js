const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

// Giriş sayılan stok hareket tipleri (bakiye hesabı için)
const GIRIS_TIPLER = new Set([
    'GIRIS_FATURA',
    'IADE_FATURA',
    'SUBE_TRANSFER_IN',
]);

// Yetersiz stok durumunu diğer hatalardan ayırmak için özel hata sınıfı
class YetersizStokError extends Error { }

// Belirli bir şubede bir stok kartının net bakiyesini hesaplar.
// `client` parametresi ile hem normal prisma instance'ı hem de bir
// transaction client'ı ($transaction callback'indeki `tx`) kabul eder.
const bakiyeHesapla = async (client, subeId, stokKartId) => {
    const hareketler = await client.stokHareket.groupBy({
        by: ['tip'],
        where: { subeId, stokKartId },
        _sum: { miktar: true },
    });

    return hareketler.reduce((toplam, h) => {
        const miktar = h._sum.miktar || 0;
        return toplam + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar);
    }, 0);
};

// GET /api/transfer/stoklar?subeId=X
// Seçili şubedeki stok kartlarını bakiyeleriyle döner
const subeStoklar = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const { subeId } = req.query; // Zod tarafından sayıya çevrilmiş ve pozitifliği doğrulanmış

        // Şubenin bu tenant'a ait olduğunu doğrula
        const sube = await prisma.sube.findFirst({
            where: { id: subeId, tenantId },
        });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });

        // Bu şubede hareketi olan stok kartlarını bul
        const hareketler = await prisma.stokHareket.groupBy({
            by: ['stokKartId', 'tip'],
            where: { subeId },
            _sum: { miktar: true },
        });

        // Kart bazında net bakiye hesapla
        const bakiyeMap = new Map();
        for (const h of hareketler) {
            const mevcut = bakiyeMap.get(h.stokKartId) || 0;
            const miktar = h._sum.miktar || 0;
            bakiyeMap.set(h.stokKartId, mevcut + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar));
        }

        // Bakiyesi > 0 olan kartların detaylarını getir
        const pozitifKartIdler = [...bakiyeMap.entries()]
            .filter(([, b]) => b > 0)
            .map(([id]) => id);

        if (pozitifKartIdler.length === 0) return res.json([]);

        const kartlar = await prisma.stokKart.findMany({
            where: { id: { in: pozitifKartIdler }, tenantId, aktif: true },
            include: { birim: true, kategori: true },
            orderBy: { ad: 'asc' },
        });

        const sonuc = kartlar.map(k => ({
            ...k,
            mevcutBakiye: Math.round((bakiyeMap.get(k.id) || 0) * 1000) / 1000,
        }));

        res.json(sonuc);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// POST /api/transfer
// { kaynakSubeId, hedefSubeId, stokKartId, miktar, aciklama? }
const transferYap = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const { kaynakSubeId, hedefSubeId, stokKartId, miktar, aciklama } = req.body;
        // Not: kaynakSubeId/hedefSubeId/stokKartId/miktar artık Zod tarafından
        // sayı tipine çevrilmiş, pozitifliği ve kaynak≠hedef kuralı doğrulanmış.

        // ── Tenant sahiplik kontrolleri ──────────────────────────
        const [kaynakSube, hedefSube, stokKart] = await Promise.all([
            prisma.sube.findFirst({ where: { id: kaynakSubeId, tenantId } }),
            prisma.sube.findFirst({ where: { id: hedefSubeId, tenantId } }),
            prisma.stokKart.findFirst({ where: { id: stokKartId, tenantId } }),
        ]);

        if (!kaynakSube) return res.status(404).json({ hata: 'Kaynak şube bulunamadı' });
        if (!hedefSube) return res.status(404).json({ hata: 'Hedef şube bulunamadı' });
        if (!stokKart) return res.status(404).json({ hata: 'Stok kartı bulunamadı' });

        const tarih = new Date();
        const aciklamaMetni = aciklama?.trim() ||
            `${kaynakSube.ad} → ${hedefSube.ad} transferi`;

        // ── Bakiye kontrolü + hareket kayıtları TEK bir serializable
        //    transaction içinde yapılır. Böylece iki eşzamanlı transfer
        //    isteği aynı stok kartını aynı anda kontrol edip ikisi de
        //    "yeterli bakiye var" sonucuna ulaşamaz — Postgres, çakışan
        //    işlemlerden birini otomatik olarak reddeder (P2034 hatası),
        //    biz de bunu kullanıcıya "tekrar dene" olarak döneriz.
        let sonuc;
        try {
            sonuc = await prisma.$transaction(async (tx) => {
                const mevcutBakiye = await bakiyeHesapla(tx, kaynakSubeId, stokKartId);
                if (mevcutBakiye < miktar) {
                    throw new YetersizStokError(
                        `Yetersiz stok. Mevcut: ${mevcutBakiye} ${stokKart.ad}`
                    );
                }

                const cikisHareket = await tx.stokHareket.create({
                    data: {
                        tip: 'SUBE_TRANSFER_OUT',
                        miktar,
                        aciklama: aciklamaMetni,
                        tarih,
                        stokKartId,
                        subeId: kaynakSubeId,
                    },
                });

                const girisHareket = await tx.stokHareket.create({
                    data: {
                        tip: 'SUBE_TRANSFER_IN',
                        miktar,
                        aciklama: aciklamaMetni,
                        tarih,
                        stokKartId,
                        subeId: hedefSubeId,
                    },
                });

                return { cikisHareket, girisHareket };
            }, {
                isolation: Prisma.TransactionIsolationLevel.Serializable,
                maxWait: 5000,
                timeout: 10000,
            });
        } catch (err) {
            if (err instanceof YetersizStokError) {
                return res.status(400).json({ hata: err.message });
            }
            // P2034: Prisma'nın serializable çakışması / write conflict kodu
            if (err.code === 'P2034') {
                return res.status(409).json({
                    hata: 'Bu stok kartı üzerinde eşzamanlı bir işlem tespit edildi. Lütfen tekrar deneyin.',
                });
            }
            throw err;
        }

        res.status(201).json({
            mesaj: 'Transfer tamamlandı',
            cikis: sonuc.cikisHareket,
            giris: sonuc.girisHareket,
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// GET /api/transfer/gecmis?subeId=X&limit=50
// Şubeye ait transfer hareketleri (IN + OUT)
const transferGecmisi = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const { subeId, limit } = req.query; // Zod tarafından doğrulanmış/dönüştürülmüş

        const where = {
            sube: { tenantId },
            tip: { in: ['SUBE_TRANSFER_IN', 'SUBE_TRANSFER_OUT'] },
            ...(subeId ? { subeId } : {}),
        };

        const hareketler = await prisma.stokHareket.findMany({
            where,
            include: {
                stokKart: { select: { ad: true, id: true } },
                sube: { select: { ad: true, id: true } },
            },
            orderBy: { tarih: 'desc' },
            take: limit,
        });

        res.json(hareketler);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { subeStoklar, transferYap, transferGecmisi };