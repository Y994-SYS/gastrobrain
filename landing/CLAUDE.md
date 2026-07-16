# GastroBRAIN Backend — Güvenlik Sertleştirme Çalışması (Context)

Bu dosya, GastroBRAIN backend'inde yürütülen güvenlik iyileştirmelerinin
tam kaydıdır. Yeni bir oturumda kaldığımız yerden devam etmek için bu
dosyayı paylaşman yeterli.

---

## Genel Yaklaşım

Başlangıç değerlendirmesinde şu eksikler tespit edildi:
1. Rate limiting yok
2. Input validation yok (Zod/express-validator yok)
3. HTTPS kontrolü
4. Loglama yok

Öncelik sırasıyla **rate limiting**, **Zod ile input validation** ve
**servis katmanı sertleştirme** üzerinde çalışıldı. Her route grubu için:
ilgili route/controller/service dosyaları incelendi, Zod şeması yazıldı,
route dosyasına `validate` / `validateParams` / `validateQuery`
middleware'leri eklendi, deploy edilip tarayıcı konsolundan `fetch` ile
test edildi.

---

## 1. Rate Limiting (TAMAMLANDI ✅)

- `express-rate-limit` zaten kuruluydu, `middleware/rateLimit.middleware.js`
  içinde `girisLimit`, `kayitLimit`, `genelLimit`, `kritikLimit` tanımlıydı.
- **Bulunan sorun 1:** `genelLimit`/`kritikLimit` tenant+user bazlı key
  üretmek için `req.kullanici`'ye bakıyordu, ama gerçek `authMiddleware`
  sadece route içinde çalışıyordu — rate limiter'lar ondan önce tetiklendiği
  için `req.kullanici` hep `undefined` kalıyordu.
  - **Çözüm:** `middleware/auth.middleware.js`'e yeni bir `tokenVarsaCoz`
    fonksiyonu eklendi — token varsa `req.kullanici`'yi dolduruyor, token
    yoksa/geçersizse sessizce geçiyor (401 vermiyor). `index.js`'te
    `app.use('/api', tokenVarsaCoz)` olarak `kritikLimit`/`genelLimit`'ten
    önce eklendi.
- **Bulunan sorun 2 (prod deploy hatası):** `express-rate-limit` v8, IPv6
  adreslerini güvenli normalize etmek için özel `ipKeyGenerator` helper'ı
  zorunlu kılıyor. Eski kod `req.ip`'yi doğrudan kullanıyordu →
  `ERR_ERL_KEY_GEN_IPV6` hatasıyla prod'da çöktü.
  - **Çözüm:** `ipKey` ve `tenantUserKey` fonksiyonlarında
    `ipKeyGenerator(req.ip)` kullanıldı.

---

## 2. Zod ile Input Validation (TAMAMLANDI ✅)

Genel middleware dosyası: `middleware/validate.middleware.js`
İçerdiği fonksiyonlar:
- `validate(schema)` — `req.body`'yi doğrular
- `validateParams(schema)` — `req.params`'ı doğrular (örn. `:id`)
- `validateQuery(schema)` — `req.query`'yi doğrular (Express 5'te
  `req.query` salt-okunur olabilir diye dikkat edildi, ama test sorunsuz
  geçti)

Her şema dosyası `schemas/<isim>.schema.js` altında.

### Tamamlanan tüm gruplar (sırayla):
1. **auth** (`kayit`, `giris`, `kayit-firma`, `tenant-listesi`,
   `sifre-sifirlama-talep`, `sifre-sifirla`) — email/şifre format
   kontrolleri. Boş string/`null` karışıklığı `z.preprocess` ile çözüldü.
2. **kategori** — `ad` zorunlu, `renk` opsiyonel, `.strict()` ile mass
   assignment koruması.
3. **olcuBirimi** — `ad` + `kisaltma` zorunlu.
4. **stokKart** — `kod`, `ad`, `kategoriId`, `birimId` zorunlu;
   `aciklama`/`minStok` opsiyonel. (IDOR riski Bölüm 3'te ayrıca ele
   alındı, ✅ düzeltildi.)
5. **cariKart** — email boş string geldiğinde `.email()` validasyonuna
   takılmaması için `z.preprocess` ile `''` → `undefined` çevrildi.
6. **stok** (stok hareketleri: giriş faturası, iade faturası, zayi,
   tüketim, tüketim-reçete, ay sonu sayım) — `subeId` opsiyonel bırakıldı
   çünkü controller `req.body.subeId` boşsa `req.kullanici.subeId` ile
   dolduruyor.
7. **recete** — nested `kalemler` dizisi (`z.array(...).min(1)`).
   `satisFiyati`/`porsiyonSayisi`/`satisKodu` boş string geldiğinde
   `undefined`'a çevrildi. (IDOR + transaction sorunları Bölüm 3'te ayrıca
   ele alındı, ✅ düzeltildi.)
8. **satis** — `receteId`, `adet`, `birimFiyat` zorunlu. (Şube yetki
   atlatma sorunu Bölüm 3'te ayrıca ele alındı, ✅ düzeltildi.)
9. **cariHareket** (`odeme`, `manuel`) — `tip` enum ile sınırlandı
   (`BORC`, `ALACAK`, `ODEME`, `TAHSILAT`).
10. **personel** (+ `maas`, `avans`, `devam` alt kayıtları) — `tcKimlik`
    11 haneli regex kontrolü, `devam.durum` enum.
    - 📌 **Kullanıcı isteği (yapılacak, ayrı iş):** Personel kaydına
      "izin günleri" eklensin. Not: `PersonelDevam` tablosu zaten
      `durum: IZIN` değerini destekliyor, yani günlük izin kaydı teknik
      olarak zaten mümkün. Eğer istenen "yıllık izin hakkı takibi"
      (örn. personelin kaç gün izin hakkı var, kaçını kullandı) ise, bu
      şema değişikliği + migration + yeni endpoint gerektirir — sonraki
      turlarda ayrı ele alınacak.
11. **rapor** (`satis`, `stok`, `cari`, `maliyet`, `excel`) —
    `req.query` doğrulaması (`validateQuery` kullanıldı). `excel`
    endpoint'inde `tip` enum (`satis|stok|cari|maliyet`).
12. **sube** — `ad` zorunlu (oluşturma), güncellemede tüm alanlar
    opsiyonel (`aktif` tek başına gönderilebilir).
13. **kullanici** — `rol` alanı `ATANABILIR_ROLLER` enum'una sabitlendi
    (`SUPER_ADMIN` hariç) — bu, controller'daki eski manuel kontrole ek
    bir savunma katmanı sağladı. `sifreDegistir`, `profilGuncelle` de
    kapsandı. (`subeId` sıfırlama riski Bölüm 3'te ayrıca ele alındı,
    ✅ düzeltildi.)
14. **superAdmin** (`tenantlar/:id/aktif`, `/plan`, `/lisans`) — `plan`
    enum, `aktif` boolean zorunlu. Test edildi ve doğrulandı.
15. **feedback** — `mesaj` zorunlu (max 5000 karakter), `tip` enum
    opsiyonel.
    - ✅ **Ek düzeltme:** Controller, kullanıcının girdiği `mesaj`'ı hiç
      kaçışlamadan (HTML-escape) doğrudan e-posta HTML'ine gömüyordu —
      bu bir **e-posta HTML injection** açığıydı. `htmlKacisla()`
      yardımcı fonksiyonu eklenerek `ad`, `email`, `mesaj` alanları
      artık HTML'e gömülmeden önce kaçışlanıyor.
16. **auditLog**, **transfer**, **dashboard**, **odeme**, **export** —
    hepsi tamamlandı. `odeme` testleri: geçersiz plan, bilinmeyen alan,
    tip hatası, iş kuralı (bekleyen ödeme bildirimi) senaryoları
    doğrulandı.

---

## 3. Servis Katmanı Sertleştirme (TAMAMLANDI ✅)

Zod turu bitince ele alınan, servis/controller katmanındaki mantıksal ve
yetkilendirme açıkları:

1. **IDOR — `stokKart`** ✅ Düzeltildi.
   `olustur`/`guncelle`, `kategoriId` ve `birimId` gönderildiğinde artık
   `iliskileriDogrula()` ile bu ID'lerin gerçekten istek sahibinin
   `tenantId`'sine ait olduğunu kontrol ediyor. Değilse
   `"Geçersiz kategori/birim: ... erişim yetkiniz yok"` hatası dönüyor.
   Dosya: `services/stokKart.service.js`.

2. **IDOR — `recete`** ✅ Düzeltildi.
   `olustur`/`guncelle`, `kalemler[].stokKartId` listesindeki tüm ID'leri
   tek bir toplu sorguyla (`kalemleriDogrula()`) tenant sahipliğine göre
   doğruluyor; eksik/yabancı ID'ler açıkça hata mesajında listeleniyor.
   Dosya: `services/recete.service.js`.

3. **Bonus bulgu — `satis.ekle` şube yetki atlatma** ✅ Düzeltildi.
   `receteId`/`subeId` zaten tenant bazında korunuyordu (klasik IDOR
   yoktu), ama kısıtlı roller (`MUDUR`, `DEPO`, `KASA`, `PERSONEL`) için
   `body.subeId` sadece *gönderilmediğinde* varsayılan atanıyordu —
   bilerek başka bir (aynı tenant'taki) şube ID'si gönderilirse kabul
   ediliyordu. `subeIdBelirle` (okuma) ile aynı mantık `ekle`'ye de
   (`satisSubeIdBelirle`) uygulandı: kısıtlı roller için `body.subeId`
   artık tamamen göz ardı edilip her zaman `req.kullanici.subeId`
   zorlanıyor. Dosya: `controllers/satis.controller.js`.

4. **`recete.guncelle` transaction eksikliği** ✅ Düzeltildi.
   Kalem `deleteMany` + yeniden `create` işlemleri artık
   `prisma.$transaction(async (tx) => {...})` içinde atomik olarak
   çalışıyor — aralarında hata olursa reçete eski kalemleriyle sağlam
   kalıyor. Dosya: `services/recete.service.js`.

5. **`kullanici.guncelle` subeId sıfırlama riski** ✅ Düzeltildi.
   Eski `subeId: subeId || null` satırı kaldırıldı. Artık: `subeId`
   body'de hiç gönderilmediyse (`undefined`) dokunulmuyor; açıkça `null`
   (veya boş string) gönderilirse kullanıcı bilerek şubeden çıkarılmış
   sayılıp `null` yazılıyor. Dosya: `controllers/kullanici.controller.js`.

---

## 4. Yol Boyunca Bulunan ve Düzeltilen Ayrı Hatalar

- **Kritik prod hatası:** `index.js`'teki global hata yakalama
  middleware'i `Sentry.captureException(err)` çağırıyordu ama `Sentry`
  hiçbir yerde import edilmemişti (`ReferenceError: Sentry is not
  defined`). Bu, her hata oluştuğunda hata yakalamanın kendisinin
  patlamasına ve bozuk/eksik response dönmesine yol açıyordu.
  **Düzeltildi:** `const Sentry = require('@sentry/node');` eklendi.
- **Kopyala-yapıştır hatası (validation'la ilgisiz):**
  `routes/stokKart.routes.js` dosyasının içeriği yanlışlıkla
  `cariKart.routes.js` içeriğiyle doldurulmuştu (muhtemelen manuel
  kopyalama sırasında). Bu yüzden `/api/stok-kartlari` ve
  `/api/cari-kartlar` aynı (yanlış) veriyi dönüyordu. Doğru içerikle
  değiştirilip düzeltildi.

---

## 5. Tamamlanan / Sıradaki İşler

### A) Orijinal checklist'ten tamamlanan maddeler (TAMAMLANDI ✅)

1. **HTTPS zorunluluğu / HSTS** ✅ Tamamlandı.
   - Render custom domain (`api.gastrobrain.com.tr`) zaten SSL sertifikalı
     ve doğrulanmış durumdaydı (Cloudflare üzerinden proxy'leniyor).
   - Cloudflare → SSL/TLS → Edge Certificates altında **"Always Use HTTPS"**
     açıldı.
   - **HSTS** etkinleştirildi: Max-Age 6 ay, `includeSubDomains` ve
     `Preload` kapalı bırakıldı (güvenli/temkinli başlangıç), No-Sniff
     Header açıldı.
   - **Bulunan bonus hata:** Health check route'u (`/`) ilk düzeltmede
     `helmet()`'ten önceye taşınmıştı, bu da bu endpoint'in güvenlik
     header'larını (X-Powered-By gizleme, HSTS) hiç almamasına yol
     açıyordu. Route, `helmet()`'ten SONRA ama `cors()`'tan ÖNCE olacak
     şekilde düzeltildi.

2. **Loglama (Morgan + Winston)** ✅ Tamamlandı.
   - `config/logger.js` — Winston logger, prod'da JSON format, dev'de
     renkli/okunabilir format. Hassas alanlar (`password`, `sifre`,
     `token`, `authorization` vb.) otomatik maskeleniyor.
   - `middleware/requestLogger.middleware.js` — Morgan, Winston'a stream
     ediliyor; `tenant` ve `kullaniciId` etiketleriyle her HTTP isteği
     loglanıyor (`tokenVarsaCoz`'dan SONRA mount edildi ki bu bilgiler
     dolu gelsin).
   - Prisma `tenantId` uyarıları ve global hata yakalayıcı `console.*`
     yerine `logger.*` kullanacak şekilde güncellendi.
   - Prod'da (Render Logs) test edildi ve doğrulandı — JSON format,
     `tenant=6 kullanici=12` gibi doğru etiketlerle çalışıyor.

3. **Environment variable güvenliği** ✅ Tamamlandı.
   - Render → Environment: 13 değişkenin hepsi (JWT, DB, SMTP, CORS,
     Sentry) env variable olarak tutuluyor, kod içine hardcode edilmiş
     secret yok (`grep`/`Select-String` ile doğrulandı).
   - `.gitignore` `.env`/`.env.local`/`.env.production` varyasyonlarının
     hepsini kapsıyor; `git log --all --full-history` ile `.env`
     dosyasının hiçbir zaman commit edilmediği doğrulandı.
   - GitHub reposu **private**.
   - **Bulunan eksik:** `SENTRY_DSN` Render'da tanımlı değildi — Sentry
     hiç hata almıyordu (`Sentry.init({ dsn: undefined })` sessizce
     hiçbir şey göndermiyordu). Sentry projesinden (`node`) doğru DSN
     bulunup Render'a `SENTRY_DSN` olarak eklendi. Geçici bir test
     route'uyla (`/api/sentry-test`) uçtan uca doğrulandı — Sentry'ye
     hata düştü, e-posta bildirimi geldi. Test route'u sonradan
     kaldırıldı.
   - **Bulunan bonus hata:** Global hata yakalayıcıdaki CORS kontrolü
     sadece `err.message.includes('CORS')` bakıyordu; ama origin
     eksikliğinde fırlatılan `"Origin zorunlu"` hatası bu koşula
     uymadığı için yanlışlıkla generic 500 dönüyordu (403 dönmesi
     gerekirken). Düzeltildi.

### B) Ayrı özellik istekleri (security taramasının dışında, SIRADA)

1. **Personel izin günleri** — yıllık izin hakkı takibi isteniyorsa yeni
   alan/tablo + migration + endpoint gerekir. `PersonelDevam` tablosu
   zaten günlük `IZIN` durumunu destekliyor (basit izin kaydı teknik
   olarak mümkün); "kaç gün hakkı var / kaçını kullandı" takibi ayrı bir
   iştir, henüz başlanmadı.

---

## 6. Ortam / Altyapı Notları

- Backend: Render'da barındırılıyor (`gastrobrain-backend`), prod URL:
  `https://api.gastrobrain.com.tr`
- Veritabanı: Supabase (Postgres), Prisma ORM ile erişiliyor.
- Frontend: `https://app.gastrobrain.com.tr`
- Token localStorage key'i: **`gastroiq_token`** (test için önemli —
  tarayıcı konsolunda `localStorage.getItem('gastroiq_token')` ile
  alınabilir).
- Test yöntemi: Kullanıcı PowerShell/curl yerine tarayıcı konsolunda
  `fetch(...)` ile manuel istek atarak test ediyor (giriş yapılmış
  oturumdaki token'ı kullanarak). `allow pasting` yazması gerekebiliyor
  (Chrome DevTools güvenlik uyarısı).
- SUPER_ADMIN paneli: `app.gastrobrain.com.tr/super-admin` — ayrı bir
  hesapla giriş gerektiriyor.

---

## 7. Bir Sonraki Oturumda Nereden Devam Edilecek

1. Bu dosyayı Claude'a ver.
2. Zod ile input validation ve servis katmanı sertleştirme (Bölüm 2-3)
   **tamamen bitti** — tekrar ele almaya gerek yok.
3. Sıradaki iş: **Bölüm 5-A** — HTTPS kontrolü, loglama (Morgan +
   Winston), environment variable güvenliği. Hangisinden başlamak
   istediğini belirt, ilgili dosyaları (örn. `index.js`, Render ayarları
   ekran görüntüsü/listesi) paylaş.
4. Bölüm 5-A bitince Bölüm 5-B'deki ayrı özellik isteğine (personel izin
   günleri) geçilebilir.