const express = require('express');
const router = express.Router();
const olcuBirimiController = require('../controllers/olcuBirimi.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', olcuBirimiController.hepsiniGetir);
router.get('/:id', olcuBirimiController.biriniGetir);
router.post('/', olcuBirimiController.olustur);
router.put('/:id', olcuBirimiController.guncelle);
router.delete('/:id', olcuBirimiController.sil);

module.exports = router;