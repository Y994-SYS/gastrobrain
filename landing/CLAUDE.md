# GastroBRAIN Backend — Güvenlik Sertleştirme Çalışması (Context)

Bu dosya, GastroBRAIN backend'inde yürütülen güvenlik iyileştirmelerinin
tam kaydıdır. Yeni bir oturumda kaldığımız yerden devam etmek için bu
dosyayı paylaşman yeterli.

---

## Genel Yaklaşım

Sırasıyla şu aşamalardan geçildi: **rate limiting → Zod input validation →
servis katmanı sertleştirme (Bölüm 1-3) → HTTPS/loglama/env güvenliği
(Bölüm 5-A) → personel izin takibi özelliği (Bölüm 5-B) → tüm modüllerin
genel güvenlik taraması (Bölüm 6)**.

---

## 1. Rate Limiting (TAMAMLANDI ✅)
`tokenVarsaCoz` middleware'i eklendi (rate limiter'ların `req.kullanici`'ye
erişebilmesi için), `ipKeyGenerator` ile IPv6 prod hatası düzeltildi.

## 2. Zod ile Input Validation (TAMAMLANDI ✅)
Tüm route grupları (`auth`, `kategori`, `olcuBirimi`, `stokKart`, `cariKart`,
`stok`, `recete`, `satis`, `cariHareket`, `personel`, `rapor`, `sube`,
`kullanici`, `superAdmin`, `feedback`, `auditLog`, `transfer`, `dashboard`,
`odeme`, `export`) için `validate`/`validateParams`/`validateQuery` eklendi.

## 3. Servis Katmanı Sertleştirme — İlk Tur (TAMAMLANDI ✅)
- IDOR — `stokKart`, `recete` ✅
- `satis.ekle` şube yetki atlatma ✅
- `recete.guncelle` transaction eksikliği ✅
- `kullanici.guncelle` subeId sıfırlama riski ✅

## 4. Yol Boyunca Bulunan Ayrı Hatalar
- `Sentry` import eksikliği (prod'da hata yakalama çöküyordu) ✅
- `stokKart.routes.js` / `cariKart.routes.js` içerik kopyalama hatası ✅

## 5. Bölüm 5-A / 5-B (TAMAMLANDI ✅)

**HTTPS/HSTS** — Cloudflare'de Always Use HTTPS + HSTS açıldı, health check
route sırası (`helmet()` sonrası, `cors()` öncesi) düzeltildi.

**Loglama** — Winston + Morgan kuruldu, tenant/kullanıcı etiketli, hassas
alanlar maskeleniyor, prod'da doğrulandı.

**Env variable güvenliği** — `.env` git'e hiç girmemiş, secret hardcode yok,
repo private, eksik `SENTRY_DSN` eklenip doğrulandı.

**Personel izin takibi (yeni özellik)** — `PersonelIzin` modeli eklendi,
kıdeme göre (İş Kanunu Md. 53 + yaş istisnası) otomatik izin hakkı hesaplama,
`PersonelDevam`'daki `IZIN` kayıtlarından otomatik sayım + manuel düzeltme
mekanizması, toplu tarih aralığı girişi, frontend entegrasyonu — hepsi
tamamlanıp deploy edildi.

---

## 6. Genel Güvenlik Taraması (Bölüm 6, TAMAMLANDI ✅)

Sıradaki checklist dışında, tüm kalan modüller tek tek tarandı ve bulunan
her açık düzeltildi:

### cariHareket + transfer
- **Transfer'de TOCTOU race condition** ✅ Düzeltildi — bakiye kontrolü artık
  `Serializable` izolasyonlu transaction içinde, `P2034` çakışması `409` ile
  dönüyor. Dosya: `controllers/transfer.controller.js`.
- Route yetkilendirmesi zaten doğruydu.

### odeme + superAdmin
- **`onayla`/`reddet` çift işlenme riski** ✅ Düzeltildi — atomik
  `updateMany({ where: { id, durum: 'BEKLIYOR' } })` "claim" deseni ile,
  eşzamanlı ikinci istek `409` alıyor. Dosya: `controllers/odeme.controller.js`.
- `superAdmin` route yetkilendirmesi (`router.use(rolKontrol('SUPER_ADMIN'))`)
  zaten iyi tasarlanmıştı.

### export + rapor + dashboard
- **`dashboard.routes.js`'de rol kontrolü tamamen eksikti** ✅ Düzeltildi —
  herhangi bir giriş yapmış kullanıcı (PERSONEL/KASA dahil) tüm şubelerin
  ciro/personel verisini görebiliyordu. Artık `TENANT_ADMIN`/`MUDUR` ile
  sınırlı. Dosya: `routes/dashboard.routes.js`.
- `export`/`rapor` tenant izolasyonu zaten sağlamdı.

### sube
- **MUDUR rolünün şube kapsamı tutarsızlığı** ✅ Düzeltildi — `sube` modülünde
  MUDUR tüm şubeleri görebiliyordu, ama `rapor`/`export`/`personel`/`stok`'ta
  kendi şubesine kilitliydi. Karar: **MUDUR = sadece kendi şubesi**. Hem
  `sube.controller.js` (`kendiSubesineKilitliMi` kontrolü) hem
  `dashboard.controller.js` bu tutarlılığa göre güncellendi.

### auth (🔴 KRİTİK BULGU)
- **`POST /api/auth/kayit` — kimliksiz privilege escalation** ✅ Düzeltildi.
  Route'ta `authMiddleware` yoktu VE `kayitOlSchema` client'ın
  `rol: "SUPER_ADMIN"` göndermesine izin veriyordu → herhangi biri,
  kimlik doğrulamadan, tenant'sız tam yetkili bir SUPER_ADMIN hesabı
  oluşturabiliyordu. Düzeltme: route artık `authMiddleware` +
  `rolKontrol('TENANT_ADMIN')` ile korunuyor, `tenantId` şemadan tamamen
  kaldırıldı (her zaman `req.kullanici.tenantId`'den zorla alınıyor), `rol`
  enum'undan `SUPER_ADMIN` çıkarıldı. Dosyalar: `schemas/auth.schema.js`,
  `routes/auth.routes.js`, `controllers/auth.controller.js`.
- `kayitOl`'da `subeId` sahiplik kontrolü (IDOR) eklendi.
- `tokenDogrula`'da eksik olan pasif firma kontrolü eklendi (önceden pasife
  alınmış bir firmanın kullanıcıları token süresi dolana kadar erişebiliyordu).
- `girisYap`'ta timing side-channel (email enumeration) kapatıldı — sahte
  bcrypt karşılaştırmasıyla zamanlama eşitlendi.
- Dosya: `services/auth.service.js`.

### stok
- **`zayiEkle`/`tuketimEkle` TOCTOU race condition** ✅ Düzeltildi — transfer
  ile aynı desen (Serializable transaction + `P2034` → 409). Dosyalar:
  `services/stok.service.js`, `controllers/stok.controller.js`.
- `aySonuSayimEkle`'de transaction içi okumanın `tx` yerine dış `prisma`
  kullanması (tutarlılık sorunu) ✅ Düzeltildi.
- `/hareketler` route'unda eksik `validateQuery` ✅ Düzeltildi —
  `hareketlerQuerySchema` eklendi. Dosyalar: `schemas/stok.schema.js`,
  `routes/stok.routes.js`.

### kategori, olcuBirimi, auditLog
İncelendi — tenant izolasyonu, yetkilendirme, foreign key kontrolleri
(olcuBirimi silme öncesi bağlı stok kartı kontrolü gibi) sorunsuz. **Hiçbir
değişiklik gerekmedi.**

### feedback + mail.service.js
- **SMTP TLS sertifika doğrulaması kapalıydı** (`rejectUnauthorized: false`)
  ✅ Kaldırıldı — MITM riski taşıyordu, hem `feedback.controller.js`'deki hem
  `mail.service.js`'deki transporter'da vardı.
- **HTML injection — `mail.service.js`** ✅ Düzeltildi. `odemeBildirimMailGonder`'daki
  `not` alanı (tenant kullanıcısının serbestçe girdiği ödeme notu) ve
  `firmaAd`/`adminAd` (kayıt formundan gelen, herkesin serbestçe
  girebileceği değerler) kaçışlanmadan admin'e giden e-postalara
  gömülüyordu. `htmlKacisla()` fonksiyonu eklenip tüm kullanıcı kontrolündeki
  alanlara uygulandı (feedback'teki mevcut korumayla aynı desen).

---

## 7. Şu An Neredeyiz — Test Aşaması

Tüm düzeltmeler yazıldı, kullanıcı deploy etti. **Adım adım doğrulama
testine başlandı.**

**Test sırası:**
1. 🔄 **ŞİMDİ BURADAYIZ** — `/api/auth/kayit`'in artık kimliksiz erişimi
   reddettiğini doğrulama (en kritik test, sonucu bekleniyor)
2. Giriş yapmış bir `TENANT_ADMIN` olarak `/kayit`'in normal çalıştığını
   doğrulama
3. Transfer/stok'ta eşzamanlılık düzeltmelerinin bozucu bir yan etkisi
   olmadığını doğrulama (normal akış hâlâ çalışıyor mu)
4. Dashboard'un MUDUR/PERSONEL için doğru kısıtlandığını doğrulama
5. Feedback/ödeme bildirimi maillerinin hâlâ gönderildiğini doğrulama
   (TLS ayarı kaldırıldığı için gönderim hatası riski var — SMTP
   sağlayıcısının sertifikası gerçekten sorunsuzsa mail gitmeye devam eder)

---

## 8. Ortam / Altyapı Notları

- Backend: Render'da barındırılıyor (`gastrobrain-backend`), prod URL:
  `https://api.gastrobrain.com.tr`
- Veritabanı: Supabase (Postgres), Prisma ORM ile erişiliyor.
- Frontend: `https://app.gastrobrain.com.tr`
- Token localStorage key'i: `gastroiq_token`
- Test yöntemi: tarayıcı konsolunda `fetch(...)` ile manuel istek.
- SUPER_ADMIN paneli: `app.gastrobrain.com.tr/super-admin`

---

## 9. Bir Sonraki Oturumda Nereden Devam Edilecek

1. Bu dosyayı Claude'a ver.
2. Bölüm 1-6 **tamamen bitti** — tekrar ele almaya gerek yok.
3. Sıradaki iş: **Bölüm 7'deki test adımlarını** sırayla tamamlamak.
   Şu an Adım 1'in sonucu bekleniyor — `/api/auth/kayit` testi.
4. Testler bitince yeni bir özellik/iyileştirme isteğine geçilebilir.