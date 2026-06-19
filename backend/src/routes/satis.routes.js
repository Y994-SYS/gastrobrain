const express = require('express');
const router = express.Router();
const satisController = require('../controllers/satis.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Satış modülü: KASA + MUDUR + ADMIN — SUPER_ADMIN'in tenant'ı olmadığı için burada yok
const satisRol = rolKontrol('TENANT_ADMIN', 'MUDUR', 'KASA');

router.get('/', satisRol, satisController.hepsiniGetir);
router.get('/gunluk-toplam', satisRol, satisController.gunlukToplam);
router.post('/', satisRol, satisController.ekle);
router.delete('/:id', satisRol, satisController.sil);

module.exports = router;