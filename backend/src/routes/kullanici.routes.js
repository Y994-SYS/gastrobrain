const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir } = require('../controllers/kullanici.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', hepsiniGetir);
router.post('/', olustur);
router.put('/profil', profilGuncelle);
router.put('/sifre-degistir', sifreDegistir);
router.put('/:id', guncelle);
router.delete('/:id', sil);

module.exports = router;