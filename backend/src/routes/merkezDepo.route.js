// backend/src/routes/merkezDepo.route.js

const express = require('express');
const router = express.Router();
const merkezDepoController = require('../controllers/merkezDepo.controller');
const { authMiddleware, rolKontrol } = require('../middleware/auth.middleware');
const paketKontrol = require('../middleware/paketKontrol.middleware');

router.use(authMiddleware);

// Yönetim rolü — TENANT_ADMIN ve MUDUR
const yonetimRol = rolKontrol('TENANT_ADMIN', 'MUDUR');

// Merkez Depo — PROFESYONEL + KURUMSAL paketlerinde
router.get('/durum', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.durumuGetir);
router.get('/tanimlar', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.tanimlarGetir);
router.post('/tanim', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.taninmEkle);
router.delete('/tanim/:id', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.taninmSil);
router.post('/dagit', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.manuelDagit);
router.get('/gecmis', yonetimRol, paketKontrol('merkezDepo'), merkezDepoController.dagitimGecmisiGetir);

module.exports = router;