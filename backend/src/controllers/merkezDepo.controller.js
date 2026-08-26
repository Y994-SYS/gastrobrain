const merkezDepoService = require('../services/merkezDepo.service');
const auditLog = require('../services/auditLog.service');

const merkezDepoController = {

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

            await auditLog.kaydet({
                eylem: 'MERKEZ_DEPO_TANIM_EKLE',
                detay: { stokKartId, minStokSeviyesi, otomatiDagit },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async tanimTumunuEkle(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const sonuc = await merkezDepoService.tumunuEkle(tenantId);

            await auditLog.kaydet({
                eylem: 'MERKEZ_DEPO_TANIM_TOPLU_EKLE',
                detay: { eklenen: sonuc.eklenen },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json(sonuc);
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    async tanimlarGetir(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const tanimlar = await merkezDepoService.tumTanimlarGetir(tenantId);
            res.json(tanimlar);
        } catch (err) {
            res.status(500).json({ hata: err.message });
        }
    },

    async taninmSil(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { id } = req.params;

            const sonuc = await merkezDepoService.sil(Number(id), tenantId);

            await auditLog.kaydet({
                eylem: 'MERKEZ_DEPO_TANIM_SIL',
                detay: { merkezDepoId: id },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.json({ mesaj: 'Tanım silindi', sonuc });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

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

            await auditLog.kaydet({
                eylem: 'MERKEZ_DEPO_MANUEL_DAGIT',
                detay: { merkezDepoId, hedefSubeId, miktar },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json({ mesaj: 'Dağıtım yapıldı', dagitim: sonuc });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

    // Toplu dağıtım: aynı hedef şubeye birden fazla kalem tek istekte.
    // Kısmi başarı mümkündür — hangi kalemlerin başarılı/başarısız olduğu
    // sonuç dizisinde ayrı ayrı dönülür, frontend her biri için ayrı
    // toast gösterir.
    async topluDagit(req, res) {
        try {
            const tenantId = req.kullanici.tenantId;
            const { hedefSubeId, kalemler } = req.body;

            const sonuclar = await merkezDepoService.topluDagit({
                tenantId,
                hedefSubeId: Number(hedefSubeId),
                kalemler
            });

            const basariliSayisi = sonuclar.filter(s => s.basarili).length;

            await auditLog.kaydet({
                eylem: 'MERKEZ_DEPO_TOPLU_DAGIT',
                detay: { hedefSubeId, kalemSayisi: kalemler.length, basariliSayisi },
                kullaniciId: req.kullanici.id,
                tenantId,
                ip: req.ip
            });

            res.status(201).json({ sonuclar, basariliSayisi, toplamKalem: kalemler.length });
        } catch (err) {
            res.status(400).json({ hata: err.message });
        }
    },

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