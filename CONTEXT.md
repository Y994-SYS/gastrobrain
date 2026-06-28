@AGENTS.md
# GastroBrain — Proje Context Dosyası

## PROJE BİLGİLERİ
- **Proje:** GastroBrain — Restoran Yönetim SaaS Sistemi
- **Lokasyon:** C:\Users\alkan\Projects\gastroiq
- **Son Güncelleme:** Haziran 2026

## STACK
- **Backend:** Node.js v22 + Express + Prisma ORM v6 + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS v4
- **Landing:** Next.js v16 (App Router, static export)
- **Veritabanı:** Supabase PostgreSQL (production), localhost:5432 (local)
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **Mail:** Nodemailer (SMTP/Gmail)
- **Cron:** node-cron (lisans uyarı job'ları)
- **Error Monitoring:** Sentry (@sentry/node)
- **Hosting:** Render.com (backend + frontend + landing, ayrı servisler)
- **DNS:** Cloudflare (gastrobrain.com.tr, İsimtescil'den alındı)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — prisma.config.ts olmadan çalışıyor)
- Tailwind v4 kullanılıyor (@tailwindcss/vite plugin ile, tailwind.config.js YOK)
- PostgreSQL path'e ekli değil: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres`
- Frontend port: 5173, Backend port: 3001, Landing port: 3000
- Tema: Koyu (zinc-950 bg), lime-400 accent rengi
- PowerShell'de `$disconnect` ve `$transaction` inline node -e komutlarında sorun çıkarıyor → dosya olarak çalıştır
- landing klasörü gastroiq/landing altında (submodule değil, normal klasör)
- auth.store.js'de setKullanici fonksiyonu var — profil güncellemede kullanılıyor
- Şema değişikliklerinde `npx prisma migrate dev` DEĞİL `npx prisma db push` kullan — migration history Supabase'de tutulmuyor, migrate dev "drift detected" deyip reset istiyor (VERİ KAYBI RİSKİ). db push veriyi koruyarak şemayı senkronize eder.
- Render Build Command'ı `npm install && npx prisma generate` olmalı — sadece npm install Prisma Client'ı eski şemadan üretilmiş halde bırakabilir
- Render free PostgreSQL (e-ticaret-db / eski "eticaretdb_94wj") KULLANILMIYOR — production veritabanı tamamen Supabase'e taşındı

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


### Faz 8 — SUPER_ADMIN İzolasyonu ✅
- Kullanici.tenantId → Int? (opsiyonel)
- SUPER_ADMIN tenant-scoped route'lardan çıkarıldı
- PrivateRoute: SUPER_ADMIN → /super-admin yönlendirmesi


### Faz 9 — Küçük İyileştirmeler ✅
- Kullanıcı Yönetimi mobil uyumlu
- Rol bilgi kutusu (ROL_ACIKLAMA map)
- Yardım sayfasına "Roller ve Yetkiler" bölümü
- Logo eklendi (Layout.jsx + Login.jsx)
- Satislar.jsx hata yönetimi düzeltildi

### Faz 10 — Performance (Optimistic UI) ✅
- **Satislar.jsx:** kaydet + sil → optimistic update (getir() kaldırıldı, state direkt güncelleniyor)
- **CariHesap.jsx:** odemeKaydet → optimistic update (bakiye + hareket listesi anında güncelleniyor, hata varsa geri alınıyor)
- **Personel.jsx:** kaydet + sil + maasKaydet + avansKaydet + devamKaydet → optimistic update (personelDetay() + getir() kaldırıldı)
- **Dashboard.jsx (YonetimDashboard):** 4 API isteği sıralı await'ten Promise.allSettled'a geçirildi (paralel, ~4x hızlanma), her biri ayrı hata yönetimiyle
- **Geçici kayıt göstergesi:** optimistic eklenen kayıtlar opacity-60 + "kaydediliyor..." yazısıyla gösteriliyor, API cevabı gelince gerçek veriyle değiştiriliyor
- **Hata geri alma:** API hatası durumunda tüm optimistic değişiklikler otomatik geri alınıyor, modal yeniden açılıyor

---

## Faz 11 — Şube Yönetimi Geliştirmeleri ✅

### Şube Kartı Özet Veriler
- `sube.controller.js` → `hepsiniGetir` güncellendi
  - Her şube kartına `bugunSatis` (₺) ve `kritikStok` (adet) eklendi
  - Türkiye saati UTC+3 offsetiyle hesaplanıyor (`bugunBaslangicTR()`)
  - Kritik stok: `minStok > 0` olan kartların şube bazlı net bakiyesi hesaplanıp eşik altındakiler sayılıyor
  - N+1 sorgu yok — tüm hesaplamalar tek `groupBy` sorgusunda

### Şubeler Arası Stok Transferi
- **Backend:**
  - `transfer.controller.js` — `subeStoklar`, `transferYap`, `transferGecmisi`
  - `transfer.route.js` — `GET /api/transfer/stoklar`, `POST /api/transfer`, `GET /api/transfer/gecmis`
  - Transfer: kaynak şubede `SUBE_TRANSFER_OUT`, hedef şubede `SUBE_TRANSFER_IN` — tek Prisma `$transaction`
  - Bakiye yeterlilik kontrolü transfer öncesi yapılıyor
  - Yetki: `TENANT_ADMIN` + `MUDUR`
- **Frontend:**
  - `Transfer.jsx` → `src/pages/Transfer.jsx`
  - Kaynak/hedef şube seçimi, ürün dropdown'ı (bakiye gösterir), %25/%50/%75/%100 kısayol butonları
  - Sağ panelde son transferler (GİRİŞ/ÇIKIŞ badge'li)
  - Route: `/stok/transfer` (`R.YONETIM`)
  - `App.js`'e import ve route eklendi

### Şube Detay Sayfası
- **Backend:**
  - `sube.controller.js` → `detayGetir` fonksiyonu eklendi
  - `GET /api/subeler/:id/detay` — tek endpoint'te: özet, son satışlar, stok durumu, personel, son transferler
  - `subeler.route.js` → `/:id/detay` route'u eklendi (sıraya dikkat: `/:id`'den önce)
- **Frontend:**
  - `SubeDetay.jsx` → `src/pages/tanimlamalar/SubeDetay.jsx`
  - 4 sekme: Stok Durumu, Son Satışlar, Personel, Transferler
  - Üstte 4 özet kart: bugün satış, bu ay satış, stok kalemleri, personel
  - Kritik stok varsa sekme badge'i
  - Route: `/tanimlamalar/subeler/:id` (`R.ADMIN`)
- **Subeler.jsx** → karta tıklayınca `navigate(/tanimlamalar/subeler/${sube.id})` (Düzenle butonu `e.stopPropagation()` ile izole)

### Stok Durumu Tutarsızlık Düzeltmesi
- `stok.controller.js` → `subeIdBelirle` fonksiyonu güncellendi
  - ESKİ: `TENANT_ADMIN` şube seçmezse `null` dönüyor → tüm şubelerin toplamı görünüyordu
  - YENİ: şube seçilmezse `req.kullanici.subeId` dönüyor → kendi şubesini görüyor
  - SubeDetay ve Stok Durumu artık tutarlı rakamlar gösteriyor
- `StokDurumu.jsx` → başlığa `· Kendi şubeniz` etiketi eklendi (şube seçilmemişse)

### stok.service.js İyileştirmeleri
- `tumStokDurumu` → N+1 sorgu giderildi (her kart için ayrı sorgu yerine tek sorguda tüm hareketler çekilip JS'de gruplandı)
- `AY_SONU_SAYIM` bakiye hesabı düzeltildi (açıklamadaki `fark: +X/-X` işaretine göre ekleniyor/düşülüyor)

### Demo Seed Güncelleme
- `demoSeed.service.js` sadeleştirildi — yeni kayıt olan tenant'lara artık şunlar gelmiyor:
  - Stok giriş hareketleri (bakiyeler sıfır başlıyor)
  - Örnek satışlar (14 günlük)
  - Personel kayıtları
  - Cari kartlar ve hareketler
- Kalanlar: kategoriler, ölçü birimleri, 18 stok kartı (sıfır bakiye), 4 reçete (fiyat 0)
- Reçete fiyatları 0 olarak geliyor — kullanıcı kendi fiyatını girer

### Güvenlik İyileştirmeleri (app.js)
- **CORS kısıtlandı:** `app.use(cors())` → sadece `ALLOWED_ORIGINS` env değişkenindeki domainler kabul ediliyor (varsayılan: `https://app.gastrobrain.com.tr`)
- **Rate limit sırası düzeltildi:** `kritikLimit` ve `genelLimit` route'lardan önce tanımlanıyor — önceki haliyle hiç çalışmıyordu
- **Payload limit eklendi:** `express.json({ limit: '1mb' })` — büyük payload saldırısı önlemi
- **XSS middleware'den `/` encode'u çıkarıldı** — URL ve JSON'da bozulmaya yol açıyordu

### .env Eklentisi
```
ALLOWED_ORIGINS=https://app.gastrobrain.com.tr
```

### Güncellenen Dosyalar
| Dosya | Değişiklik |
|-------|-----------|
| `backend/src/controllers/sube.controller.js` | `hepsiniGetir` özet veri + `detayGetir` eklendi |
| `backend/src/controllers/stok.controller.js` | `subeIdBelirle` null→subeId düzeltmesi |
| `backend/src/controllers/transfer.controller.js` | 🆕 yeni dosya |
| `backend/src/routes/transfer.route.js` | 🆕 yeni dosya |
| `backend/src/routes/subeler.route.js` | `/:id/detay` eklendi |
| `backend/src/services/stok.service.js` | N+1 fix + AY_SONU_SAYIM düzeltmesi |
| `backend/src/services/demoSeed.service.js` | satış/stok/personel/cari kaldırıldı |
| `backend/app.js` | CORS, rate limit sırası, payload limit, XSS fix |
| `frontend/src/pages/Transfer.jsx` | 🆕 yeni dosya |
| `frontend/src/pages/tanimlamalar/SubeDetay.jsx` | 🆕 yeni dosya |
| `frontend/src/pages/tanimlamalar/Subeler.jsx` | kart tıklanınca detaya git, skeleton loader |
| `frontend/src/pages/stok/StokDurumu.jsx` | "Kendi şubeniz" etiketi |
| `frontend/src/App.jsx` | Transfer + SubeDetay route'ları eklendi |

## Faz 12 — Çok Şubeli Yapı Geliştirmeleri ✅

### Adım 1 — Backend Şube Filtresi (Tutarlı subeId Kontrolü)

Tüm controller'lara `subeIdBelirle(req)` yardımcı fonksiyonu eklendi:
- MUDUR / DEPO / KASA / PERSONEL → kendi subeId'si (kilitli)
- TENANT_ADMIN → query'den gelirse onu kullan, gelmezse `null` (tüm şubeler)
- `null` gelince `Number(null) = 0` hatasına yol açan hardcoded `subeId = 1` ve `subeId || 1` değerleri kaldırıldı

**Güncellenen backend dosyaları:**

| Dosya | Değişiklik |
|---|---|
| `backend/src/controllers/satis.controller.js` | `subeIdBelirle` eklendi, `subeId = 1` hardcode kaldırıldı |
| `backend/src/controllers/stok.controller.js` | `subeIdBelirle` eklendi |
| `backend/src/controllers/personel.controller.js` | `subeIdBelirle` eklendi, `hepsiniGetir(tenantId, subeId)` imzası güncellendi |
| `backend/src/controllers/rapor.controller.js` | Tüm raporlara `subeIdBelirle` eklendi, Excel export'a şube kolonu eklendi, satış raporuna `subeGrup` eklendi |
| `backend/src/services/satis.service.js` | `hepsiniGetir` ve `gunlukToplam`'da `subeId null` kontrolü — null ise tüm şubeler |
| `backend/src/services/stok.service.js` | `mevcutStokGetir`'de `subeId null` kontrolü — null ise tüm şubelerin toplamı |
| `backend/src/services/personel.service.js` | `hepsiniGetir(tenantId, subeId)` — subeId varsa filtreler, yoksa tüm tenant |

### Adım 2 — Frontend Şube Seçici (SubeSecici)

**Yeni dosyalar:**

| Dosya | Açıklama |
|---|---|
| `frontend/src/store/subeStore.js` | Zustand store — `seciliSubeId`, `subeler`, `subeleriYukle`, `subeSecAlt` |
| `frontend/src/components/SubeSecici.jsx` | Şube seçici buton grubu — sadece TENANT_ADMIN + 2+ şubede görünür |

**Güncellenen frontend sayfaları:**

| Dosya | Değişiklik |
|---|---|
| `frontend/src/pages/stok/StokDurumu.jsx` | `SubeSecici` + `useSubeStore` entegre, `seciliSubeId` değişince otomatik yenile |
| `frontend/src/pages/satis/Satislar.jsx` | `SubeSecici` + `useSubeStore` entegre |
| `frontend/src/pages/personel/Personel.jsx` | `SubeSecici` + `useSubeStore` entegre, optimistic update korundu |
| `frontend/src/pages/raporlar/Raporlar.jsx` | `SubeSecici` + `useSubeStore` entegre, şube bazlı rapor ve Excel desteği |

**SubeSecici davranışı:**
- TENANT_ADMIN + 2+ şube → "Tüm Şubeler | Kadıköy | Beşiktaş" butonları gösterilir
- Tek şubeli veya MUDUR/DEPO/KASA/PERSONEL rolleri → hiç görünmez
- Seçim global Zustand state'inde tutulur, sayfa değişince sıfırlanmaz
- `subeParam` store fonksiyonu yerine her component içinde hesaplanır: `const subeParam = seciliSubeId ? \`?subeId=\${seciliSubeId}\` : ''`

### Adım 5 — Dashboard Şube Özeti Paneli

**Yeni backend dosyaları:**

| Dosya | Açıklama |
|---|---|
| `backend/src/controllers/dashboard.controller.js` | `subeOzeti` — her şube için günlük ciro, satış sayısı, kritik stok sayısı, kullanıcı/personel sayısı |
| `backend/src/routes/dashboard.routes.js` | `GET /api/dashboard/subeler` — authMiddleware korumalı |

**index.js'e eklendi:**
```js
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);
```

**Güncellenen frontend:**

| Dosya | Değişiklik |
|---|---|
| `frontend/src/pages/Dashboard.jsx` | `SubeOzetiPanel` component'ı eklendi — sadece TENANT_ADMIN + 2+ şubede görünür |

**SubeOzetiPanel davranışı:**
- Her şube kartında: ad, aktif durum, günlük ciro, işlem sayısı, kritik stok sayısı, kullanıcı ve personel sayısı
- Bir şubeye tıklayınca `subeSecAlt(sube.id)` çalışır ve Satışlar sayfasına yönlendirir
- Tek şubeli hesaplarda `subeler.length <= 1` kontrolüyle tamamen gizlenir
- Skeleton loader ile yükleniyor durumu gösterilir

### Yeni Backend API Endpoint'i

```
GET /api/dashboard/subeler   — TENANT_ADMIN, her şubenin günlük özet verisi
```
### Önemli Notlar (Faz 12)
 
- `subeParam` Zustand store'da fonksiyon olarak tutulmayacak — Vite/Rollup build'de `Cannot read properties of undefined (reading 'length')` hatasına yol açıyor. Her component içinde `const subeParam = seciliSubeId ? \`?subeId=\${seciliSubeId}\` : ''` şeklinde hesapla.
- Tüm API response okumalarında `?.data || []` güvenli erişim pattern'i kullanılıyor — backend null dönse bile sayfa çökmüyor.
- `satis.service.js` ve `stok.service.js`'de `subeId: Number(null) = 0` hatası düzeltildi — artık null gelince `where` filtresine subeId eklenmez, tüm tenant verisi gelir.


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
│   │   │   ├── dashboard.controller.js        # 🆕 sube ozeti endpoint
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
│   │   │   ├── dashboard.routes.js            # 🆕 GET /api/dashboard/subeler
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
│   │   │   ├── SubeSecici.jsx                 # 🆕 sube secici dropdown
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
│   │   │   ├── subeStore.js                   # 🆕 secili sube global state
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