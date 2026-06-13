require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

const authRoutes = require('./routes/auth.routes');
const kategoriRoutes = require('./routes/kategori.routes');
const olcuBirimiRoutes = require('./routes/olcuBirimi.routes');
const stokKartRoutes = require('./routes/stokKart.routes');
const cariKartRoutes = require('./routes/cariKart.routes');
const stokRoutes = require('./routes/stok.routes');
const receteRoutes = require('./routes/recete.routes');
const satisRoutes = require('./routes/satis.routes');
const cariHareketRoutes = require('./routes/cariHareket.routes');
const personelRoutes = require('./routes/personel.routes');
const raporRoutes = require('./routes/rapor.routes');
const subeRoutes = require('./routes/sube.routes');
const kullaniciRoutes = require('./routes/kullanici.routes');
const superAdminRoutes = require('./routes/superAdmin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Güvenlik
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(hpp());

// XSS koruması
app.use((req, res, next) => {
    if (req.body) {
        const temizle = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key]
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#x27;')
                        .replace(/\//g, '&#x2F;');
                } else if (typeof obj[key] === 'object') {
                    temizle(obj[key]);
                }
            }
        };
        temizle(req.body);
    }
    next();
});

// Rate limiting
const genelLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { basarili: false, mesaj: 'Çok fazla istek gönderdiniz. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const girisLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { basarili: false, mesaj: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const kayitLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { basarili: false, mesaj: 'Çok fazla kayıt denemesi. 1 saat sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', genelLimit);
app.use('/api/auth/giris', girisLimit);
app.use('/api/auth/kayit-firma', kayitLimit);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kategoriler', kategoriRoutes);
app.use('/api/olcu-birimleri', olcuBirimiRoutes);
app.use('/api/stok-kartlari', stokKartRoutes);
app.use('/api/cari-kartlar', cariKartRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/receteler', receteRoutes);
app.use('/api/satislar', satisRoutes);
app.use('/api/cari-hareketler', cariHareketRoutes);
app.use('/api/personel', personelRoutes);
app.use('/api/raporlar', raporRoutes);
app.use('/api/subeler', subeRoutes);
app.use('/api/kullanicilar', kullaniciRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Sağlık kontrolü
app.get('/', (req, res) => {
    res.json({ message: 'GastroIQ API çalışıyor 🚀', version: '1.0.0' });
});

// 404
app.use((req, res) => {
    res.status(404).json({ basarili: false, mesaj: 'Endpoint bulunamadı' });
});

// Hata yakalama
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası' });
});

app.listen(PORT, () => {
    console.log(`✅ Server http://localhost:${PORT} adresinde çalışıyor`);
});