const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const kategoriRoutes = require('./routes/kategori.routes');
const olcuBirimiRoutes = require('./routes/olcuBirimi.routes');
const stokKartRoutes = require('./routes/stokKart.routes');
const cariKartRoutes = require('./routes/cariKart.routes');
const stokRoutes = require('./routes/stok.routes');
const receteRoutes = require('./routes/recete.routes');
const satisRoutes = require('./routes/satis.routes');
const cariHareketRoutes = require('./routes/cariHareket.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

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