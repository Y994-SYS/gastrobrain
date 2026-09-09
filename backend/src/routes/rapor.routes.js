const express = require('express');
const router = express.Router();
const raporController = require('../controllers/rapor.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');
const { validateQuery } = require('../middleware/validate.middleware');
const cacheMiddleware = require('../middleware/cache.middleware');
const {
    satisRaporuQuery,
    stokRaporuQuery,
    cariRaporuQuery,
    maliyetRaporuQuery,
    excelExportQuery,
} = require('../schemas/rapor.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

// Not: cacheMiddleware sadece GET + JSON dönen rapor endpoint'lerine
// eklendi. excelExport (dosya indirme) ve kar-zarar (tarih aralığına
// göre çok değişken, cache'den fayda görme ihtimali düşük) bilinçli
// olarak dışarıda bırakıldı.
router.get('/satis', yonetimRol, validateQuery(satisRaporuQuery), cacheMiddleware(60), raporController.satisRaporu);
router.get('/stok', yonetimRol, validateQuery(stokRaporuQuery), cacheMiddleware(60), raporController.stokRaporu);
router.get('/cari', yonetimRol, validateQuery(cariRaporuQuery), cacheMiddleware(60), raporController.cariRaporu);
router.get('/maliyet', yonetimRol, validateQuery(maliyetRaporuQuery), cacheMiddleware(60), raporController.maliyetRaporu);
// Not: kar-zarar için ayrı bir zod şeması eklenmedi — controller içinde
// baslangic/bitis tarih doğrulaması manuel yapılıyor. Ekibin diğer
// endpoint'lerle tutarlılık istemesi halinde rapor.schema.js'e
// `karZararRaporuQuery` eklenip buraya validateQuery ile bağlanabilir.
router.get('/kar-zarar', yonetimRol, raporController.karZararRaporu);
router.get('/excel', yonetimRol, validateQuery(excelExportQuery), raporController.excelExport);
router.get('/sube-karsilastirmasi', yonetimRol, paketKontrol('subeKarsilastirmasi'), validateQuery(satisRaporuQuery), cacheMiddleware(60), raporController.subeKarsilastirmasi);
router.get('/merkezmuhasebesi',
    yonetimRol,
    paketKontrol('subeKarsilastirmasi'),
    cacheMiddleware(60),
    raporController.merkezMuhasebesi
);

module.exports = router;