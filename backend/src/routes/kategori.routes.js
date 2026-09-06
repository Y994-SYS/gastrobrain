// routes/kategori.routes.js içine eklenecek / yeni dosya olarak oluşturulacak

const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategori.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { kategoriOlusturSchema, kategoriGuncelleSchema, kategoriSiraSchema } = require('../schemas/kategori.schema');

router.get('/', authMiddleware, kategoriController.hepsiniGetir);
router.get('/:id', authMiddleware, kategoriController.biriniGetir);
router.post('/', authMiddleware, validate(kategoriOlusturSchema), kategoriController.olustur);
router.put('/:id', authMiddleware, validate(kategoriGuncelleSchema), kategoriController.guncelle);
router.put('/siralama/toplu', authMiddleware, validate(kategoriSiraSchema), kategoriController.siraGuncelle);
router.delete('/:id', authMiddleware, kategoriController.sil);

module.exports = router;

// app.js / index.js içinde:
// app.use('/api/kategoriler', require('./routes/kategori.routes'));