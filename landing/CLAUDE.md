@AGENTS.md
# GastroBrain — Proje Context Dosyası

## PROJE BİLGİLERİ
- **Proje:** GastroBrain — Restoran Yönetim SaaS Sistemi
- **Lokasyon:** C:\Users\alkan\Projects\gastroiq
- **Son Güncelleme:** Haziran 2026

## STACK
- **Backend:** Node.js v22 + Express + Prisma ORM v6 + PostgreSQL 18
- **Frontend:** React + Vite + Tailwind CSS v4
- **Landing:** Next.js v16 (App Router, static export)
- **Veritabanı:** gastroiq_dev (PostgreSQL, localhost:5432)
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **Mail:** Nodemailer (SMTP/Gmail)
- **Cron:** node-cron (lisans uyarı job'ları)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — prisma.config.ts olmadan çalışıyor)
- Tailwind v4 kullanılıyor (@tailwindcss/vite plugin ile, tailwind.config.js YOK)
- PostgreSQL path'e ekli değil: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres`
- Frontend port: 5173, Backend port: 3001, Landing port: 3000
- Tema: Koyu (zinc-950 bg), lime-400 accent rengi
- PowerShell'de `$disconnect` ve `$transaction` inline node -e komutlarında sorun çıkarıyor → dosya olarak çalıştır
- landing klasörü gastroiq/landing altında (submodule değil, normal klasör)
- auth.store.js'de setKullanici fonksiyonu var — profil güncellemede kullanılıyor

## PORT & URL
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Landing: http://localhost:3000
- Super Admin: http://localhost:5173/super-admin
- Kullanım Kılavuzu: http://localhost:3000/rehber
- Yardım (uygulama içi): http://localhost:5173/yardim
- Profil: http://localhost:5173/profil
- Abonelik: http://localhost:5173/abonelik

## PRODUCTION URL'LERİ (Render)
- Frontend: https://gastrobrain-frontend.onrender.com
- Backend: https://gastrobrain-backend.onrender.com
- Landing: https://gastrobrain-landing.onrender.com

## VERİTABANI
- **gastroiq_dev** — PostgreSQL localhost:5432 (local)
- **eticaretdb_94wj** — Render PostgreSQL (production)
- Toplam 18 tablo (Prisma schema)

## TEST KULLANICILARI (local)
| Email | Şifre | Rol | Firma |
|-------|-------|-----|-------|
| admin@gastroiq.com | 123456 | TENANT_ADMIN | merkez-restoran |
| test@gastroiq.com | 123456 | MUDUR | merkez-restoran |
| super@gastroiq.com | 123456 | SUPER_ADMIN | merkez-restoran |

## PRODUCTION KULLANICILARI
| Email | Şifre | Rol |
|-------|-------|-----|
| super@gastroiq.com | 123456 | SUPER_ADMIN |
| nazar@gmail.com | — | TENANT_ADMIN (nazaret) |

## ORTAM DEĞİŞKENLERİ

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=senin@gmail.com
SMTP_PASS=gmail_uygulama_sifresi (16 haneli)
FEEDBACK_EMAIL=senin@gmail.com
APP_URL=https://gastrobrain-frontend.onrender.com
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://gastrobrain-backend.onrender.com
```

## TAMAMLANAN FAZLAR

### Faz 1 — Altyapı ✅
- Node.js v22, PostgreSQL 18, Git kurulu
- Backend: Express + Prisma + JWT auth
- Frontend: React + Vite + Tailwind
- Veritabanı şeması: 18 tablo
- Authentication: kayıt, giriş, JWT token, middleware
- Login sayfası çalışıyor

### Faz 2 — Çekirdek Modüller ✅
**Backend API'leri:**
- /api/auth — kayıt, giriş, token doğrulama, tenant listesi
- /api/kategoriler — CRUD
- /api/olcu-birimleri — CRUD
- /api/stok-kartlari — CRUD
- /api/cari-kartlar — CRUD
- /api/stok — giriş/iade faturası, zayi, tüketim, ay sonu sayım, stok durumu
- /api/receteler — CRUD + maliyet hesaplama
- /api/satislar — ekleme, listeleme, günlük toplam, silme
- /api/cari-hareketler — bakiyeler, ödeme, manuel hareket
- /api/personel — CRUD + maaş, avans, devam kayıtları
- /api/raporlar — satış, stok, cari, maliyet + Excel export
- /api/subeler — CRUD şube yönetimi
- /api/kullanicilar — CRUD + rol yönetimi

**Frontend Sayfaları:**
- Dashboard (günlük satış, kritik stok, bekleyen borç, hızlı erişim)
- Stok: Durum, Giriş/İade Faturası, Zayi, Tüketim, Ay Sonu Sayım
- Reçeteler (maliyet analizi dahil)
- Satışlar, Cari Hesap, Personel, Raporlama
- Tanımlamalar: Kategori, Ölçü Birimi, Stok Kartı, Cari Kart, Şube, Kullanıcı
- Gruplu sidebar menü (açılır/kapanır)

**Test:** Vitest kurulu, 11/11 unit test geçiyor

### Faz 3 — Multi-Tenant ✅
- Tenant modeli + tüm tablolara tenantId
- JWT token'a tenantId eklendi
- Login 2 adım: email → firma seç + şifre
- /api/auth/kayit-firma — tenant+şube+admin transaction
- /api/super-admin — SUPER_ADMIN korumalı
- Lisans bitiş kontrolü giriş sırasında

### Faz 4 — Production Ready ✅
- XSS, HPP koruması
- Rate limiting (IP bazlı + tenant+user bazlı)
- DB index'leri
- [ ] Otomatik yedekleme — deploy aşamasında
- [ ] Hata izleme (Sentry) — deploy aşamasında

### Faz 5 — Satış & Büyüme ✅
- [x] Landing page (Next.js static export, Render'da canlı)
- [x] Demo ortamı (demoSeed.service.js — kayıt olunca otomatik)
- [x] Kullanım kılavuzu
  - Landing: /rehber (8 konu, adım adım)
  - Uygulama içi: /yardim (SSS + arama)
- [x] Geri bildirim (FeedbackModal + /api/feedback + nodemailer)
- [x] Deploy — Render (backend + frontend + landing)

### Faz 5 Devam — Lisans & Abonelik ✅
- [x] Otomatik 30 gün ücretsiz lisans (kayıt olunca)
- [x] Hoşgeldin e-postası (kayıt sonrası otomatik)
- [x] Lisans bitiş uyarı maili (7 gün + 3 gün kala, cron job)
- [x] Uygulama içi Abonelik sayfası (/abonelik)
  - Aylık (₺799) / Yıllık (₺7.990) plan seçimi
  - IBAN + açıklama kopyalama
  - Ödeme talimatları
- [x] Super Admin hızlı lisans uzatma (+1 Ay / +1 Yıl butonları)
- [x] Lisans bitiş banner'ı (14 gün kala sarı, 3 gün kala kırmızı)
- [x] Profil sayfası (/profil)
  - Ad güncelleme
  - Şifre değiştirme
- [ ] İlk 5 beta müşteri — devam ediyor

## BACKEND API ENDPOINTLERİ (tam liste)

### Auth
- POST /api/auth/kayit
- POST /api/auth/giris
- GET  /api/auth/beni-getir
- POST /api/auth/kayit-firma
- POST /api/auth/tenant-listesi
- GET  /api/auth/lisans-durum ← YENİ

### Kullanıcılar
- GET    /api/kullanicilar
- POST   /api/kullanicilar
- PUT    /api/kullanicilar/profil ← YENİ
- PUT    /api/kullanicilar/sifre-degistir ← YENİ
- PUT    /api/kullanicilar/:id
- DELETE /api/kullanicilar/:id

### Diğerleri
- /api/kategoriler, /api/olcu-birimleri, /api/stok-kartlari, /api/cari-kartlar — CRUD
- /api/stok — giriş/iade/zayi/tüketim/sayım/durum
- /api/receteler — CRUD + maliyet
- /api/satislar — CRUD + günlük toplam
- /api/cari-hareketler — bakiye/ödeme/hareket
- /api/personel — CRUD + maaş/avans/devam
- /api/raporlar — satış/stok/cari/maliyet + Excel
- /api/subeler — CRUD
- /api/super-admin — istatistik/tenant/lisans yönetimi
- /api/feedback — mail gönderimi

## DOSYA YAPISI
```
gastroiq/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js         (lisansDurum eklendi)
│   │   │   ├── cariHareket.controller.js
│   │   │   ├── cariKart.controller.js
│   │   │   ├── feedback.controller.js
│   │   │   ├── kategori.controller.js
│   │   │   ├── kullanici.controller.js    (profilGuncelle, sifreDegistir eklendi)
│   │   │   ├── olcuBirimi.controller.js
│   │   │   ├── personel.controller.js
│   │   │   ├── rapor.controller.js
│   │   │   ├── recete.controller.js
│   │   │   ├── satis.controller.js
│   │   │   ├── stok.controller.js
│   │   │   ├── stokKart.controller.js
│   │   │   ├── sube.controller.js
│   │   │   └── superAdmin.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── rateLimit.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js             (lisans-durum eklendi)
│   │   │   ├── cariHareket.routes.js
│   │   │   ├── cariKart.routes.js
│   │   │   ├── feedback.routes.js
│   │   │   ├── kategori.routes.js
│   │   │   ├── kullanici.routes.js        (profil, sifre-degistir eklendi)
│   │   │   ├── olcuBirimi.routes.js
│   │   │   ├── personel.routes.js
│   │   │   ├── rapor.routes.js
│   │   │   ├── recete.routes.js
│   │   │   ├── satis.routes.js
│   │   │   ├── stok.routes.js
│   │   │   ├── stokKart.routes.js
│   │   │   ├── sube.routes.js
│   │   │   └── superAdmin.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js            (otomatik 30 gün lisans eklendi)
│   │   │   ├── cariHareket.service.js
│   │   │   ├── cariKart.service.js
│   │   │   ├── demoSeed.service.js
│   │   │   ├── kategori.service.js
│   │   │   ├── lisansUyari.service.js     ← YENİ (cron job)
│   │   │   ├── mail.service.js            ← YENİ (hosgeldin + uyari maili)
│   │   │   ├── olcuBirimi.service.js
│   │   │   ├── personel.service.js
│   │   │   ├── recete.service.js
│   │   │   ├── satis.service.js
│   │   │   ├── stok.service.js
│   │   │   └── stokKart.service.js
│   │   └── index.js                       (cron job başlatma eklendi)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── create-super-admin.js
│   ├── create-tenant2.js
│   ├── fix-tenant.js
│   ├── fix-super-admin.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── Layout.jsx                 (LisansBanner + Profil linki eklendi)
│   │   │   ├── LisansBanner.jsx           ← YENİ
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Table.jsx
│   │   ├── pages/
│   │   │   ├── Abonelik.jsx               ← YENİ
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KayitFirma.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profil.jsx                 ← YENİ
│   │   │   ├── SuperAdmin.jsx             (hızlı uzatma eklendi)
│   │   │   ├── Yardim.jsx
│   │   │   ├── cari/CariHesap.jsx
│   │   │   ├── personel/Personel.jsx
│   │   │   ├── raporlar/Raporlar.jsx
│   │   │   ├── recete/Receteler.jsx
│   │   │   ├── satis/Satislar.jsx
│   │   │   ├── stok/
│   │   │   │   ├── AySonuSayim.jsx
│   │   │   │   ├── GirisFaturasi.jsx
│   │   │   │   ├── IadeFaturasi.jsx
│   │   │   │   ├── StokDurumu.jsx
│   │   │   │   ├── TuketimGideri.jsx
│   │   │   │   └── ZayiGideri.jsx
│   │   │   └── tanimlamalar/
│   │   │       ├── CariKartlar.jsx
│   │   │       ├── Kategoriler.jsx
│   │   │       ├── Kullanicilar.jsx
│   │   │       ├── OlcuBirimleri.jsx
│   │   │       ├── StokKartlari.jsx
│   │   │       └── Subeler.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.service.js
│   │   ├── store/
│   │   │   └── auth.store.js              (setKullanici eklendi)
│   │   └── App.jsx                        (Abonelik, Profil route'ları eklendi)
│   └── .env
│
├── landing/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── rehber/
│   │       └── page.tsx
│   ├── public/
│   │   └── logo.png
│   ├── next.config.ts                     (output: export eklendi)
│   └── package.json
│
└── CONTEXT.md

## SUNUCU BAŞLATMA
```powershell
# Backend
cd C:\Users\alkan\Projects\gastroiq\backend
node src/index.js

# Frontend
cd C:\Users\alkan\Projects\gastroiq\frontend
npm run dev

# Landing
cd C:\Users\alkan\Projects\gastroiq\landing
npm run dev
```

## LİSANS SİSTEMİ
- Kayıt → otomatik 30 gün ücretsiz
- 7 gün kala → uyarı maili
- 3 gün kala → uyarı maili
- Uygulama içi banner (14 gün kala sarı, 3 gün kala kırmızı)
- Ödeme: havale/EFT → IBAN → super admin manuel uzatma
- Planlar: Aylık ₺799 / Yıllık ₺7.990

## GİTHUB
- Repo: https://github.com/Y994-SYS/gastrobrain
- Branch: main