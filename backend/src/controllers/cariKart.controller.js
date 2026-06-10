const cariKartService = require('../services/cariKart.service');

const cariKartController = {

    async hepsiniGetir(req, res) {
        try {
            const data = await cariKartService.hepsiniGetir();
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async biriniGetir(req, res) {
        try {
            const data = await cariKartService.biriniGetir(Number(req.params.id));
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async olustur(req, res) {
        try {
            const data = await cariKartService.olustur(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async guncelle(req, res) {
        try {
            const data = await cariKartService.guncelle(Number(req.params.id), req.body);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await cariKartService.sil(Number(req.params.id));
            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async bakiyeGetir(req, res) {
        try {
            const bakiye = await cariKartService.bakiyeGetir(Number(req.params.id));
            res.json({ basarili: true, data: { bakiye } });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = cariKartController;