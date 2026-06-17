const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/kayit', authController.kayitOl);
router.post('/giris', authController.girisYap);
router.get('/ben', authMiddleware, authController.beniKontrolEt);
router.post('/kayit-firma', authController.kayitFirma); // yeni firma kaydı
router.post('/tenant-listesi', authController.tenantListesiGetir);

// 2. BURASI HATALIYDI: 'authenticate' yerine 'authMiddleware' yazdık.
router.get('/lisans-durum', authMiddleware, authController.lisansDurum);
module.exports = router;