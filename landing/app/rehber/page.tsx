'use client'

import { useState } from 'react'

const SECTIONS = [
    {
        id: 'stok',
        icon: '📦',
        title: 'Stok Yönetimi',
        desc: 'Malzeme girişinden zayi kaydına tüm stok hareketleri',
        steps: [
            { title: 'Stok kartı oluşturma', content: 'Sisteme yeni bir malzeme eklemek için Tanımlamalar → Stok Kartları yolunu izleyin. Sağ üstteki "Yeni Stok Kartı" butonuna tıklayın. Malzeme adı, kategori ve ölçü birimi alanlarını doldurun. Kaydet butonuna basın — malzeme artık tüm stok işlemlerinde kullanılabilir.' },
            { title: 'Giriş faturası işleme', content: 'Tedarikçiden malzeme geldiğinde Stok → Giriş Faturası sayfasına gidin. Tedarikçiyi (cari kart) seçin, fatura tarihini girin. "Kalem Ekle" ile her malzemeyi, miktarını ve birim fiyatını tek tek ekleyin. Faturayı kaydettiğinizde stok otomatik olarak güncellenir ve tedarikçi borcuna eklenir.' },
            { title: 'Zayi kaydı', content: 'Bozulan veya kullanılamaz hale gelen malzemeleri Stok → Zayi Gideri sayfasından kaydedin. İlgili malzemeyi seçin, miktarı ve nedeni girin. Kayıt sonrası stok miktarı düşer ve zayi raporu oluşur.' },
            { title: 'Tüketim kaydı', content: 'Reçete dışında kullanılan malzemeleri (temizlik malzemesi, yakıt vb.) Stok → Tüketim Gideri sayfasından kaydedin. Malzeme, miktar ve açıklama girerek kaydedin.' },
            { title: 'Ay sonu sayım', content: 'Her ay sonunda Stok → Ay Sonu Sayım sayfasına gidin. Sistemdeki tüm malzemeler listelenir. Fiili sayım miktarlarını "Sayım Miktarı" sütununa girin. Kaydettiğinizde sistem fark analizi yapar ve stoku günceller.' },
        ]
    },
    {
        id: 'recete',
        icon: '🍽️',
        title: 'Reçete & Maliyet',
        desc: 'Yemek maliyetlerini hesaplayın, kar marjınızı görün',
        steps: [
            { title: 'Reçete oluşturma', content: 'Reçeteler sayfasına gidin ve "Yeni Reçete" butonuna tıklayın. Yemeğin adını ve kaç porsiyon için olduğunu girin. "Malzeme Ekle" ile her ingredienti ve miktarını seçin. Sistem her malzemenin güncel stok birim fiyatını otomatik alır.' },
            { title: 'Maliyet analizi', content: 'Reçete kaydedildiğinde sistem otomatik olarak toplam hammadde maliyetini hesaplar. Reçete detayında "Maliyet" sütununda porsiyon başı maliyet görünür. Satış fiyatınızı girerek brüt kar marjınızı anında hesaplayabilirsiniz.' },
            { title: 'Stokla entegre tüketim', content: 'Satış kaydı yapıldığında ilgili reçetenin malzemeleri otomatik olarak stoktan düşmez — tüketim kaydı manuel yapılır. Böylece mutfak fiili tüketimi ile satış rakamlarını karşılaştırabilirsiniz.' },
        ]
    },
    {
        id: 'satis',
        icon: '💰',
        title: 'Satış Takibi',
        desc: 'Günlük satışları kaydedin ve analiz edin',
        steps: [
            { title: 'Satış girişi', content: 'Satışlar sayfasına gidin. "Yeni Satış" butonuna tıklayın. Tarih, ürün/kategori, miktar ve tutarı girin. Birden fazla kalem için "Kalem Ekle" ile satırlar ekleyebilirsiniz. Kaydettiğinizde günlük toplama yansır.' },
            { title: 'Günlük rapor görüntüleme', content: 'Satışlar sayfasının üst kısmında tarih filtresi bulunur. İstediğiniz günü seçtiğinizde o güne ait tüm satışlar ve toplam ciro görünür. Dashboard\'da da bugünün satışı anlık takip edilebilir.' },
            { title: 'Satış silme', content: 'Hatalı girilen satışlar için ilgili satışın yanındaki silme ikonuna tıklayın. Silme işlemi günlük toplamdan otomatik düşer. Silinen kayıtlar geri getirilemez, dikkatli olun.' },
        ]
    },
    {
        id: 'personel',
        icon: '👥',
        title: 'Personel Yönetimi',
        desc: 'Maaş, avans ve devam kayıtları',
        steps: [
            { title: 'Personel ekleme', content: 'Personel sayfasına gidin, "Yeni Personel" butonuna tıklayın. Ad, soyad, pozisyon ve maaş bilgilerini doldurun. Başlangıç tarihi ve iletişim bilgilerini ekleyin. Kaydedin — personel artık devam ve maaş takibinde görünecek.' },
            { title: 'Maaş kaydı', content: 'Personel listesinde ilgili kişinin yanındaki "Maaş" butonuna tıklayın. Ödeme dönemini, tutarı ve ödeme tarihini girin. Kaydettiğinizde personelin maaş geçmişine eklenir.' },
            { title: 'Avans kaydı', content: 'Personel sayfasında "Avans" butonuna tıklayın. Avans miktarı ve tarihini girin. Avanslar maaş geçmişinde ayrıca görünür, maaştan otomatik düşmez — manuel takip sizin sorumluluğunuzdadır.' },
            { title: 'Devam takibi', content: 'Personel → Devam sekmesinden günlük giriş/çıkış veya devamsızlık kaydı tutabilirsiniz. Ay sonunda devam raporunu alarak maaş hesabında kullanabilirsiniz.' },
        ]
    },
    {
        id: 'cari',
        icon: '🏦',
        title: 'Cari Hesap',
        desc: 'Tedarikçi ve müşteri borç/alacak takibi',
        steps: [
            { title: 'Cari kart oluşturma', content: 'Tanımlamalar → Cari Kartlar sayfasına gidin. "Yeni Cari Kart" butonuna tıklayın. Firma/kişi adı, türü (tedarikçi/müşteri) ve iletişim bilgilerini doldurun. Kaydedin — artık fatura ve ödeme işlemlerinde bu cariyi seçebilirsiniz.' },
            { title: 'Bakiye görüntüleme', content: 'Cari Hesap sayfasında tüm carilerin anlık bakiyesi listelenir. Borçlu cariler kırmızı, alacaklılar yeşil gösterilir. İlgili cariye tıklayarak hareket detaylarına ulaşabilirsiniz.' },
            { title: 'Ödeme kaydı', content: 'Cari Hesap sayfasında ilgili caride "Ödeme Ekle" butonuna tıklayın. Ödeme tarihini, tutarını ve açıklamasını girin. Kaydettiğinizde bakiye otomatik güncellenir.' },
        ]
    },
    {
        id: 'raporlar',
        icon: '📊',
        title: 'Raporlama',
        desc: 'Satış, stok, cari ve maliyet raporları',
        steps: [
            { title: 'Satış raporu', content: 'Raporlar sayfasında "Satış Raporu" sekmesine gidin. Tarih aralığı seçin. Günlük, haftalık veya aylık dağılımı görün. "Excel\'e Aktar" butonuyla raporu indirin.' },
            { title: 'Stok raporu', content: 'Stok Raporu sekmesinde tüm malzemelerin mevcut durumu, toplam değeri ve kritik stok uyarıları listelenir. Kategori filtresiyle sadece belirli ürün gruplarını görüntüleyebilirsiniz.' },
            { title: 'Maliyet raporu', content: 'Maliyet Raporu sekmesinde reçete bazında maliyet analizi yapabilirsiniz. Hangi ürünün ne kadar kar getirdiğini, hammadde maliyetlerinin satışlara oranını görün.' },
            { title: 'Excel export', content: 'Tüm raporlarda "Excel\'e Aktar" butonu bulunur. Tıkladığınızda ilgili rapor .xlsx formatında bilgisayarınıza indirilir. Muhasebeciye iletmek veya arşivlemek için kullanabilirsiniz.' },
        ]
    },
    {
        id: 'sube',
        icon: '🏢',
        title: 'Şube Yönetimi',
        desc: 'Birden fazla şubeyi tek hesaptan yönetin',
        steps: [
            { title: 'Şube ekleme', content: 'Tanımlamalar → Şubeler sayfasına gidin. "Yeni Şube" butonuna tıklayın. Şube adı, adresi ve sorumlu kişiyi girin. Kaydedin. Yeni şube artık kullanıcı atama ve raporlamada seçilebilir.' },
            { title: 'Şube bazlı veri girişi', content: 'Giriş yaptığınızda hangi şubede çalıştığınız JWT token\'ınıza işlenir. Yaptığınız tüm stok, satış ve personel girişleri otomatik olarak o şubeye aittir. Şube değiştirmek için çıkış yapıp farklı şubeyle giriş yapın.' },
            { title: 'Konsolide raporlama', content: 'TENANT_ADMIN rolüyle giriş yaptığınızda Raporlar sayfasında "Tüm Şubeler" seçeneği görünür. Tüm şubelerin verilerini tek raporda birleştirebilirsiniz.' },
        ]
    },
    {
        id: 'kullanicilar',
        icon: '🔐',
        title: 'Kullanıcı Rolleri',
        desc: 'Yetki yönetimi ve güvenli erişim kontrolü',
        steps: [
            { title: 'Kullanıcı ekleme', content: 'Tanımlamalar → Kullanıcılar sayfasına gidin (sadece TENANT_ADMIN görebilir). "Yeni Kullanıcı" butonuna tıklayın. Ad, e-posta ve şifre girin. Rol ve şube atamasını yapın. Kaydedin — kullanıcı artık sisteme giriş yapabilir.' },
            { title: 'Roller ve yetkiler', content: 'Sistemde 3 temel rol vardır: TENANT_ADMIN tüm ayarlara ve raporlara erişir. MUDUR stok, satış ve personel işlemlerini yapabilir. Standart kullanıcı sadece atandığı şubenin veri girişini yapabilir. Rolleri Kullanıcılar sayfasından düzenleyebilirsiniz.' },
            { title: 'Şifre sıfırlama', content: 'Kullanıcı şifresini unutursa TENANT_ADMIN olarak Kullanıcılar sayfasına gidin, ilgili kullanıcının "Düzenle" butonuna tıklayın ve yeni şifre belirleyin. Kullanıcıya yeni şifreyi bildirin.' },
        ]
    }
]

export default function Rehber() {
    const [activeSection, setActiveSection] = useState('stok')
    const [openStep, setOpenStep] = useState<number | null>(0)

    const current = SECTIONS.find(s => s.id === activeSection)!
    const currentIdx = SECTIONS.findIndex(s => s.id === activeSection)

    const gitSection = (id: string) => {
        setActiveSection(id)
        setOpenStep(0)
    }

    return (
        <>
            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0a; --surface: #111; --surface2: #1a1a1a;
          --border: rgba(255,255,255,0.08);
          --text: #f0f0f0; --muted: #888;
          --lime: #a3e635; --lime-glow: rgba(163,230,53,0.10);
        }
        body { background: var(--bg); color: var(--text); font-family: system-ui,-apple-system,sans-serif; -webkit-font-smoothing: antialiased; }

        .r-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 64px;
          background: rgba(10,10,10,0.92); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .r-nav-left { display: flex; align-items: center; gap: 20px; }
        .r-back { display: flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .r-back:hover { color: var(--lime); }
        .r-nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .r-nav-logo img { height: 30px; width: auto; }
        .r-nav-logo-text { font-size: 18px; font-weight: 800; color: var(--text); }
        .r-nav-logo-text span { color: var(--lime); }
        .r-nav-badge { font-size: 12px; padding: 4px 10px; background: var(--lime-glow); border: 1px solid rgba(163,230,53,0.2); color: var(--lime); border-radius: 99px; }

        .r-layout { display: grid; grid-template-columns: 256px 1fr; min-height: 100vh; padding-top: 64px; }

        .r-sidebar { border-right: 1px solid var(--border); padding: 28px 12px; position: sticky; top: 64px; height: calc(100vh - 64px); overflow-y: auto; }
        .r-sidebar-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); padding: 0 12px; margin-bottom: 10px; }
        .r-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; color: var(--muted); font-size: 14px; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
        .r-nav-item:hover { background: var(--surface2); color: var(--text); }
        .r-nav-item.active { background: var(--lime-glow); color: var(--lime); border: 1px solid rgba(163,230,53,0.15); }

        .r-main { padding: 44px 52px; max-width: 800px; }

        .r-progress { display: flex; align-items: center; gap: 6px; margin-bottom: 28px; }
        .r-progress-item { height: 3px; flex: 1; border-radius: 99px; background: var(--border); transition: background 0.3s; }
        .r-progress-item.done { background: var(--lime); }

        .r-section-header { margin-bottom: 32px; }
        .r-section-icon { font-size: 28px; margin-bottom: 14px; width: 52px; height: 52px; background: var(--lime-glow); border: 1px solid rgba(163,230,53,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .r-section-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
        .r-section-desc { font-size: 15px; color: var(--muted); }

        .r-steps { display: flex; flex-direction: column; gap: 10px; }
        .r-step { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
        .r-step.open { border-color: rgba(163,230,53,0.25); background: rgba(163,230,53,0.02); }
        .r-step-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; cursor: pointer; background: none; border: none; width: 100%; text-align: left; font-family: inherit; gap: 12px; }
        .r-step-left { display: flex; align-items: center; gap: 14px; }
        .r-step-num { font-size: 12px; font-weight: 700; color: var(--muted); min-width: 22px; transition: color 0.2s; }
        .r-step.open .r-step-num { color: var(--lime); }
        .r-step-title { font-size: 14px; font-weight: 500; color: var(--text); }
        .r-step-chevron { color: var(--muted); font-size: 16px; transition: transform 0.2s; flex-shrink: 0; }
        .r-step.open .r-step-chevron { transform: rotate(180deg); color: var(--lime); }
        .r-step-body { padding: 0 18px 18px 50px; display: none; }
        .r-step.open .r-step-body { display: block; }
        .r-step-content { font-size: 14px; color: var(--muted); line-height: 1.8; }

        .r-nav-arrows { display: flex; gap: 10px; margin-top: 44px; padding-top: 28px; border-top: 1px solid var(--border); }
        .r-arrow-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text); font-size: 14px; cursor: pointer; font-family: inherit; transition: all 0.2s; text-decoration: none; }
        .r-arrow-btn:hover { border-color: var(--lime); color: var(--lime); }
        .r-arrow-btn.primary { background: var(--lime); color: #0a0a0a; border-color: var(--lime); font-weight: 600; margin-left: auto; }
        .r-arrow-btn.primary:hover { opacity: 0.88; color: #0a0a0a; }

        @media (max-width: 768px) {
          .r-layout { grid-template-columns: 1fr; }
          .r-sidebar { display: none; }
          .r-main { padding: 28px 18px; }
        }
      `}</style>

            <nav className="r-nav">
                <div className="r-nav-left">
                    <a href="/" className="r-back">← Ana sayfa</a>
                    <a href="/" className="r-nav-logo">
                        <img src="/logo.png" alt="GastroBrain" />
                        <span className="r-nav-logo-text">Gastro<span>Brain</span></span>
                    </a>
                </div>
                <span className="r-nav-badge">Kullanım Kılavuzu</span>
            </nav>

            <div className="r-layout">
                <aside className="r-sidebar">
                    <div className="r-sidebar-title">Konular</div>
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            className={`r-nav-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => gitSection(s.id)}
                        >
                            <span style={{ fontSize: 16 }}>{s.icon}</span>
                            {s.title}
                        </button>
                    ))}
                </aside>

                <main className="r-main">
                    <div className="r-progress">
                        {current.steps.map((_, i) => (
                            <div key={i} className={`r-progress-item ${openStep !== null && i <= openStep ? 'done' : ''}`} />
                        ))}
                    </div>

                    <div className="r-section-header">
                        <div className="r-section-icon">{current.icon}</div>
                        <h1 className="r-section-title">{current.title}</h1>
                        <p className="r-section-desc">{current.desc}</p>
                    </div>

                    <div className="r-steps">
                        {current.steps.map((step, i) => (
                            <div key={i} className={`r-step ${openStep === i ? 'open' : ''}`}>
                                <button
                                    className="r-step-header"
                                    onClick={() => setOpenStep(openStep === i ? null : i)}
                                >
                                    <div className="r-step-left">
                                        <span className="r-step-num">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="r-step-title">{step.title}</span>
                                    </div>
                                    <span className="r-step-chevron">↓</span>
                                </button>
                                <div className="r-step-body">
                                    <p className="r-step-content">{step.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="r-nav-arrows">
                        {currentIdx > 0 && (
                            <button className="r-arrow-btn" onClick={() => gitSection(SECTIONS[currentIdx - 1].id)}>
                                ← {SECTIONS[currentIdx - 1].title}
                            </button>
                        )}
                        {currentIdx < SECTIONS.length - 1 && (
                            <button className="r-arrow-btn primary" onClick={() => gitSection(SECTIONS[currentIdx + 1].id)}>
                                {SECTIONS[currentIdx + 1].title} →
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}