const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const hepsiniGetir = async (req, res) => {
    try {
        const kullanicilar = await prisma.kullanici.findMany({
            where: { tenantId: req.kullanici.tenantId },
            select: {
                id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true,
                sube: { select: { id: true, ad: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(kullanicilar);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const olustur = async (req, res) => {
    try {
        const { ad, email, sifre, rol, subeId } = req.body;
        if (!ad || !email || !sifre) return res.status(400).json({ hata: 'Ad, email ve şifre zorunlu' });

        const mevcutKullanici = await prisma.kullanici.findUnique({
            where: { email_tenantId: { email, tenantId: req.kullanici.tenantId } }
        });
        if (mevcutKullanici) return res.status(400).json({ hata: 'Bu email zaten kayıtlı' });

        const sifreHash = await bcrypt.hash(sifre, 10);
        const kullanici = await prisma.kullanici.create({
            data: {
                ad, email, sifre: sifreHash,
                rol: rol || 'PERSONEL',
                subeId: subeId || null,
                tenantId: req.kullanici.tenantId
            },
            select: { id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true },
        });
        res.status(201).json(kullanici);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const guncelle = async (req, res) => {
    try {
        // Bu tenant'a ait olduğunu doğrula
        const mevcut = await prisma.kullanici.findFirst({
            where: { id: parseInt(req.params.id), tenantId: req.kullanici.tenantId }
        });
        if (!mevcut) return res.status(404).json({ hata: 'Kullanıcı bulunamadı' });

        const { ad, email, sifre, rol, subeId, aktif } = req.body;
        const data = { ad, email, rol, aktif, subeId: subeId || null };
        if (sifre) data.sifre = await bcrypt.hash(sifre, 10);

        const kullanici = await prisma.kullanici.update({
            where: { id: parseInt(req.params.id) },
            data,
            select: { id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true },
        });
        res.json(kullanici);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const sil = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.kullanici.id === id) return res.status(400).json({ hata: 'Kendinizi silemezsiniz' });

        // Bu tenant'a ait olduğunu doğrula
        const mevcut = await prisma.kullanici.findFirst({
            where: { id, tenantId: req.kullanici.tenantId }
        });
        if (!mevcut) return res.status(404).json({ hata: 'Kullanıcı bulunamadı' });

        await prisma.kullanici.delete({ where: { id } });
        res.json({ mesaj: 'Kullanıcı silindi' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

module.exports = { hepsiniGetir, olustur, guncelle, sil };