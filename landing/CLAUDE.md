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

Öncelik sırasıyla **rate limiting** ve **Zod ile input validation**
üzerinde çalışıldı. Her route grubu için: ilgili route/controller/service
dosyaları incelendi, Zod şeması yazıldı, route dosyasına `validate` /
`validateParams` / `validateQuery` middleware'leri eklendi, deploy edilip
tarayıcı konsolundan `fetch` ile test edildi.

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

## 2. Zod ile Input Validation — Tamamlanan Route Grupları ✅

Genel middleware dosyası: `middleware/validate.middleware.js`
İçerdiği fonksiyonlar:
- `validate(schema)` — `req.body`'yi doğrular
- `validateParams(schema)` — `req.params`'ı doğrular (örn. `:id`)
- `validateQuery(schema)` — `req.query`'yi doğrular (Express 5'te
  `req.query` salt-okunur olabilir diye dikkat edildi, ama test sorunsuz
  geçti)

Her şema dosyası `schemas/<isim>.schema.js` altında.

### Tamamlanan gruplar (sırayla):
1. **auth** (`kayit`, `giris`, `kayit-firma`, `tenant-listesi`,
   `sifre-sifirlama-talep`, `sifre-sifirla`) — email/şifre format
   kontrolleri. Boş string/`null` karışıklığı `z.preprocess` ile çözüldü.
2. **kategori** — `ad` zorunlu, `renk` opsiyonel, `.strict()` ile mass
   assignment koruması.
3. **olcuBirimi** — `ad` + `kisaltma` zorunlu.
4. **stokKart** — `kod`, `ad`, `kategoriId`, `birimId` zorunlu;
   `aciklama`/`minStok` opsiyonel.
   - ⚠️ **Tespit edilen ama henüz düzeltilmeyen açık:** `kategoriId` ve
     `birimId`'nin gerçekten o tenant'a ait olup olmadığı servis
     katmanında kontrol edilmiyor (potansiyel IDOR — biri başka tenant'ın
     kategori/birim ID'sini kullanabilir). Zod format kontrolü yapıyor
     ama sahiplik kontrolü yapmıyor. **Bu, service katmanı sertleştirme
     turunda ele alınmalı.**
5. **cariKart** — email boş string geldiğinde `.email()` validasyonuna
   takılmaması için `z.preprocess` ile `''` → `undefined` çevrildi.
6. **stok** (stok hareketleri: giriş faturası, iade faturası, zayi,
   tüketim, tüketim-reçete, ay sonu sayım) — `subeId` opsiyonel bırakıldı
   çünkü controller `req.body.subeId` boşsa `req.kullanici.subeId` ile
   dolduruyor (validate'ten sonra çalışıyor ama sorun çıkarmıyor çünkü
   Zod'da alan zaten opsiyonel).
7. **recete** — nested `kalemler` dizisi (`z.array(...).min(1)`).
   `satisFiyati`/`porsiyonSayisi`/`satisKodu` boş string geldiğinde
   `undefined`'a çevrildi (aksi halde `0` olarak yanlış kaydolabilirdi).
   - ⚠️ **Not (service katmanı, Zod dışı):** `guncelle` fonksiyonu
     güncellemede önce tüm `receteKalem` kayıtlarını siliyor, sonra
     yenilerini oluşturuyor — bu iki işlem `$transaction` içinde değil,
     aralarında hata olursa reçete kalemsiz kalabilir. **Sertleştirme
     turunda ele alınmalı.**
8. **satis** — `receteId`, `adet`, `birimFiyat` zorunlu.
9. **cariHareket** (`odeme`, `manuel`) — `tip` enum ile sınırlandı
   (`BORC`, `ALACAK`, `ODEME`, `TAHSILAT`).
10. **personel** (+ `maas`, `avans`, `devam` alt kayıtları) — `tcKimlik`
    11 haneli regex kontrolü, `devam.durum` enum.
    - 📌 **Kullanıcı isteği (yapılacak, ayrı iş):** Personel kaydına
      "izin günleri" eklensin. Not: `PersonelDevam` tablosu zaten
      `durum: IZIN` değerini destekliyor, yani günlük izin kaydı teknik
      olarak zaten mümkün. Eğer istenen "yıllık izin hakkı takibi"
      (örn. personelin kaç gün izin hakkı var, kaçını kullandı) ise, bu
      şema değişikliği + migration + yeni endpoint gerektirir — validation
      turu bitince ayrı ele alınacak.
11. **rapor** (`satis`, `stok`, `cari`, `maliyet`, `excel`) —
    `req.query` doğrulaması (`validateQuery` kullanıldı). `excel`
    endpoint'inde `tip` enum (`satis|stok|cari|maliyet`).
12. **sube** — `ad` zorunlu (oluşturma), güncellemede tüm alanlar
    opsiyonel (`aktif` tek başına gönderilebilir).
13. **kullanici** — `rol` alanı `ATANABILIR_ROLLER` enum'una sabitlendi
    (`SUPER_ADMIN` hariç) — bu, controller'daki eski manuel kontrole ek
    bir savunma katmanı sağladı. `sifreDegistir`, `profilGuncelle` de
    kapsandı.
    - ⚠️ **Not (Zod dışı, service katmanı):** `guncelle` fonksiyonunda
      `subeId: subeId || null` satırı var — eğer güncelleme isteğinde
      `subeId` gönderilmezse kullanıcının şubesi yanlışlıkla `null`'a
      düşebilir. Frontend'in her zaman `subeId` gönderip göndermediği
      teyit edilmeli.
14. **superAdmin** (`tenantlar/:id/aktif`, `/plan`, `/lisans`) — `plan`
    enum, `aktif` boolean zorunlu. Test edildi ve doğrulandı.
15. **feedback** — `mesaj` zorunlu (max 5000 karakter), `tip` enum
    opsiyonel.
    - ✅ **Bugün eklenen ek düzeltme:** Controller, kullanıcının girdiği
      `mesaj`'ı hiç kaçışlamadan (HTML-escape) doğrudan e-posta HTML'ine
      gömüyordu — bu bir **e-posta HTML injection** açığıydı (biri
      `<img onerror=...>` gibi içerik gönderebilirdi). `htmlKacisla()`
      yardımcı fonksiyonu eklenerek `ad`, `email`, `mesaj` alanları artık
      HTML'e gömülmeden önce kaçışlanıyor.

---

## 3. Yol Boyunca Bulunan ve Düzeltilen Ayrı Hatalar

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

## 4. Henüz Yapılmayan / Sıradaki İşler

### A) Zod validation turu — kalan route grupları
`index.js`'teki route sırasına göre henüz işlenmedi:
- `auditLog`
- `transfer`
- `dashboard`
- `odeme`
- `export`

Bu gruplar için aynı yöntem izlenecek: route/controller/service
dosyalarını iste → Zod şeması yaz → route'a `validate`/`validateParams`/
`validateQuery` ekle → deploy → tarayıcı konsolundan `fetch` ile test.

### B) Servis katmanı sertleştirme (Zod bitince ele alınacak)
1. **IDOR riski** — `stokKart` oluşturma/güncellemede `kategoriId` ve
   `birimId`'nin tenant sahipliği kontrol edilmiyor. Benzer bir kontrolün
   diğer nested-relation alanlarında (örn. `recete.kalemler[].stokKartId`,
   `satis.receteId`) da olup olmadığı topluca gözden geçirilmeli.
2. **`recete.guncelle` transaction eksikliği** — kalem silme + yeniden
   oluşturma `$transaction` içine alınmalı.
3. **`kullanici.guncelle` subeId sıfırlama riski** — `subeId || null`
   davranışı gözden geçirilmeli.

### C) Ayrı özellik istekleri (security taramasının dışında)
1. **Personel izin günleri** — yıllık izin hakkı takibi isteniyorsa yeni
   alan/tablo + migration + endpoint gerekir.

### D) Orijinal checklist'ten henüz başlanmayan maddeler
3. **HTTPS zorunluluğu kontrolü** — Render'da SSL var mı doğrulanmadı.
4. **Loglama (Morgan + Winston)** — hiç eklenmedi.
5. **Environment variable güvenliği** — Render ayarları gözden
   geçirilmedi.

---

## 5. Ortam / Altyapı Notları

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

## 6. Bir Sonraki Oturumda Nereden Devam Edilecek

1. Bu dosyayı Claude'a ver.
2. "Zod'a devam edelim" de — sıradaki grup **`auditLog`**.
3. Aynı akış: route/controller/service dosyalarını paylaş → şema
   yazılır → test edilir.
4. Tüm route grupları bitince, **Bölüm 4-B**'deki servis katmanı
   sertleştirme maddelerine geçilecek.
5. Ardından orijinal checklist'in kalan maddeleri (HTTPS kontrolü,
   loglama, env variable güvenliği) ele alınacak.