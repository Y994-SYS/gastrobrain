const personelService = require('../services/personel.service');

const personelController = {

    async hepsiniGetir(req, res) {
        try {
            const data = await personelService.hepsiniGetir();
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async biriniGetir(req, res) {
        try {
            const data = await personelService.biriniGetir(Number(req.params.id));
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async olustur(req, res) {
        try {
            const data = await personelService.olustur(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async guncelle(req, res) {
        try {
            const data = await personelService.guncelle(Number(req.params.id), req.body);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await personelService.sil(Number(req.params.id));
            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async maasEkle(req, res) {
        try {
            const data = await personelService.maasEkle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async maasOdendi(req, res) {
        try {
            const data = await personelService.maasOdendi(Number(req.params.id));
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async avansEkle(req, res) {
        try {
            const data = await personelService.avansEkle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async devamEkle(req, res) {
        try {
            const data = await personelService.devamEkle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = personelController;