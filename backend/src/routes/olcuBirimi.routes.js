const express = require('express');
const router = express.Router();
const olcuBirimiController = require('../controllers/olcuBirimi.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const stokRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'DEPO');

router.get('/', stokRol, olcuBirimiController.hepsiniGetir);
router.get('/:id', stokRol, olcuBirimiController.biriniGetir);
router.post('/', stokRol, olcuBirimiController.olustur);
router.put('/:id', stokRol, olcuBirimiController.guncelle);
router.delete('/:id', stokRol, olcuBirimiController.sil);

module.exports = router;