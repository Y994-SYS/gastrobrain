const sabitGiderService = require('../services/sabitGider.service');

// Şube ID'sini belirle — stok/personel controller'larıyla tutarlı ilke:
// MUDUR/DEPO/KASA/PERSONEL sadece kendi şubesini görür; TENANT_ADMIN/ADMIN
// query'den subeId gelirse onu kullanır, gelmezse tüm işletmeyi görür.
const subeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (rol === 'MUDUR' || rol === 'DEPO' || rol === 'KASA' || rol === 'PERSONEL') {
        return req.kullanici.subeId;
    }
    return req.query.subeId ? Number(req.query.subeId) : null;
};

const sabitGiderController = {

    async hepsiniGetir(req, res) {
        try {
            const subeId = subeIdBelirle(req);
            const { yil, ay, kategori } = req.query;
            const data = await sabitGiderService.hepsiniGetir(
                req.kullanici.tenantId,
                { subeId, yil, ay, kategori }
            );
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async biriniGetir(req, res) {
        try {
            const data = await sabitGiderService.biriniGetir(req.params.id, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(404).json({ basarili: false, mesaj: error.message });
        }
    },

    async olustur(req, res) {
        try {
            // MUDUR/DEPO/KASA/PERSONEL kendi şubesi dışında gider
            // oluşturamaz — body'de subeId gelmemişse kendi şubesine
            // yazılır; TENANT_ADMIN/ADMIN body'de ne gönderdiyse o
            // kullanılır (boş/null bırakırsa "tüm işletme geneli" olur).
            const rol = req.kullanici.rol;
            if ((rol === 'MUDUR' || rol === 'DEPO' || rol === 'KASA' || rol === 'PERSONEL') && !req.body.subeId) {
                req.body.subeId = req.kullanici.subeId;
            }
            const data = await sabitGiderService.olustur(req.body, req.kullanici.tenantId);
            res.status(201).json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async guncelle(req, res) {
        try {
            const data = await sabitGiderService.guncelle(req.params.id, req.body, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async odendiIsaretle(req, res) {
        try {
            const data = await sabitGiderService.odendiIsaretle(req.params.id, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

    async sil(req, res) {
        try {
            await sabitGiderService.sil(req.params.id, req.kullanici.tenantId);
            res.json({ basarili: true, mesaj: 'Sabit gider silindi' });
        } catch (error) {
            res.status(400).json({ basarili: false, mesaj: error.message });
        }
    },

};

module.exports = sabitGiderController;