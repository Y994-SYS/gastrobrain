const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir } = require('../controllers/kullanici.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Profil ve şifre — tüm giriş yapmış kullanıcılar kendi bilgisini güncelleyebilir
router.put('/profil', profilGuncelle);
router.put('/sifre-degistir', sifreDegistir);

// Kullanıcı yönetimi — sadece TENANT_ADMIN ve SUPER_ADMIN
router.get('/', rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN'), hepsiniGetir);
router.post('/', rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN'), olustur);
router.put('/:id', rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN'), guncelle);
router.delete('/:id', rolKontrol('SUPER_ADMIN', 'TENANT_ADMIN'), sil);

module.exports = router;