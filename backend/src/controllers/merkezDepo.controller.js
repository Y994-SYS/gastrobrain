// backend/src/controllers/merkezDepo.controller.js

const merkezDepoService = require('../services/merkezDepo.service');
const { auditLogKaydet } = require('../services/auditLog.service');

const merkezDepoController = {
    // POST /api/merkezdepo/tanim — Tanım ekle/güncelle
    async taninmEkle(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { stokKartId, minStokSeviyesi, otomatiDagit, aciklama } = req.body;

            const sonuc = await merkezDepoService.tanımlaEkle({
                tenantId,
                stokKartId: Number(stokKartId),
                minStokSeviyesi: Number(minStokSeviyesi) || 0,
                otomatiDagit: otomatiDagit !== false,
                aciklama
            });

            await auditLogKaydet(req.kullanici.id, tenantId, 'MERKEZ_DEPO_TANIM_EKLE', {
                stokKartId,
                minStokSeviyesi,
                otomatiDagit
            });

            res.status(201).json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    // GET /api/merkezdepo/tanimlar — Tüm tanımları getir
    async tanimlarGetir(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const tanimlar = await merkezDepoService.tumTanimlarGetir(tenantId);
            res.json(tanimlar);
        } catch (err) {
            res.status(500).json({ hata: err.message });
        }
    },

    // DELETE /api/merkezdepo/tanim/:id — Tanım sil
    async taninmSil(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { id } = req.params;

            const sonuc = await merkezDepoService.sil(Number(id), tenantId);

            await auditLogKaydet(req.kullanici.id, tenantId, 'MERKEZ_DEPO_TANIM_SIL', {
                merkezDepoId: id
            });

            res.json({ mesaj: 'Tanım silindi', sonuc });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    // POST /api/merkezdepo/dagit — Manual dağıtım yap
    async manuelDagit(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { merkezDepoId, hedefSubeId, miktar, aciklama } = req.body;

            const sonuc = await merkezDepoService.manuelDagit({
                tenantId,
                merkezDepoId: Number(merkezDepoId),
                hedefSubeId: Number(hedefSubeId),
                miktar: Number(miktar),
                aciklama
            });

            await auditLogKaydet(req.kullanici.id, tenantId, 'MERKEZ_DEPO_MANUEL_DAGIT', {
                merkezDepoId,
                hedefSubeId,
                miktar
            });

            res.status(201).json({
                mesaj: 'Dağıtım yapıldı',
                dagitim: sonuc
            });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    // GET /api/merkezdepo/gecmis — Dağıtım geçmişi
    async dagitimGecmisiGetir(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { merkezDepoId, limit } = req.query;

            const gecmis = await merkezDepoService.dagitimGecmisiGetir(
                tenantId,
                merkezDepoId ? Number(merkezDepoId) : null,
                limit ? Number(limit) : 50
            );

            res.json(gecmis);
        } catch (err) {
            res.status(500).json({ hata: err.message });
        }
    },

    // GET /api/merkezdepo/durum — Merkez depo durumu
    async durumuGetir(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const durum = await merkezDepoService.durumuGetir(tenantId);
            res.json(durum);
        } catch (err) {
            res.status(500).json({ hata: err.message });
        }
    }
};

module.exports = merkezDepoController;