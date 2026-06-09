const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/kayit', authController.kayitOl);
router.post('/giris', authController.girisYap);
router.get('/ben', authMiddleware, authController.beniKontrolEt);

module.exports = router;