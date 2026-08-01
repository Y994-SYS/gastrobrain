# GastroBRAIN Backend — Güvenlik Sertleştirme Çalışması (Context)

Bu dosya, GastroBRAIN backend'inde yürütülen güvenlik iyileştirmelerinin
tam kaydıdır. Yeni bir oturumda kaldığımız yerden devam etmek için bu
dosyayı paylaşman yeterli.

---

## Genel Yaklaşım

Sırasıyla şu aşamalardan geçildi: **rate limiting → Zod input validation →
servis katmanı sertleştirme (Bölüm 1-3) → HTTPS/loglama/env güvenliği
(Bölüm 5-A) → personel izin takibi özelliği (Bölüm 5-B) → tüm modüllerin
genel güvenlik taraması (Bölüm 6) → adım adım prod testleri (Bölüm 7) →
yayın öncesi 5 madde: deploy kontrolü, otomatik testler, KVKK, yedekleme,
bağımsız denetim ihtiyacı (Bölüm 8-9)**.

---

## 1. Rate Limiting (TAMAMLANDI ✅)
`tokenVarsaCoz` middleware'i eklendi, `ipKeyGenerator` ile IPv6 prod hatası
düzeltildi.

## 2. Zod ile Input Validation (TAMAMLANDI ✅)
Tüm route grupları için `validate`/`validateParams`/`validateQuery` eklendi.

## 3. Servis Katmanı Sertleştirme — İlk Tur (TAMAMLANDI ✅)
IDOR (`stokKart`, `recete`), `satis.ekle` şube yetki atlatma, `recete.guncelle`
transaction eksikliği, `kullanici.guncelle` subeId sıfırlama riski — hepsi
düzeltildi.

## 4. Yol Boyunca Bulunan Ayrı Hatalar
`Sentry` import eksikliği, `stokKart.routes.js`/`cariKart.routes.js` içerik
kopyalama hatası — düzeltildi.

## 5. Bölüm 5-A / 5-B (TAMAMLANDI ✅)
HTTPS/HSTS, Loglama (Winston+Morgan), Env variable güvenliği (eksik
`SENTRY_DSN` eklendi), Personel izin takibi (yeni özellik: `PersonelIzin`
modeli, kıdeme göre otomatik hesaplama, toplu tarih aralığı girişi) —
hepsi tamamlanıp deploy edildi.

## 6. Genel Güvenlik Taraması (TAMAMLANDI ✅)

- **cariHareket + transfer**: Transfer'de TOCTOU race condition ✅
  (Serializable transaction + `P2034`→409). Dosya: `transfer.controller.js`.
- **odeme + superAdmin**: `onayla`/`reddet` çift işlenme riski ✅ (atomik
  `updateMany` "claim" deseni). Dosya: `odeme.controller.js`.
- **export + rapor + dashboard**: `dashboard.routes.js`'de rol kontrolü
  tamamen eksikti ✅ (artık `TENANT_ADMIN`/`MUDUR` ile sınırlı).
- **sube**: MUDUR rolü tutarsızlığı ✅ — karar: **MUDUR = sadece kendi
  şubesi** (`sube.controller.js` + `dashboard.controller.js` güncellendi).
- **auth (🔴 KRİTİK)**: `POST /api/auth/kayit` — kimliksiz privilege
  escalation (herkes `SUPER_ADMIN` hesabı oluşturabiliyordu) ✅ Düzeltildi.
  Ayrıca: `subeId` IDOR, `tokenDogrula` pasif firma kontrolü eksikliği,
  timing side-channel — hepsi düzeltildi. Dosyalar: `auth.schema.js`,
  `auth.routes.js`, `auth.controller.js`, `auth.service.js`.
- **stok**: `zayiEkle`/`tuketimEkle` TOCTOU race condition ✅,
  `aySonuSayimEkle` transaction tutarlılığı ✅, `/hareketler` eksik
  `validateQuery` ✅. Dosyalar: `stok.service.js`, `stok.controller.js`,
  `stok.schema.js`, `stok.routes.js`.
- **kategori, olcuBirimi, auditLog**: incelendi, sorun yok.
- **feedback + mail.service.js**: SMTP TLS sertifika doğrulaması
  (`rejectUnauthorized:false`) kaldırıldı ✅, HTML injection (`not`,
  `firmaAd`/`adminAd` alanları) `htmlKacisla()` ile kapatıldı ✅.

---

## 7. Adım Adım Prod Testleri (TAMAMLANDI ✅)

Tüm düzeltmeler tarayıcı konsolundan `fetch` ile canlıda tek tek test edildi:

- ✅ `/api/auth/kayit` kimliksiz erişimi reddediyor (`401`)
- ✅ Yetkili `TENANT_ADMIN` normal kullanıcı oluşturabiliyor
- ✅ `SUPER_ADMIN` bile `rol:SUPER_ADMIN` ile kilitli (`403`, iki savunma
  katmanı da çalışıyor)
- ✅ Stok — normal zayi kaydı (TOCTOU düzeltmesi sonrası) sorunsuz
- ✅ Dashboard — `PERSONEL` erişemiyor (`403`) — **ilk testte deploy
  edilmemiş bir dosya (`dashboard.routes.js`) yakalandı, düzeltilip
  yeniden deploy edildi, sonra doğrulandı**
- ✅ Bonus bulgu: `personelSchema`'da boş `subeId` (`''`) hatası
  (frontend'den personel eklerken 400 hatası veriyordu) bulunup düzeltildi
- ✅ Feedback/mail gönderimi — TLS düzeltmesi sonrası hâlâ çalışıyor
  (gerçek mail alındı, doğrulandı)
- ✅ Sube/MUDUR — kendi şubesine erişebiliyor, başka şubeye `403`
- ✅ Transfer — geçici bir test şubesi (`id:11`) oluşturulup normal
  transfer akışı (Serializable sonrası) doğrulandı

**Ders çıkarımı:** Bir düzeltme (`dashboard.routes.js`) ilk seferde deploy
edilmemişti, adım adım test bunu hemen yakaladı — bu yöntemin değerini
kanıtladı.

**Temizlik:** Test personelleri (`Deneme`, `Deneme3`) silindi. Test
kullanıcıları (`test-calisan@test.com` / PERSONEL, `test-mudur@test.com`
/ MUDUR, ikisi de şifre `123456`) ve test şubesi (`id:11`, pasife alındı)
**bilerek silinmedi** — otomatik testlerde (Bölüm 8) kullanılıyorlar.

---

## 8. Yayın Öncesi 5 Madde (TAMAMLANDI ✅)

Kullanıcı "uygulama yayına hazır mı" diye sordu, 5 maddelik bir kontrol
listesi verildi ve hepsi tek tek uygulandı:

### 8.1 Deploy edilen dosyaların kontrolü ✅
`git status`/`git log` ile local = GitHub doğrulandı, Render Events
sekmesinde son commit hash'inin (`2850cc9`) "Live" olduğu teyit edildi.

### 8.2 Otomatik güvenlik regresyon testleri ✅
- `backend/tests/guvenlik.test.js` (yeni) — kritik auth/dashboard/rol
  testleri, canlı API'ye (`https://api.gastrobrain.com.tr`) karşı çalışıyor.
- `backend/src/tests/api.test.js` ve `auth.test.js` (eski, `localhost:3001`'e
  bağımlıydı) — canlı API'ye ve gerçek `.env.test` kimlik bilgilerine
  çalışacak şekilde güncellendi.
- **Önemli teknik bulgu:** Node'un `fetch`/`supertest`'i tarayıcının aksine
  `Origin` header'ı eklemiyor → production CORS middleware'i bunu "Origin
  zorunlu" hatasıyla `403` reddediyor (auth kontrolüne hiç ulaşmadan). Tüm
  test isteklerine `Origin: https://app.gastrobrain.com.tr` header'ı
  eklenerek çözüldü.
- `backend/tests/setup.js` + `backend/vitest.config.js` eklendi — `.env.test`
  dosyasını (dotenv ile) testlerden önce otomatik yükler.
- `backend/.env.test` (git'e girmez, `.gitignore`'a eklendi) — şu
  değişkenleri içeriyor: `TEST_TENANT_SLUG=evyemekleri`,
  `TEST_PERSONEL_EMAIL`/`SIFRE`, `TEST_MUDUR_EMAIL`/`SIFRE`,
  `TEST_ADMIN_EMAIL=evyemekler@gmail.com`/`TEST_ADMIN_SIFRE`.
- **Sonuç: `npm test` → 17/17 test yeşil, 0 hata, 0 atlama.**

### 8.3 KVKK yol haritası ✅
Zaten var olan Gizlilik Politikası / Kullanım Koşulları / Mesafeli Satış
Sözleşmesi sayfaları incelendi, iyi durumda bulundu, üç eksik giderildi:
1. **Açık rıza checkbox'ı** — `KayitFirma.jsx`'e eklendi (buton, checkbox
   işaretlenmeden disabled; `handleSubmit`'te de ayrı kontrol var).
2. **Yurt dışına veri aktarımı bölümü** — Gizlilik Politikası'na yeni
   "Bölüm 6" olarak eklendi (Supabase/Render AB/AEA'da barındırılıyor,
   KVKK md.9 açık rıza gerekçesi açıklandı).
3. **Veri Sorumlusu / Veri İşleyen ayrımı** — Gizlilik Politikası'na yeni
   "Bölüm 2" olarak eklendi (hesap verileri için GastroBrain veri
   sorumlusu, ama müşterinin kendi personel verileri — TC kimlik, maaş —
   için müşteri firma veri sorumlusu, GastroBrain veri işleyen).
4. **VERBİS araştırması** — web'den güncel eşikler kontrol edildi (50
   çalışan / 100M TL bilanço / özel nitelikli veri ana faaliyeti). Kullanıcı
   şahıs, gelirsiz, tek başına → **VERBİS kaydı gerekmiyor**, ama bu diğer
   KVKK yükümlülüklerini ortadan kaldırmıyor (zaten üstteki 3 madde
   yapıldı).
5. **Şahıs/şirket riski** — kullanıcı şahıs olarak faaliyet gösteriyor,
   kişisel/işletme mal varlığı hukuken ayrışmıyor. Şu an gelir olmadığı
   için acil değil, ama gerçek müşteri/gelir başladığında Limited Şirket'e
   geçmeyi bir mali müşavirle değerlendirmesi önerildi.

**Deploy edilmesi gereken frontend dosyaları:** `KayitFirma.jsx` (checkbox),
`GizlilikPolitikasi` sayfası (yeni bölüm 2 ve 6 + numaralandırma).

### 8.4 Yedekleme ✅
Supabase Free plan'da otomatik backup yok (`Upgrade to Pro` gerekiyor,
$25/ay+, bütçe yok). Ücretsiz alternatif kuruldu:
- `.github/workflows/backup.yml` — GitHub Actions, her gün TSİ 04:00'te
  otomatik çalışıyor, `pg_dump` ile yedek alıp Actions Artifacts'e
  yüklüyor (90 gün saklanır).
- **Çözülen teknik sorunlar:** (1) Encoding bozulması (Notepad ile
  kaydedilince Türkçe karakterler bozuldu — PowerShell `Set-Content
  -Encoding utf8` ile düzeltildi), (2) `pg_dump` sürüm uyuşmazlığı
  (Ubuntu'nun varsayılan istemcisi v16, Supabase sunucusu v17.6 —
  PostgreSQL'in resmi APT deposu eklenip `postgresql-client-17`
  kurularak çözüldü).
- GitHub secret: `SUPABASE_DIRECT_URL` (Render'daki `DIRECT_URL` ile aynı
  değer).
- **Doğrulandı:** Workflow başarıyla çalıştı, indirilen `.dump` dosyası
  `file` komutuyla geçerli bir "PostgreSQL custom database dump v1.16-0"
  olarak doğrulandı (291 KB, sunucu sürümü 17.6 ile eşleşiyor).

### 8.5 Bağımsız denetim ihtiyacı ✅
Şu an gerekli değil. Şu durumlardan biri olduğunda tekrar değerlendirilmeli:
gerçek ödeme/kredi kartı entegrasyonu eklenirse, müşteri sayısı ciddi
artarsa, ya da kurumsal bir müşteri denetim raporu isterse.

---

## 9. Ortam / Altyapı Notları

- Backend: Render (`gastrobrain-backend`), prod URL:
  `https://api.gastrobrain.com.tr`
- Veritabanı: Supabase (Postgres 17.6), Prisma ORM, `eu-west-1` (İrlanda)
- Frontend: `https://app.gastrobrain.com.tr`
- Token localStorage key'i: `gastroiq_token`
- Test kullanıcıları (bilerek silinmedi, `.env.test`'te kullanılıyor):
  - `evyemekler@gmail.com` — TENANT_ADMIN (gerçek admin hesabı)
  - `test-calisan@test.com` / `123456` — PERSONEL
  - `test-mudur@test.com` / `123456` — MUDUR (şube id: 10)
  - Test şubesi `id:11` ("TEST - Geçici Şube") — pasif durumda
- Backend testleri: `backend/tests/guvenlik.test.js`,
  `backend/src/tests/api.test.js`, `backend/src/tests/auth.test.js` —
  `npm test` ile çalıştırılır, `.env.test` gerektirir.
- Yedekleme: `.github/workflows/backup.yml`, GitHub Actions Artifacts,
  günlük TSİ 04:00.
- Kullanıcı: **Şahıs**, tek başına, henüz gelirsiz.
- SUPER_ADMIN paneli: `app.gastrobrain.com.tr/super-admin`

---

## 10. Bir Sonraki Oturumda Nereden Devam Edilecek

1. Bu dosyayı Claude'a ver.
2. Bölüm 1-8 **tamamen bitti** — tekrar ele almaya gerek yok.
3. **Deploy edilmesi gereken, henüz teyit edilmemiş olabilecek dosyalar:**
   `KayitFirma.jsx`, `GizlilikPolitikasi` sayfası — bunların deploy edilip
   edilmediğini bir sonraki oturumda kontrol et.
4. Yeni bir özellik/iyileştirme isteğine geçilebilir, ya da istenirse
   şirketleşme (Limited Şirket) konusu ayrıca ele alınabilir.