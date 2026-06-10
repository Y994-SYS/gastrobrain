const express = require('express');
const router = express.Router();
const personelController = require('../controllers/personel.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', personelController.hepsiniGetir);
router.get('/:id', personelController.biriniGetir);
router.post('/', personelController.olustur);
router.put('/:id', personelController.guncelle);
router.delete('/:id', personelController.sil);
router.post('/maas', personelController.maasEkle);
router.put('/maas/:id/odendi', personelController.maasOdendi);
router.post('/avans', personelController.avansEkle);
router.post('/devam', personelController.devamEkle);

module.exports = router;