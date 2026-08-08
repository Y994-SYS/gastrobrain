const planliTransferService = require('../services/planliTransfer.service');
const { auditLogKaydet } = require('../services/auditLog.service');

const planliTransferController = {

    async olustur(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const sonuc = await planliTransferService.olustur({ tenantId, ...req.body });

            await auditLogKaydet(req.kullanici.id, tenantId, 'PLANLI_TRANSFER_OLUSTUR', {
                ad: req.body.ad, miktar: req.body.miktar
            });

            res.status(201).json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async tumunuGetir(req, res) {
        try {
            const sonuc = await planliTransferService.tumunuGetir(req.kullanici.tenantId);
            res.json(sonuc);
        } catch (err) {
            res.status(500).json({ hata: err.message });
        }
    },

    async guncelle(req, res) {
        try {
            const sonuc = await planliTransferService.guncelle(
                Number(req.params.id),
                req.kullanici.tenantId,
                req.body
            );
            res.json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async sil(req, res) {
        try {
            await planliTransferService.sil(Number(req.params.id), req.kullanici.tenantId);
            res.json({ mesaj: 'Plan silindi' });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async aktifPasifYap(req, res) {
        try {
            const sonuc = await planliTransferService.aktifPasifYap(
                Number(req.params.id),
                req.kullanici.tenantId,
                req.body.aktif
            );
            res.json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async hemenCalistir(req, res) {
        try {
            const sonuc = await planliTransferService.hemenCalistir(
                Number(req.params.id),
                req.kullanici.tenantId
            );

            await auditLogKaydet(req.kullanici.id, req.kullanici.tenantId, 'PLANLI_TRANSFER_MANUEL', {
                planId: req.params.id
            });

            res.json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    }
};

module.exports = planliTransferController;