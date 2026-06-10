const express = require('express');
const router = express.Router();
const satisController = require('../controllers/satis.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', satisController.hepsiniGetir);
router.get('/gunluk-toplam', satisController.gunlukToplam);
router.post('/', satisController.ekle);
router.delete('/:id', satisController.sil);

module.exports = router;