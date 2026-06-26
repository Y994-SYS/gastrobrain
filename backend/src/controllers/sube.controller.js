const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Türkiye saatiyle (UTC+3) bugünün başlangıcını döner
const bugunBaslangicTR = () => {
    const now = new Date();
    const trOffset = 3 * 60 * 60 * 1000;
    const trNow = new Date(now.getTime() + trOffset);
    const trBaslangic = new Date(Date.UTC(
        trNow.getUTCFullYear(),
        trNow.getUTCMonth(),
        trNow.getUTCDate(),
        0, 0, 0, 0
    ));
    return new Date(trBaslangic.getTime() - trOffset);
};

// Giriş sayılan stok hareket tipleri
const GIRIS_TIPLER = new Set([
    'GIRIS_FATURA',
    'IADE_FATURA',
    'SUBE_TRANSFER_IN',
]);

// ─── hepsiniGetir ─────────────────────────────────────────────────────────────
const hepsiniGetir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const bugun = bugunBaslangicTR();

        const subeler = await prisma.sube.findMany({
            where: { tenantId },
            include: {
                _count: { select: { kullanicilar: true, personeller: true } },
            },
            orderBy: { id: 'asc' },
        });

        if (subeler.length === 0) return res.json([]);

        const subeIdler = subeler.map(s => s.id);

        const satisToplam = await prisma.satis.groupBy({
            by: ['subeId'],
            where: { subeId: { in: subeIdler }, tarih: { gte: bugun } },
            _sum: { toplam: true },
        });
        const satisMap = new Map(satisToplam.map(s => [s.subeId, s._sum.toplam || 0]));

        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId, minStok: { gt: 0 }, aktif: true },
            select: { id: true, minStok: true },
        });
        const kritikMap = new Map(subeIdler.map(id => [id, 0]));

        if (stokKartlari.length > 0) {
            const kartIdler = stokKartlari.map(k => k.id);
            const minStokMap = new Map(stokKartlari.map(k => [k.id, k.minStok]));

            const hareketler = await prisma.stokHareket.groupBy({
                by: ['subeId', 'stokKartId', 'tip'],
                where: { subeId: { in: subeIdler }, stokKartId: { in: kartIdler } },
                _sum: { miktar: true },
            });

            const bakiyeMap = new Map();
            for (const h of hareketler) {
                if (!bakiyeMap.has(h.subeId)) bakiyeMap.set(h.subeId, new Map());
                const kartMap = bakiyeMap.get(h.subeId);
                const mevcut = kartMap.get(h.stokKartId) || 0;
                const miktar = h._sum.miktar || 0;
                kartMap.set(h.stokKartId, mevcut + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar));
            }

            for (const [subeId, kartMap] of bakiyeMap.entries()) {
                let kritik = 0;
                for (const [kartId, bakiye] of kartMap.entries()) {
                    const min = minStokMap.get(kartId);
                    if (min !== undefined && bakiye <= min) kritik++;
                }
                kritikMap.set(subeId, kritik);
            }
        }

        res.json(subeler.map(sube => ({
            ...sube,
            bugunSatis: satisMap.get(sube.id) || 0,
            kritikStok: kritikMap.get(sube.id) || 0,
        })));
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── tekiniGetir ──────────────────────────────────────────────────────────────
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

// ─── detayGetir — YENİ ────────────────────────────────────────────────────────
// GET /api/subeler/:id/detay
const detayGetir = async (req, res) => {
    try {
        const tenantId = req.kullanici.tenantId;
        const subeId = parseInt(req.params.id);
        const bugun = bugunBaslangicTR();

        const sube = await prisma.sube.findFirst({
            where: { id: subeId, tenantId },
            include: { _count: { select: { kullanicilar: true, personeller: true } } },
        });
        if (!sube) return res.status(404).json({ hata: 'Şube bulunamadı' });

        // Bugün satış özeti
        const bugunSatislar = await prisma.satis.aggregate({
            where: { subeId, tarih: { gte: bugun } },
            _sum: { toplam: true },
            _count: { id: true },
        });

        // Bu ay satış özeti
        const ayBaslangic = new Date(bugun);
        ayBaslangic.setDate(1);
        const buAySatislar = await prisma.satis.aggregate({
            where: { subeId, tarih: { gte: ayBaslangic } },
            _sum: { toplam: true },
            _count: { id: true },
        });

        // Son 10 satış
        const sonSatislar = await prisma.satis.findMany({
            where: { subeId },
            include: { recete: { select: { ad: true } } },
            orderBy: { tarih: 'desc' },
            take: 10,
        });

        // Stok durumu — bu şubeye ait bakiyeler
        const stokKartlari = await prisma.stokKart.findMany({
            where: { tenantId, aktif: true },
            include: { birim: true, kategori: true },
            orderBy: { ad: 'asc' },
        });

        const stokHareketleri = await prisma.stokHareket.groupBy({
            by: ['stokKartId', 'tip'],
            where: { subeId },
            _sum: { miktar: true },
        });

        const bakiyeMap = new Map();
        for (const h of stokHareketleri) {
            const mevcut = bakiyeMap.get(h.stokKartId) || 0;
            const miktar = h._sum.miktar || 0;
            bakiyeMap.set(h.stokKartId, mevcut + (GIRIS_TIPLER.has(h.tip) ? miktar : -miktar));
        }

        const stokDurumu = stokKartlari
            .map(k => ({
                ...k,
                mevcutStok: Math.round((bakiyeMap.get(k.id) || 0) * 1000) / 1000,
                kritik: (bakiyeMap.get(k.id) || 0) <= k.minStok && k.minStok > 0,
            }))
            .filter(k => k.mevcutStok > 0 || k.minStok > 0);

        // Personel listesi
        const personeller = await prisma.personel.findMany({
            where: { subeId, tenantId, aktif: true },
            select: {
                id: true, ad: true, soyad: true,
                telefon: true, baslangicTarihi: true, maas: true,
            },
            orderBy: { ad: 'asc' },
        });

        // Son 20 transfer
        const sonTransferler = await prisma.stokHareket.findMany({
            where: {
                subeId,
                tip: { in: ['SUBE_TRANSFER_IN', 'SUBE_TRANSFER_OUT'] },
            },
            include: { stokKart: { select: { ad: true } } },
            orderBy: { tarih: 'desc' },
            take: 20,
        });

        res.json({
            sube,
            ozet: {
                bugunSatisToplam: bugunSatislar._sum.toplam || 0,
                bugunSatisAdet: bugunSatislar._count.id || 0,
                buAySatisToplam: buAySatislar._sum.toplam || 0,
                buAySatisAdet: buAySatislar._count.id || 0,
                toplamStokKalem: stokDurumu.length,
                kritikStokSayisi: stokDurumu.filter(s => s.kritik).length,
                personelSayisi: personeller.length,
            },
            sonSatislar,
            stokDurumu,
            personeller,
            sonTransferler,
        });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

// ─── olustur ──────────────────────────────────────────────────────────────────
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

// ─── guncelle ─────────────────────────────────────────────────────────────────
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

module.exports = { hepsiniGetir, tekiniGetir, detayGetir, olustur, guncelle };