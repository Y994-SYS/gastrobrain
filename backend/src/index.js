require('dotenv').config();
require('./instrument');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');

const { girisLimit, kayitLimit, genelLimit, kritikLimit } = require('./middleware/rateLimit.middleware');

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
const feedbackRoutes = require('./routes/feedback.routes');


const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async findMany({ args, query }) {
                if (!args.where?.tenantId && !args.where?.sube?.tenantId && !args.where?.stokKart?.tenantId) {
                    console.warn('⚠️  tenantId olmadan sorgu:', new Error().stack);
                }
                return query(args);
            },
            async findFirst({ args, query }) {
                if (!args.where?.tenantId && !args.where?.sube?.tenantId && !args.where?.stokKart?.tenantId) {
                    console.warn('⚠️  tenantId olmadan sorgu:', new Error().stack);
                }
                return query(args);
            }
        }
    }
});
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

// Rate limiting — auth route'ları sıkı IP bazlı
app.use('/api/auth/giris', girisLimit);
app.use('/api/auth/tenant-listesi', girisLimit);
app.use('/api/auth/kayit-firma', kayitLimit);
app.use('/api/auth/kayit', kayitLimit);

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
app.use('/api/feedback', feedbackRoutes);

// Genel & kritik rate limit — tenant+user bazlı (route'lardan sonra değil önce)
app.use('/api/stok', kritikLimit);
app.use('/api/satislar', kritikLimit);
app.use('/api', genelLimit);

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
    Sentry.captureException(err);
    console.error(err.stack);
    res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası' });
});

// Lisans uyarı cron job
const lisansUyariService = require('./services/lisansUyari.service');
const { CronJob } = require('cron');
new CronJob('0 9 * * *', async () => {
    console.log('🔔 Lisans uyarı kontrolü başladı...');
    await lisansUyariService.kontrol();
}, null, true, 'Europe/Istanbul');

app.listen(PORT, () => {
    console.log(`✅ Server http://localhost:${PORT} adresinde çalışıyor`);
});

