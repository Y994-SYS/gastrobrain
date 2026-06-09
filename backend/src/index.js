const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

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