import { useState } from 'react';

const bolumler = [
    {
        id: 'baslangic',
        icon: '🚀',
        baslik: 'Başlangıç',
        konular: [
            {
                baslik: 'Sisteme ilk giriş',
                icerik: `Sisteme giriş yapmak için email adresinizi girin. Birden fazla firmaya kayıtlıysanız hangi firmaya girmek istediğinizi seçin, ardından şifrenizi girin.

İlk girişte demo verisi hazır gelir — kategoriler, stok kartları, reçeteler ve satışlar otomatik oluşturulmuştur. Bunları inceleyerek sistemi tanıyabilirsiniz.`
            },
            {
                baslik: 'Tanımlamaları nasıl yapmalıyım?',
                icerik: `Sistemi kullanmaya başlamadan önce şu sırayla tanımlamalarınızı yapın:

1. Kategoriler — stok kartlarınızı gruplamak için (Et & Tavuk, Sebze, vb.)
2. Ölçü Birimleri — kg, lt, adet gibi birimler
3. Stok Kartları — her malzemenin kartı
4. Cari Kartlar — tedarikçileriniz
5. Reçeteler — menü ürünleriniz ve malzemeleri`
            },
        ]
    },
    {
        id: 'yetkilendirme',
        icon: '🔐',
        baslik: 'Roller ve Yetkiler',
        konular: [
            {
                baslik: 'Sistemde hangi roller var?',
                icerik: `GastroBrain'de 6 farklı kullanıcı rolü bulunur. Her rolün erişebileceği modüller farklıdır — bu sayede her çalışan sadece kendi işiyle ilgili ekranları görür, hassas veya alakasız bölümlere erişemez.

ADMIN (Firma Sahibi)
Firmanızın tüm verilerine ve modüllerine erişir. Kullanıcı ekler/çıkarır, şube açar, tüm raporları görür. Sisteme ilk kayıt olan kişi otomatik olarak bu rolü alır.

MÜDÜR (Şube Müdürü)
Stok, satış, reçete, cari hesap, rapor ve personel modüllerine erişir. Kullanıcı yönetimi ve şube ayarları gibi hassas alanlara giremez.

DEPO
Sadece stok modülüne erişir: giriş/iade faturası, zayi, tüketim, ay sonu sayım, stok kartı/kategori/ölçü birimi tanımları. Satış veya cari hesaba dokunamaz.

KASA
Sadece satış ekranına erişir: günlük satış girişi. Stok veya cari hesaba erişemez.

PERSONEL
En kısıtlı rol. Sadece kendi devam/mesai/avans bilgisini görür, başka hiçbir modüle erişemez.

SÜPER ADMIN
GastroBrain'i işleten ekip için ayrılmış özel bir rol — hiçbir restoran firmasına bağlı değildir, kendi paneli üzerinden tüm firma hesaplarını yönetir. Normal kullanıcı işlemleriyle ilgisi yoktur.`
            },
            {
                baslik: 'Hangi rol hangi sayfaları görür?',
                icerik: `ADMIN — Dashboard, Stok (tümü), Satış, Reçeteler, Cari Hesap, Raporlar, Personel, Tanımlamalar (tümü), Şubeler, Kullanıcılar

MÜDÜR — Dashboard, Stok (tümü), Satış, Reçeteler, Cari Hesap, Raporlar, Personel, Tanımlamalar (Kategori/Ölçü Birimi/Stok Kartı/Cari Kart)

DEPO — Dashboard, Stok (tümü), Tanımlamalar (Kategori/Ölçü Birimi/Stok Kartı)

KASA — Dashboard, Satış

PERSONEL — Dashboard, Personel (sadece kendi kaydı)

Bir kullanıcı yetkisi olmayan bir sayfaya gitmeye çalışırsa "Erişim Yetkisi Yok" sayfası ile karşılaşır ve ana sayfaya yönlendirilir. Menüde de zaten sadece yetkisi olan bölümler görünür.`
            },
            {
                baslik: 'Bir çalışanın rolünü nasıl değiştiririm?',
                icerik: `Tanımlamalar → Kullanıcılar sayfasına gidin (sadece ADMIN bu sayfayı görebilir).

İlgili kullanıcının yanındaki "Düzenle" butonuna tıklayın, Rol alanından yeni rolü seçin ve kaydedin. Değişiklik, kullanıcının bir sonraki girişinde (veya token yenilendiğinde) geçerli olur.

Not: Kendi rolünüzü buradan değiştiremezsiniz; firma sahipliği transferi gerekiyorsa bizimle iletişime geçin.`
            },
        ]
    },
    {
        id: 'stok',
        icon: '📦',
        baslik: 'Stok Yönetimi',
        konular: [
            {
                baslik: 'Giriş faturası nasıl eklenir?',
                icerik: `Stok → Giriş Faturası sayfasına gidin.

1. Stok kartını seçin
2. Miktarı girin
3. Birim fiyatı girin (bu fiyat maliyet hesaplamalarında kullanılır)
4. Tedarikçi seçin (cari hesabına otomatik borç düşer)
5. Kaydet

Birden fazla kalem için her kalemi ayrı ayrı ekleyin.`
            },
            {
                baslik: 'Zayi ve tüketim arasındaki fark nedir?',
                icerik: `Zayi: Bozulan, son kullanma tarihi geçen veya dökülen ürünler. Fire kaydı olarak düşünün.

Tüketim: Satışa girmeden kullanılan ürünler. Örneğin personel kahvesi, temizlik için kullanılan ürünler.

Her ikisi de stoktan düşer ancak raporlarda ayrı kategorilerde görünür.`
            },
            {
                baslik: 'Ay sonu sayım ne işe yarar?',
                icerik: `Ay sonu fiziksel sayım yaptığınızda sistemdeki stok ile gerçek stok arasında fark olabilir. 

Ay Sonu Sayım sayfasına gidin, her stok kalemi için gerçek miktarı girin. Sistem otomatik olarak farkı hesaplayıp stoku düzeltir.

Bu işlemi her ay sonunda yapmanızı öneririz.`
            },
        ]
    },
    {
        id: 'recete',
        icon: '🍽️',
        baslik: 'Reçete & Maliyet',
        konular: [
            {
                baslik: 'Reçete nasıl oluşturulur?',
                icerik: `Reçeteler sayfasına gidin ve "Yeni Reçete" butonuna tıklayın.

1. Reçete adını girin (menüdeki ismi)
2. Satış fiyatını girin
3. Malzemeleri ekleyin — her malzeme için stok kartı ve miktarı seçin
4. Kaydet

Sistem otomatik olarak son giriş fiyatlarına göre maliyeti hesaplar ve kar marjını gösterir.`
            },
            {
                baslik: 'Maliyet hesabı nasıl çalışır?',
                icerik: `Sistem her reçete kalemi için en son giriş faturasındaki birim fiyatı kullanır.

Örnek: Köfte Porsiyon reçetenizde 200 gram dana kıyma var. Son faturada dana kıyma 380₺/kg ise maliyet = 0.200 × 380 = 76₺ olur.

Tüm kalemler toplanır → toplam maliyet çıkar → satış fiyatı ile karşılaştırılır → kar marjı hesaplanır.`
            },
        ]
    },
    {
        id: 'satis',
        icon: '💰',
        baslik: 'Satış Takibi',
        konular: [
            {
                baslik: 'Satış nasıl kaydedilir?',
                icerik: `Satışlar sayfasına gidin ve "Yeni Satış" butonuna tıklayın.

1. Reçete seçin
2. Adet girin
3. Satış fiyatı otomatik gelir (değiştirebilirsiniz)
4. Tarih seçin (bugün için boş bırakın)
5. Kaydet

Satış kaydedildiğinde reçetedeki malzemeler otomatik olarak stoktan düşer.`
            },
            {
                baslik: 'Satışı silersem stok geri gelir mi?',
                icerik: `Evet. Satış silindiğinde o satışa ait stok hareketleri de silinir ve stok miktarları geri eski haline gelir.`
            },
        ]
    },
    {
        id: 'cari',
        icon: '🏦',
        baslik: 'Cari Hesap',
        konular: [
            {
                baslik: 'Cari hesap nasıl çalışır?',
                icerik: `Her tedarikçi için bir cari kart oluşturun. 

Giriş faturası eklendiğinde tedarikçinin hesabına otomatik borç düşer.
Ödeme yaptığınızda "Ödeme Ekle" ile kaydedersiniz.

Bakiye pozitifse tedarikçiye borcunuz var demektir.`
            },
            {
                baslik: 'Manuel hareket ne zaman kullanılır?',
                icerik: `İskonto, ceza veya düzeltme gibi özel durumlarda manuel hareket ekleyebilirsiniz.

Cari Hesap sayfasında tedarikçiyi seçin → Manuel Hareket butonuna tıklayın → Tip seçin (Borç/Alacak/Ödeme/Tahsilat).`
            },
        ]
    },
    {
        id: 'raporlar',
        icon: '📊',
        baslik: 'Raporlar',
        konular: [
            {
                baslik: 'Hangi raporlar var?',
                icerik: `Raporlar sayfasında 4 farklı rapor bulunur:

- Satış Raporu — tarih aralığı ve reçete bazlı satış analizi
- Stok Raporu — mevcut stok durumu, kritik stoklar, stok değeri
- Cari Raporu — tedarikçi bakiyeleri ve hareket geçmişi  
- Maliyet Raporu — reçete bazlı kar marjı analizi`
            },
            {
                baslik: 'Excel export nasıl yapılır?',
                icerik: `Her rapor sayfasında "Excel İndir" butonu bulunur. Tıkladığınızda rapor anında .xlsx formatında indirilir.

Tarih filtresi uyguladıysanız sadece o aralıktaki veriler Excel'e aktarılır.`
            },
        ]
    },
    {
        id: 'personel',
        icon: '👥',
        baslik: 'Personel',
        konular: [
            {
                baslik: 'Personel nasıl eklenir?',
                icerik: `Personel sayfasına gidin → "Yeni Personel" butonuna tıklayın.

Ad, soyad, telefon, başlangıç tarihi ve maaş bilgilerini girin. Personel hangi şubede çalışıyorsa o şubeyi seçin.`
            },
            {
                baslik: 'Maaş ve avans takibi nasıl yapılır?',
                icerik: `Personel listesinden personelin adına tıklayın.

Maaş Ekle: Her ay için maaş kaydı oluşturun. Ödeme yapıldığında "Ödendi" olarak işaretleyin.

Avans Ekle: Personele avans verdiğinizde kaydedin. Tutar ve açıklama girin.

Devam Ekle: Günlük çalışma durumunu kaydedin (Çalıştı, İzin, Rapor, Devamsız).`
            },
        ]
    },
    {
        id: 'subeler',
        icon: '🏪',
        baslik: 'Çok Şubeli Yönetim',
        konular: [
            {
                baslik: 'Şube nasıl eklenir?',
                icerik: `Tanımlamalar → Şubeler sayfasına gidin → "Yeni Şube" butonuna tıklayın.

Şube adı, adres ve telefon bilgilerini girin. Şube oluşturulduktan sonra kullanıcıları bu şubeye atayabilirsiniz.

Not: Şube eklemek PROFESYONEL veya KURUMSAL plan gerektirir.`
            },
            {
                baslik: 'Şubeler arası stok transferi nasıl yapılır?',
                icerik: `Stok → Şube Transferi sayfasına gidin.

1. Kaynak şubeyi seçin (stok alınacak şube)
2. Hedef şubeyi seçin (stok gönderilecek şube)
3. "+ Ürün Ekle" ile birden fazla ürün ekleyebilirsiniz
4. Her ürün için miktar girin
5. "Transferi Gerçekleştir" butonuna tıklayın

Transfer tamamlandığında kaynak şubeden stok düşer, hedef şubeye eklenir. Tüm işlem tek seferde gerçekleşir.`
            },
            {
                baslik: 'Şube bazlı raporlar nasıl görüntülenir?',
                icerik: `Raporlar sayfasının üstünde şube seçici bulunur (birden fazla şubeniz varsa görünür).

"Tüm Şubeler" seçilirse tüm şubelerin verisi birleşik gösterilir.
Belirli bir şube seçilirse sadece o şubenin verisi gösterilir.

Şube Karşılaştırması raporu ile tüm şubelerin performansını yan yana görebilirsiniz: satış, kar marjı, zayi oranı ve personel sayısı karşılaştırılır.`
            },
            {
                baslik: 'Şube detay sayfası ne gösterir?',
                icerik: `Tanımlamalar → Şubeler sayfasında bir şubenin kartına tıklayarak şube detay sayfasına ulaşabilirsiniz.

Şube detay sayfasında 4 sekme bulunur:
- Stok Durumu: Şubedeki mevcut stok miktarları
- Son Satışlar: Şubeye ait son satış kayıtları  
- Personel: Şubede çalışan personel listesi
- Transferler: Şubeye gelen ve giden stok transferleri`
            },
        ]
    },
    {
        id: 'merkezdepo',
        icon: '🏭',
        baslik: 'Merkez Depo',
        konular: [
            {
                baslik: 'Merkez Depo nedir?',
                icerik: `Merkez Depo, ana deponuzdaki stokları şubelerinize otomatik olarak dağıtmanızı sağlar.

Örneğin: Merkez deponuzda 500 kg un var ve her şubenin en az 100 kg unu olmasını istiyorsunuz. Merkez Depo tanımı yaparak bu kuralı sisteme girebilirsiniz. Stok minimum seviyenin altına düştüğünde sistem sizi uyarır.

Not: Bu özellik PROFESYONEL ve KURUMSAL planlarda kullanılabilir.`
            },
            {
                baslik: 'Merkez Depo tanımı nasıl yapılır?',
                icerik: `Stok → Merkez Depo sayfasına gidin.

Tanımlar sekmesinde "Yeni Tanım" formunu doldurun:
1. Stok kartını seçin (hangi ürün için kural oluşturuyorsunuz)
2. Minimum stok seviyesini girin (her şubede en az kaç birim olmalı)
3. Otomatik Dağıtım seçeneğini açın/kapatın
4. "Tanım Ekle" butonuna tıklayın

Tanım eklendikten sonra sistem her şubenin bu ürün için stok seviyesini takip eder.`
            },
            {
                baslik: 'Manuel dağıtım nasıl yapılır?',
                icerik: `Merkez Depo → Manual Dağıtım sekmesine gidin.

1. Hangi ürünü dağıtacağınızı seçin (Merkez Depo tanımınızdan)
2. Hangi şubeye göndereceğinizi seçin
3. Miktarı girin
4. "Dağıtımı Gerçekleştir" butonuna tıklayın

Bu işlem kaynak şubeden stok düşer, hedef şubeye ekler. Dağıtım Geçmişi sekmesinden tüm dağıtım kayıtlarını görebilirsiniz.`
            },
        ]
    },
    {
        id: 'planli_transfer',
        icon: '⏰',
        baslik: 'Planlı Transferler',
        konular: [
            {
                baslik: 'Planlı Transfer nedir?',
                icerik: `Planlı Transfer, belirli günlerde ve saatlerde otomatik stok transferi yapmanızı sağlar.

Örneğin: Her Pazartesi sabah 06:00'da merkez depodan Şube1'e 100 kg un, 50 kg tavuk ve 20 kg peynir gönderilsin. Bunu bir kez ayarlarsınız, sistem her Pazartesi otomatik olarak çalıştırır.

Not: Bu özellik PROFESYONEL ve KURUMSAL planlarda kullanılabilir.`
            },
            {
                baslik: 'Yeni planlı transfer nasıl oluşturulur?',
                icerik: `Stok → Planlı Transfer sayfasına gidin → "+ Yeni Plan" butonuna tıklayın.

1. Plan adı girin (örn: "Pazartesi Merkez Dağıtımı")
2. Hangi günler çalışacağını seçin (Pazartesi, Cuma gibi)
3. Saat ve dakika seçin
4. Transfer Kalemleri bölümünde ürünleri ekleyin:
   - Her kalem için ürün, kaynak şube, hedef şube ve miktar seçin
   - "+ Kalem Ekle" ile birden fazla ürün ekleyebilirsiniz
5. "Planı Kaydet" butonuna tıklayın

Plan kaydedildikten sonra belirlediğiniz gün ve saatte otomatik olarak çalışır.`
            },
            {
                baslik: 'Planı manuel olarak çalıştırabilir miyim?',
                icerik: `Evet! Planlı Transfer listesinde her planın yanında "▶ Çalıştır" butonu bulunur.

Bu butona tıkladığınızda plan hemen çalışır — belirlenen gün ve saati beklemek zorunda değilsiniz. Test etmek veya acil dağıtım yapmak için kullanabilirsiniz.

Transfer sırasında kaynak şubede yeterli stok yoksa sistem hata verir ve transfer gerçekleşmez.`
            },
            {
                baslik: 'Planı durdurmak/aktif etmek için ne yapmalıyım?',
                icerik: `Planlı Transfer listesinde her planın yanında "⏸ Durdur" ve "▶ Aktif Et" butonları bulunur.

Durdur: Plan geçici olarak devre dışı kalır, belirlenen zamanda çalışmaz.
Aktif Et: Plan tekrar devreye girer.

Planı tamamen silmek için 🗑 Sil butonunu kullanın.`
            },
        ]
    },
    {
        id: 'abonelik',
        icon: '💳',
        baslik: 'Abonelik & Planlar',
        konular: [
            {
                baslik: 'Planlar arasındaki fark nedir?',
                icerik: `GastroBrain'de 3 plan bulunur:

BAŞLANGIÇ (₺799/ay)
Tek şube, temel stok yönetimi, satış takibi, reçete & maliyet, temel raporlar.

PROFESYONEL (₺1.499/ay)
Sınırsız şube, şube transferi, merkez depo, planlı transfer, şube karşılaştırma raporu, cari hesap, personel & maaş, gelişmiş raporlar.

KURUMSAL
Özel entegrasyonlar, yerinde eğitim, SLA garantisi, özel hesap yöneticisi. Fiyat teklif alınarak belirlenir.

Yıllık ödeme yaparsanız %17 indirim uygulanır.`
            },
            {
                baslik: 'Ödeme nasıl yapılır?',
                icerik: `GastroBrain şu an havale/EFT ile ödeme kabul etmektedir.

1. Abonelik sayfasına gidin
2. İstediğiniz planı seçin (Aylık veya Yıllık)
3. IBAN ve açıklama bilgilerini kopyalayın
4. Bankanız üzerinden havale/EFT yapın (açıklamayı mutlaka yazın)
5. "Ödeme Yaptım, Bildir" butonuna tıklayın
6. En geç 24 saat içinde hesabınız güncellenir`
            },
            {
                baslik: '30 günlük ücretsiz deneme nasıl çalışır?',
                icerik: `Sisteme kayıt olduğunuzda 30 gün boyunca tüm özellikler ücretsiz açık gelir — PROFESYONEL plan dahil tüm özellikler kullanılabilir.

Deneme süresi bitmeden önce e-posta ile uyarı gönderilir (7 gün ve 3 gün kala).

Deneme bitiminde BAŞLANGIÇ planına geçilir. Yükseltmek için ödeme yapabilirsiniz.`
            },
        ]
    }
];

export default function Yardim() {
    const [aktifBolum, setAktifBolum] = useState('baslangic');
    const [aktifKonu, setAktifKonu] = useState(null);

    const seciliBolum = bolumler.find(b => b.id === aktifBolum);

    return (
        <div>
            <h1 className="text-2xl font-black text-white mb-6">Yardım Merkezi</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Sol — Bölüm Listesi */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                        {bolumler.map(b => (
                            <button
                                key={b.id}
                                onClick={() => { setAktifBolum(b.id); setAktifKonu(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-zinc-800 last:border-0 ${aktifBolum === b.id
                                    ? 'bg-lime-400/10 text-lime-400 font-semibold'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <span>{b.icon}</span>
                                <span>{b.baslik}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sağ — Konu İçeriği */}
                <div className="lg:col-span-3">
                    {!aktifKonu ? (
                        <div className="space-y-3">
                            <p className="text-zinc-500 text-sm mb-4">
                                {seciliBolum?.icon} <span className="text-white font-semibold">{seciliBolum?.baslik}</span> — bir konu seçin
                            </p>
                            {seciliBolum?.konular.map((k, i) => (
                                <button
                                    key={i}
                                    onClick={() => setAktifKonu(k)}
                                    className="w-full bg-zinc-900 border border-zinc-800 hover:border-lime-400 rounded-xl p-4 text-left transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-semibold text-sm group-hover:text-lime-400 transition-colors">
                                            {k.baslik}
                                        </span>
                                        <span className="text-zinc-600 group-hover:text-lime-400 transition-colors">›</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <button
                                onClick={() => setAktifKonu(null)}
                                className="text-zinc-500 hover:text-lime-400 text-sm mb-4 flex items-center gap-1 transition-colors"
                            >
                                ‹ Geri
                            </button>
                            <h2 className="text-white font-black text-lg mb-4">{aktifKonu.baslik}</h2>
                            <div className="space-y-3">
                                {aktifKonu.icerik.split('\n\n').map((paragraf, i) => (
                                    <p key={i} className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                                        {paragraf}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}