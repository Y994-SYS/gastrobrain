const stokService = require('../services/stok.service');

const stokController = {

    async hareketleriGetir(req, res) {
        try {
            const data = await stokService.hareketleriGetir(req.query.stokKartId, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async tumStokDurumu(req, res) {
        try {
            const subeId = req.query.subeId || 1;
            const data = await stokService.tumStokDurumu(subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async mevcutStokGetir(req, res) {
        try {
            const { stokKartId, subeId } = req.params;
            const miktar = await stokService.mevcutStokGetir(stokKartId, subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data: { miktar } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async girisFaturasiEkle(req, res) {
        try {
            const data = await stokService.girisFaturasiEkle(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async iadeFaturasiEkle(req, res) {
        try {
            const data = await stokService.iadeFaturasiEkle(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async zayiEkle(req, res) {
        try {
            const data = await stokService.zayiEkle(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async tuketimEkle(req, res) {
        try {
            const data = await stokService.tuketimEkle(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async aySonuSayimEkle(req, res) {
        try {
            const data = await stokService.aySonuSayimEkle(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = stokController;