const express = require('express');
const router = express.Router();
const { tumVeriExport } = require('../controllers/export.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// TENANT_ADMIN ve ADMIN kendi firmasının verisini export edebilir.
// MUDUR/DEPO/KASA/PERSONEL dahil edilmedi — export tüm şubelerin
// (personel, cari, satış) verisini içerebiliyor, sadece firma yönetimi görmeli.
router.post('/', rolKontrol('TENANT_ADMIN', 'ADMIN'), tumVeriExport);

module.exports = router;