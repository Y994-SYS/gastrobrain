const express = require('express');
const router = express.Router();
const { satisRaporu, stokRaporu, cariRaporu, maliyetRaporu, excelExport } = require('../controllers/rapor.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Raporlar: MUDUR + ADMIN — finansal veri içerdiği için kasa/depo/personel göremez
const yonetimRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR');

router.get('/satis', yonetimRol, satisRaporu);
router.get('/stok', yonetimRol, stokRaporu);
router.get('/cari', yonetimRol, cariRaporu);
router.get('/maliyet', yonetimRol, maliyetRaporu);
router.get('/excel', yonetimRol, excelExport);

module.exports = router;