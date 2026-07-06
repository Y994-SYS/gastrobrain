const satisService = require('../services/satis.service');
const auditLog = require('../services/auditLog.service');

// Kısıtlı roller: sadece kendi şubeleriyle ilgili işlem yapabilir
// (okuma ve yazma dahil). Bu roller için gönderilen subeId göz ardı edilir.
const SUBE_KISITLI_ROLLER = ['MUDUR', 'DEPO', 'KASA', 'PERSONEL'];

// Şube ID'sini belirle (okuma işlemleri için)
const subeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (SUBE_KISITLI_ROLLER.includes(rol)) {
        return req.kullanici.subeId;
    }
    return req.query.subeId ? Number(req.query.subeId) : null;
};

// Şube ID'sini belirle (satış oluşturma için — body üzerinden gelir).
// Kısıtlı roller için body'de ne gönderilirse gönderilsin kullanıcının
// kendi şubesi zorlanır; aksi halde bir kasiyer/personel başka bir şubenin
// stoğunu düşürüp satış kaydı oluşturabilirdi (tenant içi yetki atlatma).
const satisSubeIdBelirle = (req) => {
    const rol = req.kullanici.rol;
    if (SUBE_KISITLI_ROLLER.includes(rol)) {
        return req.kullanici.subeId;
    }
    return req.body.subeId ? Number(req.body.subeId) : req.kullanici.subeId;
};

const satisController = {

    async hepsiniGetir(req, res) {
        try {
            const subeId = subeIdBelirle(req);
            const { tarihBaslangic, tarihBitis } = req.query;
            const data = await satisService.hepsiniGetir(subeId, tarihBaslangic, tarihBitis, req.kullanici.tenantId);
            res.json({ basarili: true, data });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async gunlukToplam(req, res) {
        try {
            const subeId = subeIdBelirle(req);
            const toplam = await satisService.gunlukToplam(subeId, req.kullanici.tenantId);
            res.json({ basarili: true, data: { toplam } });
        } catch (error) {
            res.status(500).json({ basarili: false, mesaj: error.message });
        }
    },

    async ekle(req, res) {
        try {
            // Şube: kısıtlı roller için her zaman kendi şubesi zorlanır;
            // diğer roller için body'den gelirse onu kullan, yoksa kullanıcının şubesi
            req.body.subeId = satisSubeIdBelirle(req);

            const zorla = req.body.zorla === true;
            const { satis, zorlandi, eksikKalemler } = await satisService.ekle(
                req.body,
                req.kullanici.tenantId,
                { zorla, rol: req.kullanici.rol }
            );

            await auditLog.kaydet({
                eylem: zorlandi ? 'SATIS_EKLE_ZORLA' : 'SATIS_EKLE',
                detay: {
                    receteId: req.body.receteId,
                    adet: req.body.adet,
                    birimFiyat: req.body.birimFiyat,
                    toplam: satis.toplam,
                    ...(zorlandi ? { eksikKalemler } : {})
                },
                kullaniciId: req.kullanici.id,
                tenantId: req.kullanici.tenantId,
                ip: req.ip
            });

            res.status(201).json({ basarili: true, data: satis, zorlandi, eksikKalemler });
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