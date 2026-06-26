const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Giriş sayılan stok hareket tipleri (bakiye hesabı için)
const GIRIS_TIPLER = new Set([
    'GIRIS_FATURA',
    'IADE_FATURA',
    'SUBE_TRANSFER_IN',
]);

// Belirli bir şubede bir stok kartının net bakiyesini hesaplar
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

// GET /api/transfer/stoklar?subeId=X
// Seçili şubedeki stok kartlarını bakiyeleriyle döner
const subeStoklar = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const subeId = parseInt(req.query.subeId);

        if (!subeId) return res.status(400).json({ hata: 'subeId zorunlu' });

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

        // ── Validasyon ──────────────────────────────────────────
        if (!kaynakSubeId || !hedefSubeId || !stokKartId || !miktar) {
            return res.status(400).json({ hata: 'kaynakSubeId, hedefSubeId, stokKartId ve miktar zorunlu' });
        }
        if (kaynakSubeId === hedefSubeId) {
            return res.status(400).json({ hata: 'Kaynak ve hedef şube aynı olamaz' });
        }
        if (miktar <= 0) {
            return res.status(400).json({ hata: 'Miktar sıfırdan büyük olmalı' });
        }

        // ── Tenant sahiplik kontrolleri ──────────────────────────
        const [kaynakSube, hedefSube, stokKart] = await Promise.all([
            prisma.sube.findFirst({ where: { id: parseInt(kaynakSubeId), tenantId } }),
            prisma.sube.findFirst({ where: { id: parseInt(hedefSubeId), tenantId } }),
            prisma.stokKart.findFirst({ where: { id: parseInt(stokKartId), tenantId } }),
        ]);

        if (!kaynakSube) return res.status(404).json({ hata: 'Kaynak şube bulunamadı' });
        if (!hedefSube) return res.status(404).json({ hata: 'Hedef şube bulunamadı' });
        if (!stokKart) return res.status(404).json({ hata: 'Stok kartı bulunamadı' });

        // ── Bakiye yeterlilik kontrolü ───────────────────────────
        const mevcutBakiye = await bakiyeHesapla(parseInt(kaynakSubeId), parseInt(stokKartId));
        if (mevcutBakiye < miktar) {
            return res.status(400).json({
                hata: `Yetersiz stok. Mevcut: ${mevcutBakiye} ${stokKart.ad}`,
            });
        }

        // ── Transaction: OUT + IN aynı anda ─────────────────────
        const tarih = new Date();
        const aciklamaMetni = aciklama?.trim() ||
            `${kaynakSube.ad} → ${hedefSube.ad} transferi`;

        const [cikisHareket, girisHareket] = await prisma.$transaction([
            // Kaynak şubeden çıkış
            prisma.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_OUT',
                    miktar: parseFloat(miktar),
                    aciklama: aciklamaMetni,
                    tarih,
                    stokKartId: parseInt(stokKartId),
                    subeId: parseInt(kaynakSubeId),
                },
            }),
            // Hedef şubeye giriş
            prisma.stokHareket.create({
                data: {
                    tip: 'SUBE_TRANSFER_IN',
                    miktar: parseFloat(miktar),
                    aciklama: aciklamaMetni,
                    tarih,
                    stokKartId: parseInt(stokKartId),
                    subeId: parseInt(hedefSubeId),
                },
            }),
        ]);

        res.status(201).json({
            mesaj: 'Transfer tamamlandı',
            cikis: cikisHareket,
            giris: girisHareket,
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
        const subeId = req.query.subeId ? parseInt(req.query.subeId) : null;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);

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