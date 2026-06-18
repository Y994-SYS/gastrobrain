const satisService = require('../services/satis.service');
const auditLog = require('../services/auditLog.service');

const satisController = {

    async hepsiniGetir(req, res) {
        try {
            const { subeId = 1, tarihBaslangic, tarihBitis } = req.query;
            const data = await satisService.hepsiniGetir(subeId, tarihBaslangic, tarihBitis, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async gunlukToplam(req, res) {
        try {
            const subeId = req.query.subeId || 1;
            const toplam = await satisService.gunlukToplam(subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data: { toplam } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async ekle(req, res) {
        try {
            const data = await satisService.ekle(req.body, req.kullanici.tenantId);

            await auditLog.kaydet({
                eylem: 'SATIS_EKLE',
                detay: {
                    receteId: req.body.receteId,
                    adet: req.body.adet,
                    birimFiyat: req.body.birimFiyat,
                    toplam: data.toplam
                },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await satisService.sil(Number(req.params.id), req.kullanici.tenantId);

            await auditLog.kaydet({
                eylem: 'SATIS_SIL',
                detay: { satisId: Number(req.params.id) },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = satisController;