const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const stokRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, kategoriController.hepsiniGetir);
router.get('/:id', stokRol, kategoriController.biriniGetir);
router.post('/', stokRol, kategoriController.olustur);
router.put('/:id', stokRol, kategoriController.guncelle);
router.delete('/:id', stokRol, kategoriController.sil);

module.exports = router;