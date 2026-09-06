const kategoriService = require('../services/kategori.service');

const GECERLI_TIPLER = ['STOK', 'RECETE'];

const kategoriController = {

    // GET /api/kategoriler?tip=RECETE  → POS'ta reçete kategorileri
    // GET /api/kategoriler?tip=STOK    → stok kartı kategorileri
    // GET /api/kategoriler             → hepsi (yönetim ekranı için)
    async hepsiniGetir(req, res) {
        try {
            const { tip } = req.query;
            if (tip && !GECERLI_TIPLER.includes(tip)) {
                return res.status(400).json({ basarili: false, mesaj: 'Geçersiz kategori tipi' });
            }
            const data = await kategoriService.hepsiniGetir(req.kullanici.tenantId, tip);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async biriniGetir(req, res) {
        try {
            const data = await kategoriService.biriniGetir(Number(req.params.id), req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async olustur(req, res) {
        try {
            const data = await kategoriService.olustur(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async guncelle(req, res) {
        try {
            const data = await kategoriService.guncelle(Number(req.params.id), req.body, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async siraGuncelle(req, res) {
        try {
            // body: { siralama: [{id, sira}, ...] }
            const data = await kategoriService.siraGuncelle(req.body.siralama, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await kategoriService.sil(Number(req.params.id), req.kullanici.tenantId);
            res.json({ basarili: true, mesaj: 'Silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    }

};

module.exports = kategoriController;