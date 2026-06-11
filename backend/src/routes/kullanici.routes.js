const express = require('express');
const router = express.Router();
const { hepsiniGetir, olustur, guncelle, sil } = require('../controllers/kullanici.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', hepsiniGetir);
router.post('/', olustur);
router.put('/:id', guncelle);
router.delete('/:id', sil);

module.exports = router;