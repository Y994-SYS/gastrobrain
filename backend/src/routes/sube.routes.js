const express = require('express');
const router = express.Router();
const { hepsiniGetir, tekiniGetir, olustur, guncelle } = require('../controllers/sube.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

const okuma = rolKontrol('TENANT_ADMIN', 'MUDUR');
const yonetim = rolKontrol('TENANT_ADMIN');

router.get('/', okuma, hepsiniGetir);
router.get('/:id', okuma, tekiniGetir);
router.post('/', yonetim, olustur);
router.put('/:id', yonetim, guncelle);

module.exports = router;