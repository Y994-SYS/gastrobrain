const express = require('express');
const router = express.Router();
const { subeStoklar, transferYap, transferGecmisi } = require('../controllers/transfer.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// TENANT_ADMIN ve MUDUR erişebilir
const transferYetki = rolKontrol('TENANT_ADMIN', 'MUDUR');

router.get('/stoklar', transferYetki, subeStoklar);       // şube stok listesi + bakiye
router.post('/', transferYetki, transferYap);              // transfer gerçekleştir
router.get('/gecmis', transferYetki, transferGecmisi);     // transfer geçmişi

module.exports = router;