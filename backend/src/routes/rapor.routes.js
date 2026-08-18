const express = require('express');
const router = express.Router();
const raporController = require('../controllers/rapor.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');
const { validateQuery } = require('../middleware/validate.middleware');
const {
    satisRaporuQuery,
    stokRaporuQuery,
    cariRaporuQuery,
    maliyetRaporuQuery,
    excelExportQuery,
} = require('../schemas/rapor.schema');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/satis', yonetimRol, validateQuery(satisRaporuQuery), raporController.satisRaporu);
router.get('/stok', yonetimRol, validateQuery(stokRaporuQuery), raporController.stokRaporu);
router.get('/cari', yonetimRol, validateQuery(cariRaporuQuery), raporController.cariRaporu);
router.get('/maliyet', yonetimRol, validateQuery(maliyetRaporuQuery), raporController.maliyetRaporu);
// Not: kar-zarar için ayrı bir zod şeması eklenmedi — controller içinde
// baslangic/bitis tarih doğrulaması manuel yapılıyor. Ekibin diğer
// endpoint'lerle tutarlılık istemesi halinde rapor.schema.js'e
// `karZararRaporuQuery` eklenip buraya validateQuery ile bağlanabilir.
router.get('/kar-zarar', yonetimRol, raporController.karZararRaporu);
router.get('/excel', yonetimRol, validateQuery(excelExportQuery), raporController.excelExport);
router.get('/sube-karsilastirmasi', yonetimRol, paketKontrol('subeKarsilastirmasi'), validateQuery(satisRaporuQuery), raporController.subeKarsilastirmasi);
router.get('/merkezmuhasebesi',
    yonetimRol,
    paketKontrol('subeKarsilastirmasi'),
    raporController.merkezMuhasebesi
);

module.exports = router;