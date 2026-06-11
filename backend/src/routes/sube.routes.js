const express = require('express');
const router = express.Router();
const { hepsiniGetir, tekiniGetir, olustur, guncelle } = require('../controllers/sube.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', hepsiniGetir);
router.get('/:id', tekiniGetir);
router.post('/', olustur);
router.put('/:id', guncelle);

module.exports = router;