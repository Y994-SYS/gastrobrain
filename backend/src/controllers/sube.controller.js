const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Türkiye saatiyle (UTC+3) bugünün başlangıcını döner
const bugunBaslangicTR = () => {
    const now = new Date();
    // UTC+3 offset: 3 saat * 60 dk * 60 sn * 1000 ms
    const trOffset = 3 * 60 * 60 * 1000;
    const trNow = new Date(now.getTime() + trOffset);

    // TR saatiyle gün başlangıcı (00:00:00.000)
    const trBaslangic = new Date(Date.UTC(
        trNow.getUTCFullYear(),
        trNow.getUTCMonth(),
        trNow.getUTCDate(),
        0, 0, 0, 0
    ));

    // Geri UTC'ye çevir (DB UTC saklar)
    return new Date(trBaslangic.getTime() - trOffset);
};

// Giriş sayılan stok hareket tipleri
const GIRIS_TIPLER = new Set([
    'GIRIS_FATURA',
    'IADE_FATURA',
    'SUBE_TRANSFER_IN',
]);

const hepsiniGetir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const bugun = bugunBaslangicTR();

        // 1) Şubeler + sayımlar
        const subeler = await prisma.sube.findMany({
            where: { tenantId },
            include: {
                _count: { select: { kullanicilar: true, personeller: true } },
            },
            orderBy: { id: 'asc' },
        });

        if (subeler.length === 0) return res.json([]);

        const subeIdler = subeler.map(s => s.id);

        // 2) Bugünkü satış toplamı — şube bazında
        const satisToplam = await prisma.satis.groupBy({
            by: ['subeId'],
            where: {
                subeId: { in: subeIdler },
                tarih: { gte: bugun },
            },
            _sum: { toplam: true },
        });

        const satisMap = new Map(
            satisToplam.map(s => [s.subeId, s._sum.toplam || 0])
        );

        // 3) minStok > 0 olan aktif stok kartları
        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId, minStok: { gt: 0 }, aktif: true },
            select: { id: true, minStok: true },
        });

        const kritikMap = new Map(subeIdler.map(id => [id, 0]));

        if (stokKartlari.length > 0) {
            const kartIdler = stokKartlari.map(k => k.id);
            const minStokMap = new Map(stokKartlari.map(k => [k.id, k.minStok]));

            // 4) Bu kartların tüm zamanlar stok hareketleri — şube + kart + tip bazında
            const hareketler = await prisma.stokHareket.groupBy({
                by: ['subeId', 'stokKartId', 'tip'],
                where: {
                    subeId: { in: subeIdler },
                    stokKartId: { in: kartIdler },
                },
                _sum: { miktar: true },
            });

            // 5) Şube + kart bazında net bakiye: giriş tipleri +, çıkış tipleri -
            // Yapı: { subeId -> Map<stokKartId, netBakiye> }
            const bakiyeMap = new Map();

            for (const h of hareketler) {
                if (!bakiyeMap.has(h.subeId)) {
                    bakiyeMap.set(h.subeId, new Map());
                }
                const kartMap = bakiyeMap.get(h.subeId);
                const mevcut = kartMap.get(h.stokKartId) || 0;
                const miktar = h._sum.miktar || 0;
                const carpan = GIRIS_TIPLER.has(h.tip) ? 1 : -1;
                kartMap.set(h.stokKartId, mevcut + carpan * miktar);
            }

            // 6) Her şube için kritik stok sayısı (bakiye <= minStok)
            for (const [subeId, kartMap] of bakiyeMap.entries()) {
                let kritik = 0;
                for (const [kartId, bakiye] of kartMap.entries()) {
                    const min = minStokMap.get(kartId);
                    if (min !== undefined && bakiye <= min) kritik++;
                }
                kritikMap.set(subeId, kritik);
            }
        }

        // 7) Şubelere özet verileri ekle
        const sonuc = subeler.map(sube => ({
            ...sube,
            bugunSatis: satisMap.get(sube.id) || 0,
            kritikStok: kritikMap.get(sube.id) || 0,
        }));

        res.json(sonuc);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const tekiniGetir = async (req, res) => {
    try {
        const sube = await prisma.sube.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.kullanici.tenantId,
            },
            include: {
                _count: { select: { kullanicilar: true, personeller: true } },
            },
        });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });
        res.json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const olustur = async (req, res) => {
    try {
        const { ad, adres, telefon } = req.body;
        if (!ad) return res.status(400).json({ hata: 'Şube adı zorunlu' });
        const sube = await prisma.sube.create({
            data: { ad, adres, telefon, tenantId: req.kullanici.tenantId },
        });
        res.status(201).json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const guncelle = async (req, res) => {
    try {
        const mevcut = await prisma.sube.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.kullanici.tenantId,
            },
        });
        if (!mevcut) return res.status(404).json({ hata: 'Şube bulunamadı' });

        const { ad, adres, telefon, aktif } = req.body;
        const sube = await prisma.sube.update({
            where: { id: parseInt(req.params.id) },
            data: { ad, adres, telefon, aktif },
        });
        res.json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { hepsiniGetir, tekiniGetir, olustur, guncelle };