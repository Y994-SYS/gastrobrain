const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil, profilGuncelle, sifreDegistir } = require('../controllers/kullanici.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Profil ve şifre — tüm giriş yapmış kullanıcılar kendi bilgisini güncelleyebilir
router.put('/profil', profilGuncelle);
router.put('/sifre-degistir', sifreDegistir);

// Kullanıcı yönetimi — sadece TENANT_ADMIN
// NOT: SUPER_ADMIN burada YOK — hiçbir tenant'a bağlı olmadığı için bu endpoint'i
// kullanamaz (tenantId: null). Süper admin kullanıcı yönetimini /super-admin
// panelinden tenant detayına bakarak yapar, doğrudan bu route'u kullanmaz.
router.get('/', rolKontrol('TENANT_ADMIN'), hepsiniGetir);
router.post('/', rolKontrol('TENANT_ADMIN'), olustur);
router.put('/:id', rolKontrol('TENANT_ADMIN'), guncelle);
router.delete('/:id', rolKontrol('TENANT_ADMIN'), sil);

module.exports = router;