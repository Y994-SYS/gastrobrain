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
- **Veritabanı:** Supabase PostgreSQL (production), localhost:5432 (local)
- **Error Monitoring:** Sentry (@sentry/node)
Hosting: Render.com (backend + frontend + landing, ayrı servisler)
DNS: Cloudflare (gastrobrain.com.tr, İsimtescil'den alındı)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — prisma.config.ts olmadan çalışıyor)
- Tailwind v4 kullanılıyor (@tailwindcss/vite plugin ile, tailwind.config.js YOK)
- PostgreSQL path'e ekli değil: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres`
- Frontend port: 5173, Backend port: 3001, Landing port: 3000
- Tema: Koyu (zinc-950 bg), lime-400 accent rengi
- PowerShell'de `$disconnect` ve `$transaction` inline node -e komutlarında sorun çıkarıyor → dosya olarak çalıştır
- landing klasörü gastroiq/landing altında (submodule değil, normal klasör)
- auth.store.js'de setKullanici fonksiyonu var — profil güncellemede kullanılıyor
-Şema değişikliklerinde npx prisma migrate dev DEĞİL npx prisma db push kullan — migration history Supabase'de tutulmuyor, migrate dev "drift detected" deyip reset istiyor (VERİ KAYBI RİSKİ). db push veriyi koruyarak şemayı senkronize eder.
-Render Build Command'ı npm install && npx prisma generate olmalı — sadece npm install Prisma Client'ı eski şemadan üretilmiş halde bırakabilir

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
- Landing: https://gastrobrain.com.tr (+ www)
-Frontend (App): https://app.gastrobrain.com.tr
-Backend (API): https://api.gastrobrain.com.tr
-Süper Admin: https://app.gastrobrain.com.tr/super-admin
-(Eski Render alt domainleri hâlâ çalışıyor olabilir ama artık custom domain birincil: gastrobrain-frontend.onrender.com, gastrobrain-backend.onrender.com, gastrobrain-landing.onrender.com)

DNS Yapısı (Cloudflare — DNS only, proxy kapalı)

TürAdHedefCNAME@ (gastrobrain.com.tr)gastrobrain-landing.onrender.comCNAMEwwwgastrobrain-landing.onrender.comCNAMEappgastrobrain-frontend.onrender.comCNAMEapigastrobrain-backend.onrender.com

Nameserver: elinore.ns.cloudflare.com, woz.ns.cloudflare.com
Render Custom Domain durumu: tüm 4 domain Verified ✅ + Certificate Issued ✅
Landing APP_URL: https://app.gastrobrain.com.tr/kayit — Navbar'da "Giriş Yap" butonu app.gastrobrain.com.tr/giris'e gidiyor

## VERİTABANI
- **gastroiq_dev** — PostgreSQL localhost:5432 (local)
- *Supabase PostgreSQL — proje ID: cqeexgnzjlikyjxiphjf, aws-0-eu-west-1.pooler.supabase.com
DATABASE_URL: port 6543, pgbouncer=true (Prisma transaction pooler)
DIRECT_URL: port 5432 (migration/db push için)
Toplam 19 tablo (Tenant, Kullanici, Sube, Kategori, OlcuBirimi, StokKart, StokHareket, Recete, ReceteKalem, Satis, CariKart, CariHareket, CariHareketKalem, Personel, PersonelMaas, PersonelAvans, PersonelDevam, AuditLog + diğer)
Render'ın kendi ücretsiz PostgreSQL servisi (eski "eticaretdb_94wj") kullanılmıyor — Render backend'de DATABASE_URL'in gerçekten Supabase'e işaret ettiğinden emin ol (proje ID cqeexgnzjlikyjxiphjf geçmeli)


##ROL SİSTEMİ (6 Rol) — RBAC tam uygulandı

RolErişimSUPER_ADMINHiçbir tenant'a bağlı değil (tenantId: null, subeId: null). SADECE /super-admin panelini kullanabilir — normal uygulama sayfalarına (Stok, Satış, Kullanıcılar vb.) girmeye çalışırsa otomatik olarak /super-admin'e geri yönlendirilir. Bu hem frontend (PrivateRoute) hem backend (rolKontrol listelerinden çıkarıldı) seviyesinde uygulanıyor.TENANT_ADMINFirma sahibi. Kendi tenant'ının tüm modüllerine erişir, kullanıcı/şube yönetir.MUDURStok, satış, reçete, cari, rapor, personel modüllerine erişir. Kullanıcı/şube yönetimine erişemez.DEPOSadece stok modülü (giriş/iade faturası, zayi, tüketim, sayım, stok kartı/kategori/ölçü birimi tanımları).KASASadece satış ekranı.PERSONELEn kısıtlı. Sadece kendi devam/mesai/avans bilgisini görür.

ÖNEMLİ — ADMIN enum değeri kullanılmıyor: Prisma şemasında Rol enum'unda ADMIN diye bir değer var ama hiçbir route/role-group bunu tanımıyor; gerçek admin rolü her zaman TENANT_ADMIN. Kullanıcı oluşturma formlarında asla 'ADMIN' literal'ı kullanılmamalı, kullanıcı sisteme kilitlenir.

🔒 Güvenlik kısıtı — SUPER_ADMIN asla normal kullanıcı oluşturma formundan atanamaz: kullanici.controller.js'deki ATANABILIR_ROLLER whitelist'i (TENANT_ADMIN, MUDUR, DEPO, KASA, PERSONEL) sadece bu rollerin atanmasına izin veriyor. Bu kontrol olmadan bir TENANT_ADMIN kendi firmasında rol: 'SUPER_ADMIN' ile kullanıcı oluşturup global panele sızabilirdi — bu açık kapatıldı, hem backend hem frontend dropdown'unda.

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
DIRECT_URL=postgresql://postgres.cqeexgnzjlikyjxiphjf:****@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=senin@gmail.com
SMTP_PASS=gmail_uygulama_sifresi (16 haneli)
FEEDBACK_EMAIL=senin@gmail.com
APP_URL=https://app.gastrobrain.com.tr
NODE_ENV=production
SENTRY_DSN=...
```

### Frontend (.env)
```
VITE_API_URL=https://api.gastrobrain.com.tr

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
- [x] Supabase migration (connection pooling dahil) ← YENİ
- [x] Race condition fix (stok azaltma atomik) ← YENİ
- [x] Prisma middleware (tenantId zorunluluğu) ← YENİ
- [x] Hata izleme (Sentry) ✅ ← GÜNCELLENDİ
- [x] Audit log sistemi (AuditLog modeli + service + endpoint + frontend sayfası)
- [ ] Otomatik yedekleme — Supabase otomatik yapıyor ✅ ← GÜNCELLENDİ

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

### Faz 6 — Stabilite & Monitoring ✅
- [x] Supabase migration (connection pooling dahil)
- [x] Race condition fix (stok azaltma atomik, transaction içinde kontrol)
- [x] Prisma middleware (tenantId zorunluluğu — index.js)
- [x] Connection pooling (Supabase pgBouncer, directUrl migrations için)
- [x] Sentry entegrasyonu (@sentry/node, instrument.js)
- [x] Mobil uyumluluk (hamburger menü, responsive grid, tablo sütun gizleme)
- [x] Audit log sistemi (AuditLog modeli, service, endpoint, frontend sayfası)

Faz 7 — Rol Bazlı Yetkilendirme (RBAC) ✅

Backend: Her route dosyasına rolKontrol(...roller) middleware'i eklendi:


STOK modülü (stok, stokKart, kategori, olcuBirimi): TENANT_ADMIN, MUDUR, DEPO
SATIS modülü: TENANT_ADMIN, MUDUR, KASA
Finansal/Yönetim (cariKart, cariHareket, recete, rapor): TENANT_ADMIN, MUDUR
Kullanıcı yönetimi: TENANT_ADMIN (sadece)
Şube: okuma TENANT_ADMIN, MUDUR / yazma TENANT_ADMIN (sadece)
Personel: yönetim TENANT_ADMIN, MUDUR / okuma + PERSONEL (sadece kendi kaydı)
/api/super-admin/*: SUPER_ADMIN (sadece)
NOT: SUPER_ADMIN bilerek tenant-scoped route'ların hiçbirinde YOK (aşağıdaki Faz 8'e bakın — sebebi orada açıklanıyor)


Frontend:


App.jsx — her route PrivateRoute roller={...} ile sarıldı; /super-admin ayrı guard ile korunuyor
Layout.jsx — sidebar menuGruplari rol bazlı filtreleniyor, boş kalan gruplar tamamen gizleniyor
Dashboard.jsx — role özel 4 farklı görünüm: PersonelDashboard, KasaDashboard, DepoDashboard, YonetimDashboard
Yetkisiz.jsx — yetkisiz erişim sayfası (mevcut rolü gösterir, geri dön/ana sayfa seçeneği sunar)
Login.jsx — giriş sonrası rol bazlı yönlendirme: SUPER_ADMIN → /super-admin, diğerleri → /


Faz 8 — Süper Admin Tam İzolasyonu ✅

Sorun 1: SUPER_ADMIN hesabı başlangıçta bir tenant'a (tenantId: 1) bağlıydı.
Çözüm:


schema.prisma: Kullanici.tenantId opsiyonel yapıldı (Int?), tenant ilişkisi de opsiyonel (Tenant?)
npx prisma db push ile Supabase'e veri kaybı olmadan uygulandı
auth.service.js → girisYap: tenantSlug verilmemişse tenantId: null + rol: SUPER_ADMIN kaydını arıyor
auth.service.js → tenantListesiGetir: tenantId null kullanıcılar için "Süper Admin Paneli" seçeneği dönüyor
Mevcut süper admin kaydı UPDATE ... SET tenantId = null, subeId = null ile izole edildi


Sorun 2 (kritik): İzolasyon sonrası SUPER_ADMIN normal tenant sayfalarına (Şubeler, Stok Kartları vb.) girmeye çalışınca Argument tenant is missing / Invalid prisma.X.create() hataları aldı — çünkü bu sayfalar req.kullanici.tenantId'yi kullanıyor ve artık null geliyor.
Çözüm: SUPER_ADMIN, tüm tenant-scoped backend route'larının rolKontrol(...) listelerinden VE frontend R rol gruplarından (App.jsx, Layout.jsx) tamamen çıkarıldı. PrivateRoute'a şu kural eklendi: SUPER_ADMIN hangi route'a gitmeye çalışırsa çalışsın otomatik /super-admin'e yönlendirilir.

Sonuç: SUPER_ADMIN artık mimari olarak da pratikte de tamamen izole — hiçbir firmanın verisine/kullanıcı sayısına dahil değil, hiçbir tenant CRUD işlemine erişemez, sadece kendi global panelini kullanır.

Faz 9 — Küçük İyileştirmeler ✅


Kullanıcı Yönetimi mobil uyumlu hale getirildi (Kullanicilar.jsx): sm altında tablo yerine kart görünümü, modal max-h-[90vh] overflow-y-auto ile taşma engellendi, alt butonlar sticky
Kullanıcı eklerken rol bilgi kutusu: Rol seçilince dropdown altında o rolün tam yetki açıklaması renkli kutu olarak gösteriliyor (ROL_ACIKLAMA map'i)
Yardım sayfasına "Roller ve Yetkiler" bölümü eklendi (Yardim.jsx): rollerin tanımları, hangi rolün hangi sayfayı gördüğü tablosu, rol değiştirme talimatı
Logo eklendi: frontend/public/logo.png (şeffaf arka planlı PNG, landing'deki logodan üretildi), Layout.jsx (sidebar header + mobil header) ve Login.jsx'e (giriş ekranı başlığı) logo+yazı yan yana eklendi
Satislar.jsx hata yönetimi düzeltildi: Önceden 3 API isteği tek Promise.all içindeydi, biri patlarsa hepsi sessizce boş kalıyordu (reçete dropdown'u boş geliyordu, hata görünmüyordu). Artık her istek ayrı try/catch ile yönetiliyor, gerçek hata mesajı toast olarak gösteriliyor, dropdown boşsa uyarı metni çıkıyor.

## BACKEND API ENDPOINTLERİ (tam liste)

### Auth
- POST /api/auth/kayit
- POST /api/auth/giris
- GET  /api/auth/beni-getir
- POST /api/auth/kayit-firma
- POST /api/auth/tenant-listesi
- GET  /api/auth/lisans-durum ← YENİ
- GET /api/audit-log (ADMIN+)

### Kullanıcılar
GET    /api/kullanicilar (TENANT_ADMIN)
POST   /api/kullanicilar (TENANT_ADMIN — SUPER_ADMIN rolü atanamaz, whitelist korumalı)
PUT    /api/kullanicilar/profil (herkes, kendi profili)
PUT    /api/kullanicilar/sifre-degistir (herkes, kendi şifresi)
PUT    /api/kullanicilar/:id (TENANT_ADMIN)
DELETE /api/kullanicilar/:id (TENANT_ADMIN)

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
│   │   │   ├── auth.controller.js              # lisansDurum eklendi
│   │   │   ├── cariHareket.controller.js
│   │   │   ├── cariKart.controller.js
│   │   │   ├── feedback.controller.js
│   │   │   ├── kategori.controller.js
│   │   │   ├── kullanici.controller.js         # ATANABILIR_ROLLER whitelist (SUPER_ADMIN ataması engellendi) + profilGuncelle, sifreDegistir
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
│   │   │   ├── auth.middleware.js              # authMiddleware + rolKontrol (SUPER_ADMIN tenant‑scoped olanlardan çıkarıldı)
│   │   │   └── rateLimit.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js                  # /lisans-durum eklendi
│   │   │   ├── auditLog.routes.js
│   │   │   ├── cariHareket.routes.js
│   │   │   ├── cariKart.routes.js
│   │   │   ├── feedback.routes.js
│   │   │   ├── kategori.routes.js
│   │   │   ├── kullanici.routes.js             # /profil, /sifre-degistir eklendi
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
│   │   │   ├── auth.service.js                 # SUPER_ADMIN tenant'sız giriş desteği + otomatik 30 gün lisans
│   │   │   ├── auditLog.service.js
│   │   │   ├── cariHareket.service.js
│   │   │   ├── cariKart.service.js
│   │   │   ├── demoSeed.service.js
│   │   │   ├── kategori.service.js
│   │   │   ├── lisansUyari.service.js          # 🆕 cron job – lisans bitiş uyarıları
│   │   │   ├── mail.service.js                 # 🆕 hoş geldin ve uyarı e‑postaları
│   │   │   ├── olcuBirimi.service.js
│   │   │   ├── personel.service.js
│   │   │   ├── recete.service.js
│   │   │   ├── satis.service.js
│   │   │   ├── stok.service.js
│   │   │   └── stokKart.service.js
│   │   └── index.js                            # cron job başlatma eklendi
│   ├── prisma/
│   │   ├── schema.prisma                       # Kullanici.tenantId → Int? (opsiyonel)
│   │   ├── seed.js
│   │   └── ...
│   ├── izole-et-super-admin.js                 # 🆕 SUPER_ADMIN'i tenant'sız hale getiren tek seferlik script
│   ├── check-tenants.js                        # 🆕 tenant/şube ID'lerini listeleyen script
│   ├── create-super-admin.js
│   ├── create-tenant2.js
│   ├── fix-tenant.js
│   ├── fix-super-admin.js
│   └── .env
│
├── frontend/
│   ├── public/
│   │   └── logo.png                            # 🆕 şeffaf arka planlı logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx                      # logo + rol bazlı sidebar filtreleme, LisansBanner, Profil linki
│   │   │   ├── LisansBanner.jsx                # 🆕 lisans durumu banner'ı
│   │   │   ├── FeedbackModal.jsx               # 🆕 geri bildirim modal'ı
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Table.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx                       # logo + rol bazlı yönlendirme
│   │   │   ├── Dashboard.jsx                   # rol bazlı 4 farklı görünüm
│   │   │   ├── Yetkisiz.jsx                    # 🆕 yetkisiz erişim sayfası
│   │   │   ├── Yardim.jsx                      # Roller ve Yetkiler bölümü eklendi
│   │   │   ├── Profil.jsx                      # 🆕 kullanıcı profil sayfası
│   │   │   ├── Abonelik.jsx                    # 🆕 lisans/abonelik yönetimi
│   │   │   ├── AuditLog.jsx                    # 🆕 denetim günlüğü
│   │   │   ├── KayitFirma.jsx
│   │   │   ├── SuperAdmin.jsx                  # hızlı uzatma butonu eklendi
│   │   │   ├── satis/Satislar.jsx              # hata yönetimi düzeltildi
│   │   │   └── tanimlamalar/
│   │   │       └── Kullanicilar.jsx            # mobil kart görünümü + rol yetki bilgi kutusu + SUPER_ADMIN/ADMIN bug fix
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.service.js
│   │   ├── store/
│   │   │   └── auth.store.js                   # setKullanici eklendi
│   │   └── App.jsx                             # her route PrivateRoute korumalı, SUPER_ADMIN → /super-admin, Abonelik/Profil route'ları
│   └── .env
│
├── landing/                                     # (değişmedi)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── rehber/
│   │       └── page.tsx
│   ├── public/
│   │   └── logo.png
│   ├── next.config.ts                           # output: export
│   └── package.json
│
└── CONTEXT.md                                   # bu dosya

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

### Audit Log
- GET /api/audit-log  (ADMIN+)

# GastroBrain — Proje Bağlamı

## Genel Mimari
- **Landing:** gastrobrain.com.tr (Next.js, gastrobrain-landing servisi)
- **Frontend (App):** app.gastrobrain.com.tr (gastrobrain-frontend servisi)
- **Backend (API):** api.gastrobrain.com.tr (gastrobrain-backend servisi)
- **Hosting:** Render.com
- **DNS:** Cloudflare (nameserver üzerinden)
- **Domain:** gastrobrain.com.tr (İsimtescil'den alındı)

## DNS Yapısı (Cloudflare)
| Tür | Ad | Hedef |
|-----|----|-------|
| CNAME | @ (gastrobrain.com.tr) | gastrobrain-landing.onrender.com |
| CNAME | www | gastrobrain-landing.onrender.com |
| CNAME | app | gastrobrain-frontend.onrender.com |
| CNAME | api | gastrobrain-backend.onrender.com |

Tüm kayıtlar: **DNS only** (proxy kapalı)

## Render Custom Domain Durumu
- gastrobrain.com.tr → Verified ✅ + Certificate Issued ✅
- www.gastrobrain.com.tr → Verified ✅ + Certificate Issued ✅
- app.gastrobrain.com.tr → Verified ✅ + Certificate Issued ✅
- api.gastrobrain.com.tr → Verified ✅ + Certificate Issued ✅

## Cloudflare Nameservers
- elinore.ns.cloudflare.com
- woz.ns.cloudflare.com

## Önemli Notlar
- Render free PostgreSQL (e-ticaret-db) süresi doldu, 14 gün içinde ücretli plana geçilmeli veya Supabase/Neon'a taşınmalı
- Landing APP_URL: https://app.gastrobrain.com.tr/kayit
- Navbar'a Giriş Yap butonu eklendi (https://app.gastrobrain.com.tr/login)

## Landing Sayfası (page.tsx)
- Framework: Next.js (App Router)
- Stil: Inline CSS (style tag içinde)
- Renk paleti: #09090b (bg), #a3e635 (lime/vurgu), #fff (text)

BİLİNEN RİSKLER / TAKİP EDİLECEKLER


İleride birden fazla SUPER_ADMIN eklenirse, email üzerinde tenantId IS NULL koşullu partial unique index eklenmesi düşünülebilir (şu an tek süper admin olduğu için risk değil)
Render free tier disk kalıcı değil — veritabanı zaten Supabase'e taşındı, sorun çözüldü
İlk 5 beta müşteri — devam ediyor