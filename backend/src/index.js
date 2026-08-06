require('dotenv').config();
require('./instrument');

const Sentry = require('@sentry/node');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');

const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger.middleware');

const { girisLimit, kayitLimit, genelLimit, kritikLimit } = require('./middleware/rateLimit.middleware');
const { tokenVarsaCoz } = require('./middleware/auth.middleware');

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
const odemeRoutes = require('./routes/odeme.routes');
const exportRoutes = require('./routes/export.routes'); // ← EKLENDİ
const merkezDepoRoutes = require('./routes/merkezDepo.route');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient().$extends({
    query: {
        $allModels: {
            async findMany({ args, query }) {
                if (!args.where?.tenantId && !args.where?.sube?.tenantId && !args.where?.stokKart?.tenantId) {
                    logger.warn('tenantId olmadan sorgu', { stack: new Error().stack });
                }
                return query(args);
            },
            async findFirst({ args, query }) {
                if (!args.where?.tenantId && !args.where?.sube?.tenantId && !args.where?.stokKart?.tenantId) {
                    logger.warn('tenantId olmadan sorgu', { stack: new Error().stack });
                }
                return query(args);
            }
        }
    }
});

const app = express();
const PORT = process.env.PORT || 3001;

// ── Güvenlik başlıkları ───────────────────────────────────────────────────────
// NOT: helmet() her zaman EN BAŞTA kalmalı — X-Powered-By gizleme, HSTS,
// vb. tüm response'lara (health check dahil) uygulanmalı.
app.use(helmet());

// ── Sağlık kontrolü ───────────────────────────────────────────────────────────
// NOT: Bu route CORS'tan ÖNCE ama helmet'ten SONRA tanımlanıyor. Render (ve
// benzeri hosting'ler) health check için Origin header'ı olmayan HEAD/GET
// istekleri atar; bu istekler CORS'un origin kontrolüne hiç girmeden burada
// karşılanır (log gürültüsü engellenir) ama yine de helmet'in güvenlik
// header'larını (HSTS, X-Powered-By gizleme vb.) alır.
app.get('/', (req, res) => {
    res.json({ message: 'GastroBRAIN API çalışıyor 🚀', version: '1.0.0' });
});

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
// Auth route'ları — token yok, IP bazlı limitler (tokenVarsaCoz'a gerek yok)
app.use('/api/auth/giris', girisLimit);
app.use('/api/auth/tenant-listesi', girisLimit);
app.use('/api/auth/kayit-firma', kayitLimit);
app.use('/api/auth/kayit', kayitLimit);

// Token varsa çöz — genelLimit ve kritikLimit'in tenant+user bazlı
// key üretebilmesi için, gerçek authMiddleware'den ÖNCE çalışır
app.use('/api', tokenVarsaCoz);

// Request logger — tokenVarsaCoz'dan SONRA mount edilir ki req.kullanici
// dolu olsun ve loglara tenant/kullanıcı bilgisi yansısın
app.use('/api', requestLogger);

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
app.use('/api/odeme', odemeRoutes);
app.use('/api/export', exportRoutes); // ← EKLENDİ
app.use('/api/merkezdepo', merkezDepoRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ basarili: false, mesaj: 'Endpoint bulunamadı' });
});

// ── Hata yakalama ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // CORS hatalarını özel handle et
    if (err.message?.includes('CORS') || err.message === 'Origin zorunlu') {
        return res.status(403).json({ basarili: false, mesaj: 'Erişim reddedildi' });
    }
    logger.error(err.message, {
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        tenant: req.kullanici?.tenantId,
        kullaniciId: req.kullanici?.id,
    });
    Sentry.captureException(err);
    res.status(500).json({ basarili: false, mesaj: 'Sunucu hatası' });
});

// ── Lisans uyarı cron job ─────────────────────────────────────────────────────
const lisansUyariService = require('./services/lisansUyari.service');
const { CronJob } = require('cron');
new CronJob('0 9 * * *', async () => {
    logger.info('Lisans uyarı kontrolü başladı');
    await lisansUyariService.kontrol();
}, null, true, 'Europe/Istanbul');

app.listen(PORT, () => {
    logger.info(`Server http://localhost:${PORT} adresinde çalışıyor`);
});

// ── MERKEZ DEPO OTOMATİK DAĞITIM (Pazartesi & Cuma saat 06:00) ──
const merkezDepoService = require('./services/merkezDepo.service');
const otomatiDagitimJob = cron.schedule('0 6 * * 1,5', async () => {
    console.log('[CRON] Merkez depo otomatik dağıtım başladı...');
    try {
        const tenantlar = await prisma.tenant.findMany({ where: { aktif: true } });
        for (const tenant of tenantlar) {
            const sonuclar = await merkezDepoService.otomatiDagitimYap(tenant.id);
            if (sonuclar.length > 0) {
                console.log(`[MERKEZ DEPO] ${tenant.ad}: ${sonuclar.length} dağıtım yapıldı`);
            }
        }
    } catch (err) {
        console.error('[MERKEZ DEPO HATA]', err);
    }
});