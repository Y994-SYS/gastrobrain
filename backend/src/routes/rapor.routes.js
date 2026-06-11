const express = require('express');
const router = express.Router();
const { satisRaporu, stokRaporu, cariRaporu, maliyetRaporu, excelExport } = require('../controllers/rapor.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/satis', satisRaporu);
router.get('/stok', stokRaporu);
router.get('/cari', cariRaporu);
router.get('/maliyet', maliyetRaporu);
router.get('/excel', excelExport);

module.exports = router;