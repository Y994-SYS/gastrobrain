@AGENTS.md
# GastroBrain — Proje Context Dosyası

## PROJE BİLGİLERİ
- **Proje:** GastroBrain — Restoran Yönetim SaaS Sistemi
- **Lokasyon:** C:\Users\alkan\Projects\gastroiq
- **Son Güncelleme:** Haziran 2026 (RBAC + Süper Admin İzolasyonu + Logo + Custom Domain)

## STACK
- **Backend:** Node.js v22 + Express + Prisma ORM v6 + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS v4
- **Landing:** Next.js v16 (App Router, static export)
- **Veritabanı:** Supabase PostgreSQL (production) — local PostgreSQL artık kullanılmıyor
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **Mail:** Nodemailer (SMTP/Gmail)
- **Cron:** node-cron (lisans uyarı job'ları)
- **Error Monitoring:** Sentry (@sentry/node)
- **Hosting:** Render.com (backend + frontend + landing, ayrı servisler)
- **DNS:** Cloudflare (gastrobrain.com.tr, İsimtescil'den alındı)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — güncelleme önerisini görmezden gel)
- Tailwind v4 kullanılıyor (@tailwindcss/vite plugin ile, tailwind.config.js YOK)
- Tema: Koyu (zinc-950 bg / #09090b), lime-400 accent (#a3e635)
- PowerShell'de inline node -e komutları sorun çıkarıyor → dosya olarak çalıştır
- Şema değişikliklerinde `npx prisma migrate dev` DEĞİL `npx prisma db push` kullan — migration history Supabase'de tutulmuyor, migrate dev "drift detected" deyip reset istiyor (VERİ KAYBI RİSKİ). db push veriyi koruyarak şemayı senkronize eder.
- Render Build Command'ı `npm install && npx prisma generate` olmalı — sadece npm install Prisma Client'ı eski şemadan üretilmiş halde bırakabilir
- auth.store.js'de setKullanici fonksiyonu var — profil güncellemede kullanılıyor

## PORT & URL (Local)
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Landing: http://localhost:3000
- Super Admin: http://localhost:5173/super-admin
- Kullanım Kılavuzu: http://localhost:3000/rehber
- Yardım: http://localhost:5173/yardim
- Profil: http://localhost:5173/profil
- Abonelik: http://localhost:5173/abonelik

## PRODUCTION URL'LERİ (Custom Domain — Cloudflare üzerinden)
- Landing: https://gastrobrain.com.tr (+ www)
- Frontend (App): https://app.gastrobrain.com.tr
- Backend (API): https://api.gastrobrain.com.tr
- Süper Admin: https://app.gastrobrain.com.tr/super-admin
- (Eski Render alt domainleri hâlâ çalışıyor olabilir ama artık custom domain birincil: gastrobrain-frontend.onrender.com, gastrobrain-backend.onrender.com, gastrobrain-landing.onrender.com)

### DNS Yapısı (Cloudflare — DNS only, proxy kapalı)
| Tür | Ad | Hedef |
|-----|----|-------|
| CNAME | @ (gastrobrain.com.tr) | gastrobrain-landing.onrender.com |
| CNAME | www | gastrobrain-landing.onrender.com |
| CNAME | app | gastrobrain-frontend.onrender.com |
| CNAME | api | gastrobrain-backend.onrender.com |

Nameserver: elinore.ns.cloudflare.com, woz.ns.cloudflare.com
Render Custom Domain durumu: tüm 4 domain Verified ✅ + Certificate Issued ✅
Landing APP_URL: https://app.gastrobrain.com.tr/kayit — Navbar'da "Giriş Yap" butonu app.gastrobrain.com.tr/login'e gidiyor

## VERİTABANI
- **Supabase PostgreSQL** — proje ID: cqeexgnzjlikyjxiphjf, aws-0-eu-west-1.pooler.supabase.com
- DATABASE_URL: port 6543, pgbouncer=true (Prisma transaction pooler)
- DIRECT_URL: port 5432 (migration/db push için)
- Toplam 19 tablo (Tenant, Kullanici, Sube, Kategori, OlcuBirimi, StokKart, StokHareket, Recete, ReceteKalem, Satis, CariKart, CariHareket, CariHareketKalem, Personel, PersonelMaas, PersonelAvans, PersonelDevam, AuditLog + diğer)
- Render'ın kendi ücretsiz PostgreSQL servisi (eski "eticaretdb_94wj") kullanılmıyor — Render backend'de DATABASE_URL'in gerçekten Supabase'e işaret ettiğinden emin ol (proje ID cqeexgnzjlikyjxiphjf geçmeli)

## ROL SİSTEMİ (6 Rol) — RBAC tam uygulandı
| Rol | Erişim |
|-----|--------|
| **SUPER_ADMIN** | Hiçbir tenant'a bağlı değil (`tenantId: null`, `subeId: null`). SADECE `/super-admin` panelini kullanabilir — normal uygulama sayfalarına (Stok, Satış, Kullanıcılar vb.) girmeye çalışırsa otomatik olarak `/super-admin`'e geri yönlendirilir. Bu hem frontend (`PrivateRoute`) hem backend (`rolKontrol` listelerinden çıkarıldı) seviyesinde uygulanıyor. |
| **TENANT_ADMIN** | Firma sahibi. Kendi tenant'ının tüm modüllerine erişir, kullanıcı/şube yönetir. |
| **MUDUR** | Stok, satış, reçete, cari, rapor, personel modüllerine erişir. Kullanıcı/şube yönetimine erişemez. |
| **DEPO** | Sadece stok modülü (giriş/iade faturası, zayi, tüketim, sayım, stok kartı/kategori/ölçü birimi tanımları). |
| **KASA** | Sadece satış ekranı. |
| **PERSONEL** | En kısıtlı. Sadece kendi devam/mesai/avans bilgisini görür. |

**ÖNEMLİ — `ADMIN` enum değeri kullanılmıyor:** Prisma şemasında `Rol` enum'unda `ADMIN` diye bir değer var ama hiçbir route/role-group bunu tanımıyor; gerçek admin rolü her zaman `TENANT_ADMIN`. Kullanıcı oluşturma formlarında asla `'ADMIN'` literal'ı kullanılmamalı, kullanıcı sisteme kilitlenir.

**🔒 Güvenlik kısıtı — SUPER_ADMIN asla normal kullanıcı oluşturma formundan atanamaz:** `kullanici.controller.js`'deki `ATANABILIR_ROLLER` whitelist'i (`TENANT_ADMIN`, `MUDUR`, `DEPO`, `KASA`, `PERSONEL`) sadece bu rollerin atanmasına izin veriyor. Bu kontrol olmadan bir TENANT_ADMIN kendi firmasında `rol: 'SUPER_ADMIN'` ile kullanıcı oluşturup global panele sızabilirdi — bu açık kapatıldı, hem backend hem frontend dropdown'unda.

## TEST KULLANICILARI (local + production)
| Email | Şifre | Rol | Tenant |
|-------|-------|-----|--------|
| super@gastroiq.com | 123456 | SUPER_ADMIN | YOK (tenantId: null — tam izole) |
| admin@gastroiq.com | 123456 | TENANT_ADMIN | merkez-restoran (varsa, local) |
| nazar@gmail.com | — | TENANT_ADMIN | nazaret (production) |

> Eski local test kullanıcı tablosunda `super@gastroiq.com`'un `merkez-restoran` tenant'ına bağlı göründüğü notlar varsa GÜNCEL DEĞİL — süper admin artık hiçbir tenant'a bağlı değil.

## TAMAMLANAN FAZLAR

### Faz 1 — Altyapı ✅
### Faz 2 — Çekirdek Modüller ✅
### Faz 3 — Multi-Tenant ✅
### Faz 4 — Production Ready ✅ (XSS/HPP, rate limiting, DB index, Supabase migration, race condition fix, Prisma middleware tenantId zorunluluğu, Sentry, audit log)
### Faz 5 — Satış & Büyüme ✅ (landing, demo, kılavuz, feedback, deploy)
### Faz 5 Devam — Lisans & Abonelik ✅ (30 gün otomatik lisans, hoşgeldin maili, uyarı cron, Abonelik sayfası, Süper Admin hızlı uzatma, lisans banner, Profil sayfası)
### Faz 6 — Stabilite & Monitoring ✅ (Supabase migration, race condition fix, Prisma middleware, connection pooling, Sentry, mobil uyumluluk, audit log)

### Faz 7 — Rol Bazlı Yetkilendirme (RBAC) ✅
**Backend:** Her route dosyasına `rolKontrol(...roller)` middleware'i eklendi:
- STOK modülü (stok, stokKart, kategori, olcuBirimi): `TENANT_ADMIN, MUDUR, DEPO`
- SATIS modülü: `TENANT_ADMIN, MUDUR, KASA`
- Finansal/Yönetim (cariKart, cariHareket, recete, rapor): `TENANT_ADMIN, MUDUR`
- Kullanıcı yönetimi: `TENANT_ADMIN` (sadece)
- Şube: okuma `TENANT_ADMIN, MUDUR` / yazma `TENANT_ADMIN` (sadece)
- Personel: yönetim `TENANT_ADMIN, MUDUR` / okuma + `PERSONEL` (sadece kendi kaydı)
- `/api/super-admin/*`: `SUPER_ADMIN` (sadece)
- **NOT: `SUPER_ADMIN` bilerek tenant-scoped route'ların hiçbirinde YOK** (aşağıdaki Faz 8'e bakın — sebebi orada açıklanıyor)

**Frontend:**
- `App.jsx` — her route `PrivateRoute roller={...}` ile sarıldı; `/super-admin` ayrı guard ile korunuyor
- `Layout.jsx` — sidebar `menuGruplari` rol bazlı filtreleniyor, boş kalan gruplar tamamen gizleniyor
- `Dashboard.jsx` — role özel 4 farklı görünüm: PersonelDashboard, KasaDashboard, DepoDashboard, YonetimDashboard
- `Yetkisiz.jsx` — yetkisiz erişim sayfası (mevcut rolü gösterir, geri dön/ana sayfa seçeneği sunar)
- `Login.jsx` — giriş sonrası rol bazlı yönlendirme: SUPER_ADMIN → /super-admin, diğerleri → /

### Faz 8 — Süper Admin Tam İzolasyonu ✅
**Sorun 1:** SUPER_ADMIN hesabı başlangıçta bir tenant'a (`tenantId: 1`) bağlıydı.
**Çözüm:**
- `schema.prisma`: `Kullanici.tenantId` opsiyonel yapıldı (`Int?`), `tenant` ilişkisi de opsiyonel (`Tenant?`)
- `npx prisma db push` ile Supabase'e veri kaybı olmadan uygulandı
- `auth.service.js` → `girisYap`: tenantSlug verilmemişse `tenantId: null + rol: SUPER_ADMIN` kaydını arıyor
- `auth.service.js` → `tenantListesiGetir`: tenantId null kullanıcılar için "Süper Admin Paneli" seçeneği dönüyor
- Mevcut süper admin kaydı `UPDATE ... SET tenantId = null, subeId = null` ile izole edildi

**Sorun 2 (kritik):** İzolasyon sonrası SUPER_ADMIN normal tenant sayfalarına (Şubeler, Stok Kartları vb.) girmeye çalışınca `Argument tenant is missing` / `Invalid prisma.X.create()` hataları aldı — çünkü bu sayfalar `req.kullanici.tenantId`'yi kullanıyor ve artık `null` geliyor.
**Çözüm:** SUPER_ADMIN, tüm tenant-scoped backend route'larının `rolKontrol(...)` listelerinden VE frontend `R` rol gruplarından (App.jsx, Layout.jsx) tamamen çıkarıldı. `PrivateRoute`'a şu kural eklendi: SUPER_ADMIN hangi route'a gitmeye çalışırsa çalışsın otomatik `/super-admin`'e yönlendirilir.

**Sonuç:** SUPER_ADMIN artık mimari olarak da pratikte de tamamen izole — hiçbir firmanın verisine/kullanıcı sayısına dahil değil, hiçbir tenant CRUD işlemine erişemez, sadece kendi global panelini kullanır.

### Faz 9 — Küçük İyileştirmeler ✅
- **Kullanıcı Yönetimi mobil uyumlu hale getirildi** (`Kullanicilar.jsx`): `sm` altında tablo yerine kart görünümü, modal `max-h-[90vh] overflow-y-auto` ile taşma engellendi, alt butonlar sticky
- **Kullanıcı eklerken rol bilgi kutusu**: Rol seçilince dropdown altında o rolün tam yetki açıklaması renkli kutu olarak gösteriliyor (`ROL_ACIKLAMA` map'i)
- **Yardım sayfasına "Roller ve Yetkiler" bölümü eklendi** (`Yardim.jsx`): rollerin tanımları, hangi rolün hangi sayfayı gördüğü tablosu, rol değiştirme talimatı
- **Logo eklendi**: `frontend/public/logo.png` (şeffaf arka planlı PNG, landing'deki logodan üretildi), `Layout.jsx` (sidebar header + mobil header) ve `Login.jsx`'e (giriş ekranı başlığı) logo+yazı yan yana eklendi
- **`Satislar.jsx` hata yönetimi düzeltildi**: Önceden 3 API isteği tek `Promise.all` içindeydi, biri patlarsa hepsi sessizce boş kalıyordu (reçete dropdown'u boş geliyordu, hata görünmüyordu). Artık her istek ayrı `try/catch` ile yönetiliyor, gerçek hata mesajı toast olarak gösteriliyor, dropdown boşsa uyarı metni çıkıyor.

## ORTAM DEĞİŞKENLERİ

### Backend (.env)
```
DATABASE_URL=postgresql://postgres.cqeexgnzjlikyjxiphjf:****@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.cqeexgnzjlikyjxiphjf:****@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=... (16 haneli gmail uygulama şifresi)
FEEDBACK_EMAIL=...
APP_URL=https://app.gastrobrain.com.tr
NODE_ENV=production
SENTRY_DSN=...
```
Render backend'de AYNI DATABASE_URL/DIRECT_URL tanımlı olmalı (Environment sekmesinden kontrol edilebilir) — proje ID cqeexgnzjlikyjxiphjf geçmeli, yoksa yanlış/eski veritabanına bağlanıyordur.

### Frontend (.env)
```
VITE_API_URL=https://api.gastrobrain.com.tr
```

## BACKEND API ENDPOINTLERİ (tam liste)

### Auth
- POST /api/auth/kayit
- POST /api/auth/giris
- GET  /api/auth/beni-getir
- POST /api/auth/kayit-firma
- POST /api/auth/tenant-listesi
- GET  /api/auth/lisans-durum
- GET  /api/audit-log (ADMIN+)

### Kullanıcılar
- GET    /api/kullanicilar (TENANT_ADMIN)
- POST   /api/kullanicilar (TENANT_ADMIN — SUPER_ADMIN rolü atanamaz, whitelist korumalı)
- PUT    /api/kullanicilar/profil (herkes, kendi profili)
- PUT    /api/kullanicilar/sifre-degistir (herkes, kendi şifresi)
- PUT    /api/kullanicilar/:id (TENANT_ADMIN)
- DELETE /api/kullanicilar/:id (TENANT_ADMIN)

### Diğerleri (rol kısıtları yukarıdaki ROL SİSTEMİ tablosunda)
- /api/kategoriler, /api/olcu-birimleri, /api/stok-kartlari — DEPO+MUDUR+ADMIN
- /api/cari-kartlar, /api/cari-hareketler, /api/receteler, /api/raporlar — MUDUR+ADMIN
- /api/stok — giriş/iade/zayi/tüketim/sayım/durum — DEPO+MUDUR+ADMIN
- /api/satislar — CRUD + günlük toplam — KASA+MUDUR+ADMIN
- /api/personel — yönetim MUDUR+ADMIN, okuma +PERSONEL
- /api/subeler — okuma MUDUR+ADMIN, yazma sadece ADMIN
- /api/super-admin — istatistik/tenant/lisans yönetimi — SADECE SUPER_ADMIN
- /api/feedback — herkes (giriş yapmış)

## DOSYA YAPISI (önemli/değişen dosyalar)
```
gastroiq/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── kullanici.controller.js    (ATANABILIR_ROLLER whitelist — SUPER_ADMIN ataması engellendi)
│   │   │   └── ... (diğerleri Faz 1-6'daki gibi)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         (authMiddleware + rolKontrol)
│   │   │   └── rateLimit.middleware.js
│   │   ├── routes/
│   │   │   └── (TÜM route dosyaları rolKontrol ile güncellendi, SUPER_ADMIN tenant-scoped olanlardan çıkarıldı)
│   │   ├── services/
│   │   │   └── auth.service.js            (SUPER_ADMIN tenant'sız giriş desteği)
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma                  (Kullanici.tenantId opsiyonel — Int?)
│   ├── izole-et-super-admin.js            (süper admini tenant'sız hale getiren tek seferlik script)
│   ├── check-tenants.js                   (tenant/şube ID'lerini listeleyen tanı scripti)
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── logo.png                       ← YENİ (şeffaf arka planlı)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx                 (logo + rol bazlı sidebar filtreleme)
│   │   │   ├── LisansBanner.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Login.jsx                  (logo + rol bazlı yönlendirme)
│   │   │   ├── Dashboard.jsx              (rol bazlı 4 farklı görünüm)
│   │   │   ├── Yetkisiz.jsx               ← YENİ
│   │   │   ├── Yardim.jsx                 (Roller ve Yetkiler bölümü eklendi)
│   │   │   ├── Profil.jsx
│   │   │   ├── Abonelik.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── satis/Satislar.jsx         (hata yönetimi düzeltildi)
│   │   │   └── tanimlamalar/
│   │   │       └── Kullanicilar.jsx       (mobil kart görünümü + rol yetki bilgi kutusu + SUPER_ADMIN/ADMIN bug fix)
│   │   └── App.jsx                        (her route PrivateRoute korumalı, SUPER_ADMIN her zaman /super-admin'e yönlenir)
│   └── .env
│
├── landing/
│   └── (değişmedi)
│
└── CONTEXT.md / AGENTS.md
```

## ŞEMA DEĞİŞİKLİĞİ YAPARKEN İZLENECEK SIRA
1. `backend/prisma/schema.prisma` düzenle
2. `cd backend && npx prisma db push` (Supabase'e uygula, veri korunur — migrate dev KULLANMA)
3. `npx prisma generate` (local Prisma Client'ı yenile)
4. Gerekiyorsa tek seferlik veri migration scripti yaz ve çalıştır
5. `git add . && git commit -m "..." && git push`
6. Render otomatik deploy eder (Build Command'da prisma generate olduğu için yeni client orada da üretilir)

## BİLİNEN RİSKLER / TAKİP EDİLECEKLER
- İleride birden fazla SUPER_ADMIN eklenirse, email üzerinde `tenantId IS NULL` koşullu partial unique index eklenmesi düşünülebilir (şu an tek süper admin olduğu için risk değil)
- Render free tier disk kalıcı değil — veritabanı zaten Supabase'e taşındı, sorun çözüldü
- İlk 5 beta müşteri — devam ediyor

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
- 7 gün kala → uyarı maili, 3 gün kala → uyarı maili
- Uygulama içi banner (14 gün kala sarı, 3 gün kala kırmızı)
- Ödeme: havale/EFT → IBAN → super admin manuel uzatma (+1 Ay / +1 Yıl butonları)
- Planlar: Aylık ₺799 / Yıllık ₺7.990

## GİTHUB
- Repo: https://github.com/Y994-SYS/gastrobrain
- Branch: main