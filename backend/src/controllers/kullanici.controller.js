const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const auditLog = require('../services/auditLog.service');
const prisma = new PrismaClient();

// Bu controller üzerinden ATANABİLECEK roller — bilerek sınırlı tutuluyor.
// SUPER_ADMIN buraya YOK: süper admin hesapları sadece ops scriptleriyle,
// tenant dışında oluşturulur. Bir TENANT_ADMIN'in kendi firmasından
// SUPER_ADMIN yaratabilmesi ciddi bir yetki yükseltme açığı olurdu.
const ATANABILIR_ROLLER = ['TENANT_ADMIN', 'MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

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

        const istenenRol = rol || 'PERSONEL';
        if (!ATANABILIR_ROLLER.includes(istenenRol)) {
            return res.status(403).json({ hata: 'Bu rol atanamaz' });
        }

        const mevcutKullanici = await prisma.kullanici.findUnique({
            where: { email_tenantId: { email, tenantId: req.kullanici.tenantId } }
        });
        if (mevcutKullanici) return res.status(400).json({ hata: 'Bu email zaten kayıtlı' });

        const sifreHash = await bcrypt.hash(sifre, 10);
        const kullanici = await prisma.kullanici.create({
            data: {
                ad, email, sifre: sifreHash,
                rol: istenenRol,
                subeId: subeId || null,
                tenantId: req.kullanici.tenantId
            },
            select: { id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true },
        });

        await auditLog.kaydet({
            eylem: 'KULLANICI_EKLE',
            detay: { ad, email, rol: istenenRol },
            kullaniciId: req.kullanici.id,
            tenantId: req.kullanici.tenantId,
            ip: req.ip
        });

        res.status(201).json(kullanici);
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const guncelle = async (req, res) => {
    try {
        const mevcut = await prisma.kullanici.findFirst({
            where: { id: parseInt(req.params.id), tenantId: req.kullanici.tenantId }
        });
        if (!mevcut) return res.status(404).json({ hata: 'Kullanıcı bulunamadı' });

        const { ad, email, sifre, rol, subeId, aktif } = req.body;

        if (rol && !ATANABILIR_ROLLER.includes(rol)) {
            return res.status(403).json({ hata: 'Bu rol atanamaz' });
        }

        const data = { ad, email, rol, aktif, subeId: subeId || null };
        if (sifre) data.sifre = await bcrypt.hash(sifre, 10);

        const kullanici = await prisma.kullanici.update({
            where: { id: parseInt(req.params.id) },
            data,
            select: { id: true, ad: true, email: true, rol: true, aktif: true, createdAt: true },
        });

        await auditLog.kaydet({
            eylem: 'KULLANICI_GUNCELLE',
            detay: { kullaniciId: parseInt(req.params.id), ad, rol, aktif },
            kullaniciId: req.kullanici.id,
            tenantId: req.kullanici.tenantId,
            ip: req.ip
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

        const mevcut = await prisma.kullanici.findFirst({
            where: { id, tenantId: req.kullanici.tenantId }
        });
        if (!mevcut) return res.status(404).json({ hata: 'Kullanıcı bulunamadı' });

        await prisma.kullanici.delete({ where: { id } });

        await auditLog.kaydet({
            eylem: 'KULLANICI_SIL',
            detay: { silinen: { id: mevcut.id, ad: mevcut.ad, email: mevcut.email } },
            kullaniciId: req.kullanici.id,
            tenantId: req.kullanici.tenantId,
            ip: req.ip
        });

        res.json({ mesaj: 'Kullanıcı silindi' });
    } catch (err) {
        res.status(500).json({ hata: err.message });
    }
};

const profilGuncelle = async (req, res) => {
    try {
        const { ad } = req.body;
        if (!ad?.trim()) return res.status(400).json({ basarili: false, mesaj: 'Ad boş olamaz' });
        const kullanici = await prisma.kullanici.update({
            where: { id: req.kullanici.id },
            data: { ad },
            select: { id: true, ad: true, email: true, rol: true }
        });
        res.json({ basarili: true, data: kullanici });
    } catch (e) {
        res.status(500).json({ basarili: false, mesaj: e.message });
    }
};

const sifreDegistir = async (req, res) => {
    try {
        const { mevcutSifre, yeniSifre } = req.body;
        if (!mevcutSifre || !yeniSifre) return res.status(400).json({ basarili: false, mesaj: 'Tüm alanları doldurun' });
        if (yeniSifre.length < 6) return res.status(400).json({ basarili: false, mesaj: 'Şifre en az 6 karakter olmalı' });

        const kullanici = await prisma.kullanici.findUnique({ where: { id: req.kullanici.id } });
        const dogru = await bcrypt.compare(mevcutSifre, kullanici.sifre);
        if (!dogru) return res.status(400).json({ basarili: false, mesaj: 'Mevcut şifre hatalı' });

        const hash = await bcrypt.hash(yeniSifre, 10);
        await prisma.kullanici.update({ where: { id: req.kullanici.id }, data: { sifre: hash } });

        await auditLog.kaydet({
            eylem: 'SIFRE_DEGISTIR',
            detay: null,
            kullaniciId: req.kullanici.id,
            tenantId: req.kullanici.tenantId,
            ip: req.ip
        });

        res.json({ basarili: true, mesaj: 'Şifre güncellendi' });
    } catch (e) {
        res.status(500).json({ basarili: false, mesaj: e.message });
    }
};

module.exports = { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir };