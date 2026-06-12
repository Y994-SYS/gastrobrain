const receteService = require('../services/recete.service');

const receteController = {

    async hepsiniGetir(req, res) {
        try {
            const data = await receteService.hepsiniGetir(req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async biriniGetir(req, res) {
        try {
            const data = await receteService.biriniGetir(Number(req.params.id), req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async maliyetHesapla(req, res) {
        try {
            const data = await receteService.maliyetHesapla(Number(req.params.id), req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async olustur(req, res) {
        try {
            const data = await receteService.olustur(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async guncelle(req, res) {
        try {
            const data = await receteService.guncelle(Number(req.params.id), req.body, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await receteService.sil(Number(req.params.id), req.kullanici.tenantId);
            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = receteController;