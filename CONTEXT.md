# GastroBrain — Proje Context Dosyası

## PROJE BİLGİLERİ
- **Proje:** GastroBrain — Restoran Yönetim SaaS Sistemi
- **Lokasyon:** `C:\Users\alkan\Projects\gastroiq`
- **Son Güncelleme:** Ağustos 2026 (Faz 17 sonrası)

## STACK
- **Backend:** Node.js v22 + Express + Prisma ORM v6 + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS v4
- **Landing:** Next.js v16 (App Router)
- **Veritabanı:** Supabase PostgreSQL (production), localhost:5432 (local)
- **Auth:** JWT (bcryptjs + jsonwebtoken)
- **Mail:** Resend (HTTPS API) — **Nodemailer/SMTP'den geçildi.** Render'ın ücretsiz planındaki outbound SMTP port kısıtlamasını (587/465/25) bypass etmek için tüm mail gönderimi artık Resend'in REST API'sine (`https://api.resend.com/emails`) normal HTTPS (443) üzerinden yapılıyor. `SMTP_USER` env değişkeni hâlâ kod içinde admin fallback email adresi olarak kullanılıyor (`FEEDBACK_EMAIL || SMTP_USER`), ama gerçek gönderim SMTP değil.
- **Cron:** node-cron + cron paketi (lisans uyarı, merkez depo, planlı transfer, stok raporları, self-ping)
- **Error Monitoring:** Sentry (`@sentry/node`)
- **Hosting:** Render.com (backend + frontend + landing, ayrı servisler)
- **DNS:** Cloudflare (gastrobrain.com.tr, İsimtescil'den alındı — **DNS only, proxy kapalı**, tüm trafik doğrudan Render'a gidiyor)

## ÖNEMLİ NOTLAR
- Prisma v6 kullanılıyor (v7 DEĞİL — `prisma.config.ts` olmadan çalışıyor)
- Tailwind v4 kullanılıyor (`@tailwindcss/vite` plugin ile, `tailwind.config.js` YOK)
- PostgreSQL path'e ekli değil: `& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres`
- Frontend port: 5173, Backend port: 3001, Landing port: 3000
- Tema: Koyu (zinc-950 bg), lime-400 accent rengi
- PowerShell'de `$disconnect` ve `$transaction` inline `node -e` komutlarında sorun çıkarıyor → dosya olarak çalıştır
- `landing` klasörü `gastroiq/landing` altında (submodule değil, normal klasör). Next.js App Router'da `page.tsx` **server component** (SEO `metadata` export'u için), asıl içerik `home-client.tsx` adlı ayrı bir `'use client'` dosyasında — `metadata` export'u client component'te çalışmıyor.
- `auth.store.js`'de `setKullanici` fonksiyonu var — profil güncellemede kullanılıyor
- Şema değişikliklerinde `npx prisma migrate dev` DEĞİL `npx prisma db push` kullan — migration history Supabase'de tutulmuyor, `migrate dev` "drift detected" deyip reset istiyor (VERİ KAYBI RİSKİ). `db push` veriyi koruyarak şemayı senkronize eder.
- Render Build Command'ı `npm install && npx prisma generate` olmalı — sadece `npm install` Prisma Client'ı eski şemadan üretilmiş halde bırakabilir
- Render free PostgreSQL (e-ticaret-db / eski "eticaretdb_94wj") KULLANILMIYOR — production veritabanı tamamen Supabase'e taşındı
- Render env değişkeni düzenlerken **aynı isimde ikinci bir satır ekleme** — "Duplicate key" hatası verir ve kaydetmeyi engeller. Var olan satırı düzenle.
- PowerShell'de `curl` gerçek curl değil, `Invoke-WebRequest` takma adı — farklı syntax ister (`-Method`, `-Headers @{}`, `-Body`), ayrıca tarayıcı gibi CORS preflight göndermez; gerçek tarayıcı davranışını test etmek için `-Headers @{"Origin"=...; "Access-Control-Request-Method"=...}` ile `-Method OPTIONS` manuel simüle edilmeli.

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
- Frontend (App): https://app.gastrobrain.com.tr
- Backend (API): https://api.gastrobrain.com.tr
- İletişim formu ucu: https://api.gastrobrain.com.tr/api/iletisim (landing'den çağrılıyor — **dikkat:** `app.` değil `api.` subdomain'i, bu ayrım daha önce bir prod hatasına yol açmıştı)
- Süper Admin: https://app.gastrobrain.com.tr/super-admin
- (Eski Render alt domainleri hâlâ çalışıyor olabilir ama artık custom domain birincil: gastrobrain-frontend.onrender.com, gastrobrain-backend.onrender.com, gastrobrain-landing.onrender.com)

### DNS Yapısı (Cloudflare — DNS only, proxy kapalı)
| Tür | Ad | Hedef |
|---|---|---|
| CNAME | @ (gastrobrain.com.tr) | gastrobrain-landing.onrender.com |
| CNAME | www | gastrobrain-landing.onrender.com |
| CNAME | app | gastrobrain-frontend.onrender.com |
| CNAME | api | gastrobrain-backend.onrender.com |
| MX | send | feedback-smtp.ap-... (Resend domain doğrulama) |
| TXT | @ | resend-domain-verif... (Resend domain doğrulama) |
| TXT | resend._domaink... | DKIM |
| TXT | send | SPF (`v=spf1 include:amaz...`) |
| TXT | _dmarc | DMARC (`v=DMARC1; p=none;`) |

Nameserver: elinore.ns.cloudflare.com, woz.ns.cloudflare.com
Render Custom Domain durumu: tüm 4 domain Verified ✅ + Certificate Issued ✅
Landing `APP_URL`: `https://app.gastrobrain.com.tr/kayit` — Navbar'da "Giriş Yap" butonu `app.gastrobrain.com.tr/giris`'e gidiyor

## VERİTABANI
- `gastroiq_dev` — PostgreSQL localhost:5432 (local)
- Supabase PostgreSQL — proje ID: `cqeexgnzjlikyjxiphjf`, `aws-0-eu-west-1.pooler.supabase.com`
  - `DATABASE_URL`: port 6543, `pgbouncer=true` (Prisma transaction pooler)
  - `DIRECT_URL`: port 5432 (migration/db push için)
- Toplam 22 tablo (Tenant, Kullanici, Sube, Kategori, OlcuBirimi, StokKart, StokHareket, Recete, ReceteKalem, Satis, CariKart, CariHareket, CariHareketKalem, Personel, PersonelMaas, PersonelAvans, PersonelDevam, AuditLog, OdemeBildirimi, MerkezDepo, MerkezDagitim, PlanliTransfer, PlanliTransferKalem)
- **Faz 16'da eklenen alan:** `Sube.merkezMi Boolean @default(false)` — hangi şubenin merkez depo olduğunu işaretler. Bir tenant'ta aynı anda yalnızca bir şube `true` olabilir (bu, `sube.controller.js`'deki `merkezYap` fonksiyonunun transaction içinde garanti ettiği bir kural, DB constraint değil).
- Render'ın kendi ücretsiz PostgreSQL servisi (eski "eticaretdb_94wj") kullanılmıyor — Render backend'de `DATABASE_URL`'in gerçekten Supabase'e işaret ettiğinden emin ol (proje ID `cqeexgnzjlikyjxiphjf` geçmeli)

## ROL SİSTEMİ (6 Rol) — RBAC tam uygulandı
| Rol | Erişim |
|---|---|
| SUPER_ADMIN | Hiçbir tenant'a bağlı değil (`tenantId: null`, `subeId: null`). SADECE `/super-admin` panelini kullanabilir. |
| TENANT_ADMIN | Firma sahibi. Kendi tenant'ının tüm modüllerine erişir, kullanıcı/şube yönetir. |
| MUDUR | Stok, satış, reçete, cari, rapor, personel modüllerine erişir. Kullanıcı/şube yönetimine erişemez. |
| DEPO | Sadece stok modülü. |
| KASA | Sadece satış ekranı. |
| PERSONEL | En kısıtlı. Sadece kendi devam/mesai/avans bilgisini görür. |

**ÖNEMLİ:** `ADMIN` enum değeri kullanılmıyor — gerçek admin rolü her zaman `TENANT_ADMIN`.
**🔒 Güvenlik kısıtı:** `kullanici.controller.js`'deki `ATANABILIR_ROLLER` whitelist'i sadece TENANT_ADMIN, MUDUR, DEPO, KASA, PERSONEL atanmasına izin veriyor — SUPER_ADMIN normal formdan asla atanamaz.

## TEST KULLANICILARI (local)
| Email | Şifre | Rol | Firma |
|---|---|---|---|
| admin@gastroiq.com | 123456 | TENANT_ADMIN | merkez-restoran |
| test@gastroiq.com | 123456 | MUDUR | merkez-restoran |
| super@gastroiq.com | 123456 | SUPER_ADMIN | merkez-restoran |

## PRODUCTION KULLANICILARI
| Email | Rol |
|---|---|
| super@gastroiq.com | SUPER_ADMIN |
| nazar@gmail.com | TENANT_ADMIN (nazaret) |
| alkan.yazilim.dev@gmail.com / alkanyasin3134@... | TENANT_ADMIN (test tenant'lar, örn. tenant id 8 "Hatay kebap") |

## ORTAM DEĞİŞKENLERİ

### Backend (.env)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://postgres.cqeexgnzjlikyjxiphjf:****@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=...
JWT_EXPIRES_IN=7d

# Mail — Resend (Faz 15'te SMTP'den geçildi)
RESEND_API_KEY=re_...
MAIL_FROM=GastroBrain <onboarding@resend.dev>   # domain doğrulanınca: bildirim@gastrobrain.com.tr
SMTP_USER=senin@gmail.com                        # artık sadece "admin fallback email" olarak okunuyor, SMTP ile gönderim YAPILMIYOR
FEEDBACK_EMAIL=senin@gmail.com

APP_URL=https://app.gastrobrain.com.tr
NODE_ENV=production
SENTRY_DSN=...

# CORS — Faz 15'te landing'in iletişim formu için genişletildi
ALLOWED_ORIGINS=https://app.gastrobrain.com.tr,https://gastrobrain.com.tr,https://www.gastrobrain.com.tr
```

### Frontend (.env)
```
VITE_API_URL=https://api.gastrobrain.com.tr
```

---

## TAMAMLANAN FAZLAR

### Faz 1 — Altyapı ✅
Node.js v22, PostgreSQL 18, Git kurulu. Express + Prisma + JWT auth. React + Vite + Tailwind. 18 tablo. Login çalışıyor.

### Faz 2 — Çekirdek Modüller ✅
Tüm ana API'ler (`/api/auth`, `/api/kategoriler`, `/api/olcu-birimleri`, `/api/stok-kartlari`, `/api/cari-kartlar`, `/api/stok`, `/api/receteler`, `/api/satislar`, `/api/cari-hareketler`, `/api/personel`, `/api/raporlar`, `/api/subeler`, `/api/kullanicilar`) ve karşılık gelen frontend sayfaları. Vitest: 11/11 test geçiyor.

### Faz 3 — Multi-Tenant ✅
Tenant modeli + tüm tablolara `tenantId`. JWT'ye `tenantId` eklendi. 2 adımlı login. `kayit-firma` transaction. Lisans bitiş kontrolü.

### Faz 4 — Production Ready ✅
XSS/HPP koruması, rate limiting, DB index'leri, Supabase migration, race condition fix, Prisma tenantId middleware, Sentry, audit log.

### Faz 5 — Satış & Büyüme ✅
Landing page, demo seed, kullanım kılavuzu (`/rehber`, `/yardim`), geri bildirim, deploy.

### Faz 5 Devam — Lisans & Abonelik ✅
30 gün ücretsiz deneme, hoşgeldin maili, lisans bitiş uyarı maili, `/abonelik` sayfası, super admin hızlı lisans uzatma, `/profil`.

### Faz 6 — Stabilite & Monitoring ✅
Supabase pooling, race condition fix, tenantId middleware, Sentry, mobil uyumluluk, audit log.

### Faz 7 — RBAC ✅
Her route dosyasına `rolKontrol(...)`. Frontend `PrivateRoute roller={...}`, `Layout.jsx` rol bazlı sidebar, `Dashboard.jsx` role özel 4 görünüm, `Yetkisiz.jsx`.

### Faz 8 — SUPER_ADMIN İzolasyonu ✅
`Kullanici.tenantId → Int?`. SUPER_ADMIN tenant-scoped route'lardan çıkarıldı.

### Faz 9 — Küçük İyileştirmeler ✅
Kullanıcı Yönetimi mobil uyum, rol bilgi kutusu, logo, hata yönetimi düzeltmeleri.

### Faz 10 — Performance (Optimistic UI) ✅
Satislar/CariHesap/Personel'de optimistic update. Dashboard `Promise.allSettled` ile paralel yükleme.

### Faz 11 — Şube Yönetimi Geliştirmeleri ✅
Şube kartı özet veriler (günlük satış, kritik stok). Şubeler Arası Stok Transferi (Transfer.jsx, transfer.controller.js). Şube Detay sayfası (4 sekme). Stok Durumu tutarsızlık düzeltmesi. `stok.service.js` N+1 fix + AY_SONU_SAYIM düzeltmesi. Demo seed sadeleştirildi. CORS/rate-limit/payload-limit güvenlik iyileştirmeleri.

### Faz 12 — Çok Şubeli Yapı Geliştirmeleri ✅
`subeIdBelirle(req)` deseni tüm controller'lara yayıldı (hardcoded `subeId = 1` kaldırıldı). `SubeSecici.jsx` + `subeStore.js` (Zustand). Dashboard'a Şube Özeti paneli.

### Faz 13 — Ödeme Takibi, Veri Export, Güvenlik & Yasal Sayfalar ✅
`OdemeBildirimi` modeli + onay/red akışı. Excel export (`export.controller.js`, 5 modül). Yasal sayfalar (gizlilik, kullanım koşulları, mesafeli satış). CORS'a PATCH eklendi. Demo seed tamamen temizlendi (satış/stok/personel/cari yok).

### Faz 14 — Çok Şubeli Yapı & Paket Sistemi Geliştirmeleri ✅
`paketKontrol.middleware.js` ilk hâli (BASLANGIC/PROFESYONEL/KURUMSAL — **bu noktada tam blok modeliydi, Faz 17'de değişti**). Şube Karşılaştırma Raporu, Merkez Muhasebesi Raporu. **Merkez Depo modülü** (ilk hâli — `subeId: 1` hardcode ile, bkz. Faz 16 düzeltmesi). **Planlı Transferler** (çoklu kalem). Şube Transferi çoklu kalem desteği. Stok Uyarı Sistemi (kritik stok + günlük rapor mailleri). Dashboard widget'ları. `auth.controller.js` → `beniGetir()`.

### Faz 15 — İletişim Formu & Mail Altyapısı Değişimi ✅
**Mail servisi Nodemailer/SMTP'den Resend HTTPS API'sine taşındı** — Render'ın ücretsiz planı outbound SMTP portlarını (587/465/25) kapattığı için mailler hiç gönderilemiyordu (`await` sonsuza dek bekliyordu). `mail.service.js` artık `fetch('https://api.resend.com/emails', ...)` kullanıyor; tüm mevcut mail fonksiyonları (hoşgeldin, lisans uyarı, şifre sıfırlama, ödeme bildirimi, kritik stok, günlük rapor, geri bildirim) bu ortak `mailGonder()` fonksiyonuna taşındı, hepsinde `htmlKacisla()` ile HTML injection koruması var.

**Yeni:** Landing page'e gerçek bir iletişim formu eklendi (öncesinde sadece `mailto:`/WhatsApp linkleri vardı):
- `mail.service.js` → `iletisimFormuMailGonder({ ad, email, telefon, mesaj })` eklendi
- `backend/src/controllers/iletisim.controller.js` 🆕 — public, doğrulama (email regex, uzunluk limitleri)
- `backend/src/routes/iletisim.routes.js` 🆕 — **bilerek `authMiddleware` YOK**, herkese açık
- `index.js`'e mount edildi: `app.use('/api/iletisim', iletisimRoutes);`
- `landing/components/ContactForm.tsx` 🆕 — dark/lime temaya uygun form, `https://api.gastrobrain.com.tr/api/iletisim`'e POST atıyor
- `landing/app/page.tsx` server component'e bölündü, asıl JSX `landing/app/home-client.tsx`'e taşındı (SEO `metadata` export'u için) — bu iki dosya artık ayrı
- **Prod hatası ve dersi:** `ContactForm.tsx`'te ilk yazımda `ILETISIM_API_URL` yanlışlıkla `app.gastrobrain.com.tr` (frontend) yapılmıştı, olması gereken `api.gastrobrain.com.tr` (backend) idi — saatlerce "CORS hatası" gibi görünen bir sorun aslında yanlış subdomain'e istek atmaktan kaynaklanıyordu. `curl`/`Invoke-WebRequest` testleri doğru URL ile yapıldığı için hep başarılı çıkıp yanıltmıştı.
- `ALLOWED_ORIGINS` env değişkeni `gastrobrain.com.tr` ve `www.gastrobrain.com.tr`'yi de içerecek şekilde genişletildi (landing farklı bir origin olduğu için).
- Landing'de sahte müşteri logosu/yorumu yerine dürüst bir "🚀 Erken erişim aşamasındayız" şeridi eklendi. WhatsApp butonu eklendi (numara: `905102232885`, `home-client.tsx`'te `WHATSAPP_NUMARA` sabiti — gerçek numarayla güncellenmeli). Hero istatistiklerinden kanıtlanamayan "%30 daha az fire" rakamı çıkarıldı.

### Faz 16 — Merkez Depo Düzeltmeleri & Performans ✅
Merkez Depo modülü, Faz 14'te `subeId: 1` hardcode ile yazılmıştı (hangi şubenin merkez olduğu kod içinde sabitti). Gerçek kullanımda ciddi hatalar ortaya çıktı, sırayla düzeltildi:

1. **Merkez şube artık dinamik:** `Sube.merkezMi` alanı eklendi. `merkezDepo.service.js`'de `merkezSubeGetir(tenantId)` fonksiyonu, `merkezMi: true` olan şubeyi bulur; yoksa anlamlı bir hata döner ("lütfen bir şubeyi merkez depo olarak işaretleyin").
2. **Kaynak stok kontrolü eklendi:** Öncesinde merkez şubenin stok kontrolü hiç yapılmıyordu, dağıtım negatif stoğa yol açabiliyordu. Artık `manuelDagit` öncesi merkez bakiyesi kontrol ediliyor.
3. **Self-transfer engeli:** Merkez şube kendi kendine hedef olamaz (hem manuel hem otomatik dağıtımda).
4. **KRİTİK bakiye hesaplama bug'ı:** `merkezDepo.service.js`'in kendi (basit/hatalı) `bakiyeHesapla` kopyası vardı — `IADE_FATURA`'yı yanlışlıkla GİRİŞ sayıyordu (doğrusu ÇIKIŞ) ve `AY_SONU_SAYIM`'ı hiç özel işlemiyordu (büyük sayım düzeltmelerinde anlamsız negatif bakiyeler — örn. -2990 kg — üretiyordu). Çözüm: kendi hesaplamasını tamamen kaldırıp `stok.service.js`'deki **tek doğru kaynağı** (`mevcutStokGetir`) kullanmaya geçti. Bu, `rapor.controller.js`'nin daha önce yaşadığı aynı sınıf hatanın bir tekrarıydı — ders: bakiye hesabı asla ikinci kez yazılmamalı.
5. **Toplu tanım ekleme:** `tumunuEkle(tenantId)` — tüm stok kartlarını, `StokKart.minStok` değerini varsayılan alarak tek seferde merkez depo tanımına ekler (100+ ürünlü işletmelerde tek tek girme yükünü kaldırır). Endpoint: `POST /api/merkezdepo/tanim/tumu`.
6. **Toplu dağıtım (checklist UI):** `topluDagit({ hedefSubeId, kalemler })` — tek hedef şubeye birden fazla kalemi checkbox + miktar ile tek istekte gönderir, kısmi başarı destekler (biri başarısız olursa diğerleri etkilenmez). Endpoint: `POST /api/merkezdepo/dagit/toplu`. Frontend'de "Tümünü Seç (min seviyeyle doldur)" kısayolu var.
7. **Performans:** `durumuGetir` ve `otomatiDagitimYap`, tanım × şube kombinasyonlarını sırayla (await ile bloklayarak) sorguluyordu — 22 tanım × 2 şube gibi durumlarda 20 saniyeye varan yavaşlığa yol açıyordu. Okuma (bakiye hesaplama) kısımları `Promise.all` ile paralelleştirildi; yazma (gerçek dağıtım) kısmı TOCTOU riski nedeniyle bilerek sıralı bırakıldı.
8. **Merkez şube UI'dan işaretlenebiliyor:** Öncesinde sadece SQL ile elle yapılabiliyordu. `sube.controller.js`'e `merkezYap`/`merkezKaldir` eklendi (`PATCH /api/subeler/:id/merkez-yap`, `PATCH /api/subeler/:id/merkez-kaldir`, sadece TENANT_ADMIN) — yeni bir şube merkez yapılınca öncekinin işareti tek transaction içinde otomatik kaldırılıyor. `SubeDetay.jsx`'e turuncu "🏭 Merkez Depo" rozeti ve TENANT_ADMIN'e özel işaretleme butonu eklendi (onay penceresiyle, çünkü bu tüm dağıtımların kaynağını değiştiren ciddi bir işlem).
9. `MerkezDepo.jsx`'te `Promise.all` → `Promise.allSettled` geçişi de yapıldı (bir endpoint hata verirse tüm sayfanın boş kalmasını önlemek için).

### Faz 17 — Paket Sistemi: "Salt Okunur" Modeline Geçiş (Trial Cliff Düzeltmesi) ✅
**Sorun:** 30 günlük ücretsiz denemede tüm modüller açıktı, ama deneme bitip Başlangıç planında kalınca (yükseltme yapılmazsa) sayfa tamamen bir "yetkisiz/kilitli" ekranına dönüşüyordu — kullanıcının deneme sırasında girdiği veriler (personel, cari kart, transfer geçmişi vb.) görünmez oluyordu. Bu "trial cliff" hissi yaratıyordu.

**Yeni model (B):** Deneme sırasında hâlâ her şey açık (dönüşüm için değerli). Deneme bitip plan yetersiz kalınca sayfa **kapanmıyor** — veri **her zaman görünür** kalıyor, sadece **yeni ekleme/düzenleme/silme (yazma) butonları** gizleniyor ve üstte sarı bir "Salt Okunur Mod" uyarı şeridi çıkıyor.

**Backend (`paketKontrol.middleware.js`):**
- `GET` istekleri artık HER ZAMAN serbest (`if (req.method === 'GET') return next();`) — kısıtlama sadece POST/PUT/PATCH/DELETE'te devreye giriyor
- Deneme kontrolü middleware'e taşındı (`denemedeMi(tenant)` — `createdAt + 30 gün`); öncesinde bu middleware'de hiç deneme kontrolü yoktu, sadece `sube.controller.js`'in kendi `olustur` fonksiyonunda vardı
- 403 yanıtına `saltOkunur: true` bayrağı eklendi
- `gerekliPlaniBul(ozellik)` ile "gerekli plan" mesajı artık sabit `'PROFESYONEL'` yerine dinamik bulunuyor

**Frontend (`PlanKilidi.jsx` → context/hook sistemine dönüştürüldü):**
- `PaketProvider` (context sağlayıcı) + `usePaketDurumu()` (hook, `{ tamErisim, ozellik, plan, denemede }` döner) + `SaltOkunurUyari` (uyarı şeridi component'i) eklendi
- Eski `PlanKilidi` (tam sayfa kilit ekranı) hâlâ export ediliyor ama artık normal akışta kullanılmıyor
- `App.jsx`'teki `PrivateRoute`: `planOzellik` verilen route'larda artık sayfayı `<PlanKilidi>` ile DEĞİŞTİRMİYOR, `<PaketProvider>` ile SARMALIYOR — sayfa her zaman render ediliyor

**Salt okunur moduna geçirilen sayfalar** (hepsi `usePaketDurumu()` kullanıyor, yazma butonlarını `{tamErisim && <button>...}` ile gizliyor):
- `MerkezDepo.jsx`, `PlanliTransfer.jsx`, `Transfer.jsx` — üçü de kendi eski ayrı "yetkisiz" tam-blok mantığına (kendi `/api/auth/beni-getir` çağrısıyla) sahipti, kaldırılıp context'e bağlandı
- `Personel.jsx` — Yeni Personel, ✏️/🗑️, Maaş/Avans/Devam/Düzeltme ekleme, Geri Yükle gizleniyor
- `CariKartlar.jsx` — Yeni Cari Kart, Düzenle/Sil gizleniyor
- `CariHesap.jsx` — Ödeme Ekle gizleniyor

**Backend route'larına eklenen `paketKontrol` (önceden hiç yoktu, sadece frontend gizlemesi vardı — gerçek güvenlik boşluğuydu):**
- `personel.routes.js` → tüm yazma uçlarına `paketKontrol('personel')`
- `cariKart.routes.js` → POST/PUT/DELETE'e `paketKontrol('cari')`
- `cariHareket.routes.js` → `/odeme` ve `/manuel`'e `paketKontrol('cari')`
- `transfer.route.js`, `merkezDepo.route.js`, `planliTransfer.route.js` → zaten doğru kurulmuştu, değişiklik gerekmedi

**Test kontrol listesi** (`test-checklist.html`) buna göre güncellendi: "BASLANGIC paketinde erişim engelleniyor mu" maddeleri "sayfa açık kalıyor, yazma butonları gizleniyor mu" olarak değiştirildi; Personel/Cari için hiç var olmayan paket testleri eklendi; backend 403 güvenlik testi ve "trial cliff" (veri kaybolmuyor mu) testi eklendi.

---

## BACKEND API ENDPOINTLERİ (tam liste)

### Auth
```
POST /api/auth/kayit
POST /api/auth/giris
GET  /api/auth/beni-getir
POST /api/auth/kayit-firma
POST /api/auth/tenant-listesi
GET  /api/auth/lisans-durum
```

### İletişim (Faz 15 — public, authMiddleware YOK)
```
POST /api/iletisim
```

### Kullanıcılar
```
GET    /api/kullanicilar (TENANT_ADMIN)
POST   /api/kullanicilar (TENANT_ADMIN — SUPER_ADMIN rolü atanamaz)
PUT    /api/kullanicilar/profil (herkes, kendi profili)
PUT    /api/kullanicilar/sifre-degistir (herkes, kendi şifresi)
PUT    /api/kullanicilar/:id (TENANT_ADMIN)
DELETE /api/kullanicilar/:id (TENANT_ADMIN)
```

### Şubeler (merkez işaretleme Faz 16'da eklendi)
```
GET    /api/subeler
GET    /api/subeler/:id
GET    /api/subeler/:id/detay
POST   /api/subeler
PUT    /api/subeler/:id
PATCH  /api/subeler/:id/merkez-yap    (TENANT_ADMIN — diğer şubelerin merkezMi'sini otomatik false yapar)
PATCH  /api/subeler/:id/merkez-kaldir (TENANT_ADMIN)
```

### Merkez Depo (Faz 14'te eklendi, Faz 16'da düzeltildi/genişletildi — hepsi paketKontrol('merkezDepo'), GET her zaman serbest)
```
GET    /api/merkezdepo/durum
GET    /api/merkezdepo/tanimlar
POST   /api/merkezdepo/tanim
POST   /api/merkezdepo/tanim/tumu      🆕 Faz 16 — toplu tanım ekleme
DELETE /api/merkezdepo/tanim/:id
POST   /api/merkezdepo/dagit
POST   /api/merkezdepo/dagit/toplu     🆕 Faz 16 — checklist ile toplu dağıtım
GET    /api/merkezdepo/gecmis
```

### Planlı Transfer (paketKontrol('planliTransfer'), GET her zaman serbest)
```
GET    /api/planli-transfer
POST   /api/planli-transfer
PUT    /api/planli-transfer/:id
DELETE /api/planli-transfer/:id
PATCH  /api/planli-transfer/:id/aktif
POST   /api/planli-transfer/:id/calistir
```

### Şube Transferi (paketKontrol('subeTransferi'), GET her zaman serbest)
```
GET  /api/transfer/stoklar
POST /api/transfer
GET  /api/transfer/gecmis
```

### Personel (yazma uçları Faz 17'de paketKontrol('personel') aldı)
```
GET    /api/personel
GET    /api/personel/pasif
GET    /api/personel/:id
POST   /api/personel
PUT    /api/personel/:id
DELETE /api/personel/:id
PUT    /api/personel/:id/geri-yukle
POST   /api/personel/maas
PUT    /api/personel/maas/:id
PUT    /api/personel/maas/:id/odendi
POST   /api/personel/avans
POST   /api/personel/devam
POST   /api/personel/devam-toplu
GET    /api/personel/:id/izin-durumu
POST   /api/personel/izin-kullanim
```

### Cari Kartlar (yazma uçları Faz 17'de paketKontrol('cari') aldı)
```
GET    /api/cari-kartlar
GET    /api/cari-kartlar/:id
GET    /api/cari-kartlar/:id/bakiye
POST   /api/cari-kartlar
PUT    /api/cari-kartlar/:id
DELETE /api/cari-kartlar/:id
```

### Cari Hareketler (yazma uçları Faz 17'de paketKontrol('cari') aldı)
```
GET  /api/cari-hareketler/bakiyeler
GET  /api/cari-hareketler/:cariKartId
GET  /api/cari-hareketler/:cariKartId/bakiye
POST /api/cari-hareketler/odeme
POST /api/cari-hareketler/manuel
```

### Diğer Ana Modüller
- `/api/kategoriler`, `/api/olcu-birimleri`, `/api/stok-kartlari` — CRUD
- `/api/stok` — giriş/iade/zayi/tüketim/sayım/durum
- `/api/receteler` — CRUD + maliyet
- `/api/satislar` — CRUD + günlük toplam
- `/api/raporlar` — satış/stok/cari/maliyet + Excel, + `sube-karsilastirmasi`, + `merkezmuhasebesi`
- `/api/super-admin` — istatistik/tenant/lisans yönetimi
- `/api/feedback` — mail gönderimi
- `/api/audit-log` (ADMIN+)
- `/api/odeme/*` — ödeme bildirimleri
- `/api/export` — veri export (Excel)
- `/api/dashboard/subeler` — şube özeti

---

## DOSYA YAPISI (Güncel — Faz 17 sonrası)

```
gastroiq/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── cariHareket.controller.js
│   │   │   ├── cariKart.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── export.controller.js
│   │   │   ├── feedback.controller.js
│   │   │   ├── iletisim.controller.js         🆕 Faz 15
│   │   │   ├── kategori.controller.js
│   │   │   ├── kullanici.controller.js
│   │   │   ├── merkezDepo.controller.js         (Faz 16'da genişletildi: tanimTumunuEkle, topluDagit)
│   │   │   ├── odeme.controller.js
│   │   │   ├── olcuBirimi.controller.js
│   │   │   ├── personel.controller.js
│   │   │   ├── planliTransfer.controller.js
│   │   │   ├── rapor.controller.js
│   │   │   ├── recete.controller.js
│   │   │   ├── satis.controller.js
│   │   │   ├── stok.controller.js
│   │   │   ├── stokKart.controller.js
│   │   │   ├── sube.controller.js               (Faz 16'da genişletildi: merkezYap, merkezKaldir)
│   │   │   ├── superAdmin.controller.js
│   │   │   └── transfer.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── paketKontrol.middleware.js       (Faz 17'de yeniden yazıldı: GET bypass + deneme kontrolü)
│   │   │   ├── rateLimit.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   └── requestLogger.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── auditLog.routes.js
│   │   │   ├── cariHareket.routes.js            (Faz 17: paketKontrol('cari') eklendi)
│   │   │   ├── cariKart.routes.js               (Faz 17: paketKontrol('cari') eklendi)
│   │   │   ├── dashboard.routes.js
│   │   │   ├── export.routes.js
│   │   │   ├── feedback.routes.js
│   │   │   ├── iletisim.routes.js               🆕 Faz 15 — authMiddleware YOK, public
│   │   │   ├── kategori.routes.js
│   │   │   ├── kullanici.routes.js
│   │   │   ├── merkezDepo.route.js              (Faz 16: /tanim/tumu, /dagit/toplu eklendi)
│   │   │   ├── odeme.route.js
│   │   │   ├── olcuBirimi.routes.js
│   │   │   ├── personel.routes.js               (Faz 17: paketKontrol('personel') tüm yazma uçlarına eklendi)
│   │   │   ├── planliTransfer.route.js
│   │   │   ├── rapor.routes.js
│   │   │   ├── recete.routes.js
│   │   │   ├── satis.routes.js
│   │   │   ├── stok.routes.js
│   │   │   ├── stokKart.routes.js
│   │   │   ├── sube.routes.js                   (Faz 16: /:id/merkez-yap, /:id/merkez-kaldir eklendi)
│   │   │   ├── superAdmin.routes.js
│   │   │   └── transfer.route.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── auditLog.service.js
│   │   │   ├── cariHareket.service.js
│   │   │   ├── cariKart.service.js
│   │   │   ├── demoSeed.service.js
│   │   │   ├── kategori.service.js
│   │   │   ├── lisansUyari.service.js
│   │   │   ├── mail.service.js                  (Faz 15: Resend'e geçti + iletisimFormuMailGonder eklendi)
│   │   │   ├── merkezDepo.service.js            (Faz 16'da kritik düzeltme: kendi bakiyeHesapla kaldırıldı, stok.service.js kullanılıyor; performans için Promise.all)
│   │   │   ├── olcuBirimi.service.js
│   │   │   ├── personel.service.js
│   │   │   ├── planliTransfer.service.js
│   │   │   ├── recete.service.js
│   │   │   ├── satis.service.js
│   │   │   ├── stok.service.js                  (bakiye hesaplama için TEK doğru kaynak — bakiyeHesapla export ediliyor)
│   │   │   ├── stokKart.service.js
│   │   │   └── stokUyari.service.js
│   │   └── index.js                             (Faz 15: iletisimRoutes mount edildi)
│   ├── prisma/
│   │   ├── schema.prisma                        (Faz 16: Sube.merkezMi eklendi)
│   │   └── seed.js
│   └── .env
├── frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── LisansBanner.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── SubeSecici.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── PlanKilidi.jsx                   (Faz 17'de context/hook sistemine dönüştürüldü: PaketProvider, usePaketDurumu, SaltOkunurUyari)
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Yetkisiz.jsx
│   │   │   ├── Yardim.jsx
│   │   │   ├── Profil.jsx
│   │   │   ├── Abonelik.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── KayitFirma.jsx
│   │   │   ├── SuperAdmin.jsx
│   │   │   ├── MerkezDepo.jsx                   (Faz 17: kendi ayrı "yetkisiz" ekranı kaldırıldı, context'e bağlandı)
│   │   │   ├── PlanliTransfer.jsx               (Faz 17: aynı dönüşüm)
│   │   │   ├── Transfer.jsx                     (Faz 17: aynı dönüşüm)
│   │   │   ├── satis/Satislar.jsx
│   │   │   ├── stok/StokDurumu.jsx
│   │   │   ├── personel/Personel.jsx            (Faz 17: salt okunur moduna geçirildi)
│   │   │   ├── cari/CariHesap.jsx               (Faz 17: salt okunur moduna geçirildi)
│   │   │   ├── raporlar/Raporlar.jsx
│   │   │   └── tanimlamalar/
│   │   │       ├── Kullanicilar.jsx
│   │   │       ├── CariKartlar.jsx              (Faz 17: salt okunur moduna geçirildi)
│   │   │       ├── Subeler.jsx
│   │   │       └── SubeDetay.jsx                (Faz 16: merkez depo rozeti + işaretleme butonu eklendi)
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.service.js
│   │   ├── store/
│   │   │   ├── auth.store.js
│   │   │   └── subeStore.js
│   │   └── App.jsx                              (Faz 17: PrivateRoute artık PaketProvider ile sarmalıyor, sayfayı değiştirmiyor)
│   └── .env
├── landing/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                             (Faz 15: server component'e dönüştü, SEO metadata burada)
│   │   ├── home-client.tsx                      🆕 Faz 15 — asıl JSX içeriği ('use client')
│   │   ├── globals.css
│   │   ├── rehber/page.tsx
│   │   ├── gizlilik/page.tsx
│   │   ├── kullanim-kosullari/page.tsx
│   │   └── mesafeli-satis/page.tsx
│   ├── components/
│   │   └── ContactForm.tsx                      🆕 Faz 15
│   ├── public/
│   │   └── logo.png
│   ├── next.config.ts
│   └── package.json
├── test-checklist.html                          (Faz 17'de salt-okunur modeline göre güncellendi)
└── CONTEXT.md (bu dosya)
```

---

## CRON JOB LİSTESİ (Güncel)
| Job | Zamanlama | Açıklama |
|---|---|---|
| Lisans Uyarı | Her gün 09:00 | 7 gün ve 3 gün kala uyarı maili |
| Merkez Depo Dağıtım | Pazartesi & Cuma 06:00 | Otomatik stok dağıtımı |
| Planlı Transfer | Her dakika | Zamanlanmış transferleri kontrol eder |
| Günlük Stok Raporu | Her gün 08:00 | Tüm tenant'lara günlük rapor maili |
| Kritik Stok Uyarı | Her gün 10:00 & 16:00 | Kritik stok varsa uyarı maili |
| Self-Ping | Her 14 dakikada bir | Render uyku modunu engeller |

## LİSANS SİSTEMİ
- Kayıt → otomatik 30 gün ücretsiz deneme (deneme sırasında TÜM modüller, plan ne olursa olsun, açık)
- 7 gün kala → uyarı maili
- 3 gün kala → uyarı maili
- Uygulama içi banner (14 gün kala sarı, 3 gün kala kırmızı)
- **Deneme bitince (Faz 17):** Plan yetersizse sayfa kapanmıyor — "salt okunur" moduna geçiyor, veri görünür kalıyor, yazma engelleniyor
- Ödeme: havale/EFT → IBAN → super admin manuel uzatma veya ödeme bildirimi onayı
- Planlar: Aylık ₺799 / Yıllık ₺7.990 (Profesyonel), Kurumsal "Teklif Al"
- Paketler: BAŞLANGIÇ (1 şube, temel modüller), PROFESYONEL (sınırsız şube + transfer/merkez depo/planlı transfer/cari/personel), KURUMSAL (hepsi + özel)

## GITHUB
- Repo: https://github.com/Y994-SYS/gastrobrain
- Branch: main

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

## BİLİNEN RİSKLER / TAKİP EDİLECEKLER
- İleride birden fazla SUPER_ADMIN eklenirse, email üzerinde `tenantId IS NULL` koşullu partial unique index eklenmesi düşünülebilir
- Render free tier disk kalıcı değil — veritabanı zaten Supabase'e taşındı, sorun çözüldü
- İlk 5 beta müşteri — devam ediyor
- Geçmiş satışlarda porsiyon hesabı hatası düzeltildi ancak geçmiş veriler kontrol edilmeli
- Çift stok düşme riski (satış + mutfak tüketimi) operasyonel kural ile yönetiliyor
- Transfer işlemleri audit log'a yazılmıyor (henüz eklenmedi)
- **`mail.service.js`'deki `iletisimFormuMailGonder` ve global XSS-escape middleware (`index.js`) çift escape yapıyor** — güvenlik riski yok (fazladan escape zararsız) ama kozmetik bir sorun: mailde bir kesme işareti `&#x27;` yerine `&amp;#x27;` gibi görünebilir. Düzeltilmedi, öncelikli değil.
- `landing/components/ContactForm.tsx`'teki `WHATSAPP_NUMARA` sabiti placeholder olabilir — gerçek numarayla teyit edilmeli
- Merkez Depo modülünde her tenant için bir merkez şube **manuel olarak** (Şube Detay sayfasından) işaretlenmesi gerekiyor — otomatik/varsayılan atama yok, yeni tenant'lar bunu unutabilir; Merkez Depo sayfası açıldığında bu durumda anlamlı bir hata gösteriyor ama proaktif bir hatırlatma (örn. onboarding checklist) yok
- Deneme bitip "salt okunur" moduna geçen tenant'lar için, bu durumu açıkça anlatan bir mail/bildirim henüz yok (yalnızca lisans bitiş uyarı maili var, "artık salt okunursunuz" mesajı ayrı değil)

---

**Dosya Güncelleme Tarihi:** Ağustos 2026 (Faz 17 sonrası)
**Durum:** Faz 1-17 tamamlanmıştır. Proje üretimde canlıdır.