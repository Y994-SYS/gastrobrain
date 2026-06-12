const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hepsiniGetir = async (req, res) => {
    try {
        const subeler = await prisma.sube.findMany({
            where: { tenantId: req.kullanici.tenantId },
            include: {
                _count: { select: { kullanicilar: true, personeller: true } },
            },
            orderBy: { id: 'asc' },
        });
        res.json(subeler);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const tekiniGetir = async (req, res) => {
    try {
        const sube = await prisma.sube.findFirst({
            where: { id: parseInt(req.params.id), tenantId: req.kullanici.tenantId },
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
            data: { ad, adres, telefon, tenantId: req.kullanici.tenantId }
        });
        res.status(201).json(sube);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const guncelle = async (req, res) => {
    try {
        // Önce bu tenant'a ait olduğunu doğrula
        const mevcut = await prisma.sube.findFirst({
            where: { id: parseInt(req.params.id), tenantId: req.kullanici.tenantId }
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