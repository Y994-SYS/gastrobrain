const authService = require('../services/auth.service');

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

    async beniKontrolEt(req, res) {
        res.json({ basarili: true, data: req.kullanici });
    }

};

module.exports = authController;