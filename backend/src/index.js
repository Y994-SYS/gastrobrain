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
const auditLogRoutes = require('./routes/auditLog.routes');
const transferRoutes = require('./routes/transfer.route');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.route');

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

// ── Güvenlik başlıkları ───────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — sadece kendi domaininden istek kabul et ────────────────────────────
const izinliOriginler = (process.env.ALLOWED_ORIGINS || 'https://app.gastrobrain.com.tr')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // origin yoksa (Postman, sunucu-sunucu) production'da reddet
        if (!origin) {
            if (process.env.NODE_ENV === 'production') {
                return callback(new Error('Origin zorunlu'), false);
            }
            return callback(null, true); // development'ta izin ver
        }
        if (izinliOriginler.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: ${origin} izinli değil`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));  // büyük payload saldırısı önlemi
app.use(hpp());

// ── XSS koruması — sadece string değerleri temizle, / encode etme ────────────
app.use((req, res, next) => {
    if (req.body) {
        const temizle = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key]
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#x27;');
                    // NOT: / encode edilmiyor — URL ve JSON'da sorun çıkarır
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    temizle(obj[key]);
                }
            }
        };
        temizle(req.body);
    }
    next();
});

// ── Rate limiting — kritik ve genel limitler ROUTE'LARDAN ÖNCE ───────────────
// Auth route'ları
app.use('/api/auth/giris', girisLimit);
app.use('/api/auth/tenant-listesi', girisLimit);
app.use('/api/auth/kayit-firma', kayitLimit);
app.use('/api/auth/kayit', kayitLimit);

// Kritik işlemler — route'lardan önce tanımlanmalı ki çalışsın
app.use('/api/stok', kritikLimit);
app.use('/api/satislar', kritikLimit);

// Genel limit — tüm API
app.use('/api', genelLimit);

// ── Routes ────────────────────────────────────────────────────────────────────
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
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

// ── Sağlık kontrolü ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'GastroIQ API çalışıyor 🚀', version: '1.0.0' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ basarili: false, mesaj: 'Endpoint bulunamadı' });
});

// ── Hata yakalama ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // CORS hatalarını özel handle et
    if (err.message?.includes('CORS')) {
        return res.status(403).json({ basarili: false, mesaj: 'Erişim reddedildi' });
    }
    Sentry.captureException(err);
    console.error(err.stack);
    res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası' });
});

// ── Lisans uyarı cron job ─────────────────────────────────────────────────────
const lisansUyariService = require('./services/lisansUyari.service');
const { CronJob } = require('cron');
new CronJob('0 9 * * *', async () => {
    console.log('🔔 Lisans uyarı kontrolü başladı...');
    await lisansUyariService.kontrol();
}, null, true, 'Europe/Istanbul');

app.listen(PORT, () => {
    console.log(`✅ Server http://localhost:${PORT} adresinde çalışıyor`);
});