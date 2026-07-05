const express = require('express');
const router = express.Router();
const raporController = require('../controllers/rapor.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
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
router.get('/excel', yonetimRol, validateQuery(excelExportQuery), raporController.excelExport);

module.exports = router;