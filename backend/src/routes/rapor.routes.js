const express = require('express');
const router = express.Router();
const raporController = require('../controllers/rapor.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/satis', yonetimRol, raporController.satisRaporu);
router.get('/stok', yonetimRol, raporController.stokRaporu);
router.get('/cari', yonetimRol, raporController.cariRaporu);
router.get('/maliyet', yonetimRol, raporController.maliyetRaporu);
router.get('/excel', yonetimRol, raporController.excelExport);

module.exports = router;