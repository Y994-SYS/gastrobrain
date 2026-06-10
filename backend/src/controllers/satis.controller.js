const satisService = require('../services/satis.service');

const satisController = {

    async hepsiniGetir(req, res) {
        try {
            const { subeId = 1, tarihBaslangic, tarihBitis } = req.query;
            const data = await satisService.hepsiniGetir(subeId, tarihBaslangic, tarihBitis);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async gunlukToplam(req, res) {
        try {
            const subeId = req.query.subeId || 1;
            const toplam = await satisService.gunlukToplam(subeId);
            res.json({ basarili: true, data: { toplam } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async ekle(req, res) {
        try {
            const data = await satisService.ekle(req.body);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await satisService.sil(Number(req.params.id));
            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = satisController;