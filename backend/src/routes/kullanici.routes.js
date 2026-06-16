const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir } = require('../controllers/kullanici.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', hepsiniGetir);
router.post('/', olustur);
router.put('/:id', guncelle);
router.delete('/:id', sil);
router.put('/profil', authenticate, profilGuncelle);
router.put('/sifre-degistir', authenticate, sifreDegistir);

module.exports = router;