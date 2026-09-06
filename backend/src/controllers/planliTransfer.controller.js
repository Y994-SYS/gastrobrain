const planliTransferService = require('../services/planliTransfer.service');
const auditLog = require('../services/auditLog.service');

const planliTransferController = {

    async olustur(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const sonuc = await planliTransferService.olustur({ tenantId, ...req.body });

            // DÜZELTME: eskiden "miktar: req.body.miktar" yazıyordu ama miktar
            // üst seviyede yok, her kalemin içinde — bu her zaman undefined
            // logluyordu. Artık kalem sayısı ve ürün adları yazılıyor.
            await auditLog.kaydet({
                eylem: 'PLANLI_TRANSFER_OLUSTUR',
                detay: {
                    plan: req.body.ad,
                    kalemSayisi: sonuc.kalemler.length,
                    urunler: sonuc.kalemler.map(k => k.stokKart.ad).join(', ')
                },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
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

            // DÜZELTME: bu işlem hiç loglanmıyordu
            await auditLog.kaydet({
                eylem: 'PLANLI_TRANSFER_GUNCELLE',
                detay: { plan: sonuc.ad },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

            res.json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async sil(req, res) {
        try {
            const sonuc = await planliTransferService.sil(Number(req.params.id), req.kullanici.tenantId);

            // DÜZELTME: bu işlem hiç loglanmıyordu — service.sil() zaten
            // silinen kaydı (dolayısıyla `ad`ını) döndürüyor
            await auditLog.kaydet({
                eylem: 'PLANLI_TRANSFER_SIL',
                detay: { plan: sonuc.ad },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

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

            // DÜZELTME: bu işlem hiç loglanmıyordu
            await auditLog.kaydet({
                eylem: 'PLANLI_TRANSFER_AKTIF_PASIF',
                detay: { plan: sonuc.ad, durum: sonuc.aktif ? 'Aktif' : 'Pasif' },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

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

            // DÜZELTME: sadece planId değil, hangi ürünlerin taşındığı da
            // logda görünüyor artık (service artık kalemler detayını dönüyor)
            await auditLog.kaydet({
                eylem: 'PLANLI_TRANSFER_MANUEL',
                detay: {
                    plan: sonuc.plan,
                    kalemSayisi: sonuc.kalemSayisi,
                    urunler: sonuc.kalemler.map(k => k.urun).join(', ')
                },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

            res.json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    }
};

module.exports = planliTransferController;