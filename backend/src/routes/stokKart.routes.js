const express = require('express');
const router = express.Router();
const stokKartController = require('../controllers/stokKart.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Stok kartı tanımları: DEPO + MUDUR + ADMIN
const stokRol = rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, stokKartController.hepsiniGetir);
router.get('/:id', stokRol, stokKartController.biriniGetir);
router.post('/', stokRol, stokKartController.olustur);
router.put('/:id', stokRol, stokKartController.guncelle);
router.delete('/:id', stokRol, stokKartController.sil);

module.exports = router;