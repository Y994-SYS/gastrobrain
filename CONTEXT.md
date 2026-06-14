# GastroIQ — Proje Context Dosyası

## PROJE BİLGİLERİ
- **Proje:** GastroIQ — Restoran Yönetim SaaS Sistemi
- **Lokasyon:** C:\Users\alkan\Projects\gastroiq
- **Son Güncelleme:** Haziran 2026

## STACK
- **Backend:** Node.js v22 + Express + Prisma ORM v6 + PostgreSQL 18
- **Frontend:** React + Vite + Tailwind CSS v4
- **Veritabanı:** gastroiq_dev (PostgreSQL, localhost:5432)
- **Auth:** JWT (bcryptjs + jsonwebtoken)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — prisma.config.ts olmadan çalışıyor)
- Tailwind v4 kullanılıyor (@tailwindcss/vite plugin ile, tailwind.config.js YOK)
- PostgreSQL path'e ekli değil: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres`
- Frontend port: 5173, Backend port: 3001
- Tema: Koyu (zinc-950 bg), lime-400 accent rengi
- PowerShell'de `$disconnect` ve `$transaction` inline node -e komutlarında sorun çıkarıyor → dosya olarak çalıştır

## PORT & URL
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Super Admin: http://localhost:5173/super-admin

## VERİTABANI
- **gastroiq_dev** — PostgreSQL localhost:5432
- Toplam 18 tablo (Prisma schema)

## TEST KULLANICILARI
| Email | Şifre | Rol | Firma |
|-------|-------|-----|-------|
| admin@gastroiq.com | 123456 | TENANT_ADMIN | merkez-restoran |
| test@gastroiq.com | 123456 | MUDUR | merkez-restoran |
| super@gastroiq.com | 123456 | SUPER_ADMIN | merkez-restoran |

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
- Satışlar
- Cari Hesap
- Personel (maaş, avans, devam)
- Tanımlamalar: Kategori, Ölçü Birimi, Stok Kartı, Cari Kart
- Raporlama (satış, stok, cari, maliyet + Excel)
- Şube Yönetimi
- Kullanıcı Yönetimi
- Gruplu sidebar menü (açılır/kapanır)

**Test:**
- Vitest kurulu, 11/11 unit test geçiyor

### Faz 3 — Multi-Tenant ✅
- Tenant modeli eklendi (Prisma schema)
- Tüm tablolara tenantId foreign key eklendi
- Unique constraint'ler tenant bazlı güncellendi (email+tenantId, kod+tenantId vb.)
- JWT token'a tenantId eklendi
- Login 2 adıma bölündü: email → firma seç + şifre
- Tüm service/controller'lar tenantId filtresiyle güncellendi
- POST /api/auth/kayit-firma — yeni firma kaydı (tenant+şube+admin transaction)
- POST /api/auth/tenant-listesi — email ile firma listesi
- /api/super-admin — tenant yönetimi (SUPER_ADMIN korumalı)
- Süper admin paneli: tenant listesi, detay, aktif/pasif, plan, lisans yönetimi
- Tenant modeline lisansBitis ve lisansNot alanları eklendi
- Lisans süresi kontrolü giriş sırasında yapılıyor

### Faz 4 — Production Ready ✅
- [x] Güvenlik testleri — XSS, HPP koruması eklendi
- [x] Rate limiting — tenant+user bazlı akıllı rate limiting
  - Giriş/kayıt: IP bazlı sıkı limit (brute-force koruması)
  - Genel API: tenant+user bazlı (restoran içi çakışma yok)
  - Kritik işlemler (stok, satış): ayrı limit katmanı
  - 429 hatası retryAfter ile frontend'e toast bildirimi
- [x] Performans optimizasyonu — DB index'leri eklendi
- [ ] Otomatik yedekleme — deploy aşamasında yapılacak
- [ ] Hata izleme (Sentry) — deploy aşamasında eklenecek
## SIRADAKI FAZ
gastroiq/

├── backend/

│   ├── src/

│   │   ├── controllers/

│   │   │   ├── auth.controller.js

│   │   │   ├── cariHareket.controller.js

│   │   │   ├── cariKart.controller.js

│   │   │   ├── kategori.controller.js

│   │   │   ├── kullanici.controller.js

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

│   │   │   └── auth.middleware.js

│   │   ├── routes/

│   │   │   ├── auth.routes.js

│   │   │   ├── cariHareket.routes.js

│   │   │   ├── cariKart.routes.js

│   │   │   ├── kategori.routes.js

│   │   │   ├── kullanici.routes.js

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

│   │   │   ├── auth.service.js

│   │   │   ├── cariHareket.service.js

│   │   │   ├── cariKart.service.js

│   │   │   ├── kategori.service.js

│   │   │   ├── olcuBirimi.service.js

│   │   │   ├── personel.service.js

│   │   │   ├── recete.service.js

│   │   │   ├── satis.service.js

│   │   │   ├── stok.service.js

│   │   │   └── stokKart.service.js

│   │   └── index.js

│   ├── prisma/

│   │   ├── schema.prisma

│   │   └── seed.js

│   └── .env

├── frontend/

│   ├── src/

│   │   ├── components/

│   │   │   ├── Layout.jsx

│   │   │   ├── LoadingSpinner.jsx

│   │   │   ├── Modal.jsx

│   │   │   └── Table.jsx

│   │   ├── pages/

│   │   │   ├── Dashboard.jsx

│   │   │   ├── KayitFirma.jsx

│   │   │   ├── Login.jsx

│   │   │   ├── SuperAdmin.jsx

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

│   │   │   └── auth.store.js

│   │   └── App.jsx

│   └── .env

└── CONTEXT.md
## YARDIMCI DOSYALAR (backend klasöründe)
- create-tenant2.js — test tenant oluşturma
- create-super-admin.js — süper admin oluşturma
- fix-tenant.js — tenant aktif etme
- fix-super-admin.js — süper admin şifre sıfırlama
## DOSYA YAPISI