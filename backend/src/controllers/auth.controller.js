const authService = require('../services/auth.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authController = {

    async kayitOl(req, res) {
        try {
            const kullanici = await authService.kayitOl(req.body);
            res.status(201).json({ basarili: true, data: kullanici });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async girisYap(req, res) {
        try {
            const sonuc = await authService.girisYap(req.body);
            res.json({ basarili: true, data: sonuc });
        } catch (error) {
            res.status(401).json({ basarili: false, mesaj: error.message });
        }
    },

    async sifreSifirlamaTalep(req, res) {
        try {
            const sonuc = await authService.sifreSifirlamaTalep(req.body);
            res.json({ basarili: true, mesaj: sonuc.mesaj });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sifreSifirla(req, res) {
        try {
            const sonuc = await authService.sifreSifirla(req.body);
            res.json({ basarili: true, mesaj: sonuc.mesaj });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async beniKontrolEt(req, res) {
        res.json({ basarili: true, data: req.kullanici });
    },

    async kayitFirma(req, res) {
        try {
            const sonuc = await authService.kayitFirma(req.body);
            res.status(201).json({ basarili: true, data: sonuc });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async tenantListesiGetir(req, res) {
        try {
            const sonuc = await authService.tenantListesiGetir(req.body);
            res.json({ basarili: true, data: sonuc });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async lisansDurum(req, res) {
        try {
            const tenant = await prisma.tenant.findUnique({
                where: { id: req.kullanici.tenantId },
                select: { lisansBitis: true }
            });
            if (!tenant?.lisansBitis) return res.json({ basarili: true, data: { kalanGun: 999 } });
            const bugun = new Date();
            const bitis = new Date(tenant.lisansBitis);
            const kalanGun = Math.ceil((bitis - bugun) / (1000 * 60 * 60 * 24));
            res.json({ basarili: true, data: { kalanGun } });
        } catch (e) {
            res.status(500).json({ basarili: false, mesaj: e.message });
        }
    },
};

module.exports = authController;