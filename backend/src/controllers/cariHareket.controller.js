const cariHareketService = require('../services/cariHareket.service');

const cariHareketController = {

    async hareketleriGetir(req, res) {
        try {
            const data = await cariHareketService.hareketleriGetir(req.params.cariKartId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async bakiyeGetir(req, res) {
        try {
            const bakiye = await cariHareketService.bakiyeGetir(req.params.cariKartId);
            res.json({ basarili: true, data: { bakiye } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async tumCarilerinBakiyeleriGetir(req, res) {
        try {
            const data = await cariHareketService.tumCarilerinBakiyeleriGetir();
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async odemeEkle(req, res) {
        try {
            const data = await cariHareketService.odemeEkle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async manuelHareketEkle(req, res) {
        try {
            const data = await cariHareketService.manuelHareketEkle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = cariHareketController;