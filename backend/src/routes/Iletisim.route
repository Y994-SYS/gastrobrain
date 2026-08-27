const express = require('express');
const router = express.Router();
const iletisimController = require('../controllers/iletisim.controller');

// ÖNEMLİ: Bu route'a bilerek authMiddleware eklenmedi — landing page
// (gastrobrain.com.tr) farklı bir origin'den, giriş yapmamış ziyaretçiler
// tarafından çağıracak. Diğer route dosyalarındaki gibi router.use(authMiddleware)
// KOYMA, yoksa form hiç çalışmaz.
//
// Kurulum notları:
// 1. Ana app.js/server.js dosyanda mount et:
//      app.use('/api/iletisim', require('./routes/iletisim.routes'));
// 2. CORS ayarında gastrobrain.com.tr (ve www'lu hâli) origin listesinde
//    olduğundan emin ol — landing page farklı bir subdomain/domain'den
//    istek atıyor.
// 3. (Önerilir, opsiyonel) Eğer projede express-rate-limit zaten kuruluysa,
//    bu route'a da ekle — public + auth'suz bir uç, spam/kötüye kullanıma
//    açık. Örnek:
//      const rateLimit = require('express-rate-limit');
//      const iletisimLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
//      router.post('/', iletisimLimiter, iletisimController.formuGonder);
router.post('/', iletisimController.formuGonder);

module.exports = router;