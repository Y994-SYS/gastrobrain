'use client'

import { useState } from 'react'

const SECTIONS = [
    {
        id: 'stok',
        icon: '📦',
        title: 'Stok Yönetimi',
        desc: 'Malzeme girişinden zayi kaydına tüm stok hareketleri',
        steps: [
            {
                title: 'Stok kartı oluşturma',
                content: 'Sisteme yeni bir malzeme eklemek için Tanımlamalar → Stok Kartları yolunu izleyin. Sağ üstteki "Yeni Stok Kartı" butonuna tıklayın. Malzeme adı, kategori ve ölçü birimi alanlarını doldurun. Kaydet butonuna basın — malzeme artık tüm stok işlemlerinde kullanılabilir.',
                screenshot: 'stok-karti-olusturma'
            },
            {
                title: 'Giriş faturası işleme',
                content: 'Tedarikçiden malzeme geldiğinde Stok → Giriş Faturası sayfasına gidin. Tedarikçiyi (cari kart) seçin, fatura tarihini girin. "Kalem Ekle" ile her malzemeyi, miktarını ve birim fiyatını tek tek ekleyin. Faturayı kaydettiğinizde stok otomatik olarak güncellenir ve tedarikçi borcuna eklenir.',
                screenshot: 'giris-faturasi'
            },
            {
                title: 'Zayi kaydı',
                content: 'Bozulan veya kullanılamaz hale gelen malzemeleri Stok → Zayi Gideri sayfasından kaydedin. İlgili malzemeyi seçin, miktarı ve nedeni girin. Kayıt sonrası stok miktarı düşer ve zayi raporu oluşur.',
                screenshot: 'zayi-kaydi'
            },
            {
                title: 'Tüketim kaydı',
                content: 'Reçete dışında kullanılan malzemeleri (temizlik malzemesi, yakıt vb.) Stok → Tüketim Gideri sayfasından kaydedin. Malzeme, miktar ve açıklama girerek kaydedin.',
                screenshot: 'tuketim-kaydi'
            },
            {
                title: 'Ay sonu sayım',
                content: 'Her ay sonunda Stok → Ay Sonu Sayım sayfasına gidin. Sistemdeki tüm malzemeler listelenir. Fiili sayım miktarlarını "Sayım Miktarı" sütununa girin. Kaydettiğinizde sistem fark analizi yapar ve stoku günceller.',
                screenshot: 'ay-sonu-sayim'
            }
        ]
    },
    {
        id: 'recete',
        icon: '🍽️',
        title: 'Reçete & Maliyet',
        desc: 'Yemek maliyetlerini hesaplayın, kar marjınızı görün',
        steps: [
            {
                title: 'Reçete oluşturma',
                content: 'Reçeteler sayfasına gidin ve "Yeni Reçete" butonuna tıklayın. Yemeğin adını ve kaç porsiyon için olduğunu girin. "Malzeme Ekle" ile her ingredienti, miktarını seçin. Sistem her malzemenin güncel stok birim fiyatını otomatik alır.',
                screenshot: 'recete-olusturma'
            },
            {
                title: 'Maliyet analizi',
                content: 'Reçete kaydedildiğinde sistem otomatik olarak toplam hammadde maliyetini hesaplar. Reçete detayında "Maliyet" sütununda porsiyon başı maliyet görünür. Satış fiyatınızı girerek brüt kar marjınızı anında hesaplayabilirsiniz.',
                screenshot: 'maliyet-analizi'
            },
            {
                title: 'Stokla entegre tüketim',
                content: 'Satış kaydı yapıldığında ilgili reçetenin malzemeleri otomatik olarak stoktan düşmez — tüketim kaydı manuel yapılır. Böylece mutfak fiili tüketimi ile satış rakamlarını karşılaştırabilirsiniz.',
                screenshot: 'stok-entegrasyon'
            }
        ]
    },
    {
        id: 'satis',
        icon: '💰',
        title: 'Satış Takibi',
        desc: 'Günlük satışları kaydedin ve analiz edin',
        steps: [
            {
                title: 'Satış girişi',
                content: 'Satışlar sayfasına gidin. "Yeni Satış" butonuna tıklayın. Tarih, ürün/kategori, miktar ve tutarı girin. Birden fazla kalem için "Kalem Ekle" ile satırlar ekleyebilirsiniz. Kaydettiğinizde günlük toplama yansır.',
                screenshot: 'satis-girisi'
            },
            {
                title: 'Günlük rapor görüntüleme',
                content: 'Satışlar sayfasının üst kısmında tarih filtresi bulunur. İstediğiniz günü seçtiğinizde o güne ait tüm satışlar ve toplam ciro görünür. Dashboard\'da da bugünün satışı anlık takip edilebilir.',
                screenshot: 'gunluk-rapor'
            },
            {
                title: 'Satış silme',
                content: 'Hatalı girilen satışlar için ilgili satışın yanındaki silme ikonuna tıklayın. Silme işlemi günlük toplamdan otomatik düşer. Silinen kayıtlar geri getirilemez, dikkatli olun.',
                screenshot: 'satis-silme'
            }
        ]
    },
    {
        id: 'personel',
        icon: '👥',
        title: 'Personel Yönetimi',
        desc: 'Maaş, avans ve devam kayıtları',
        steps: [
            {
                title: 'Personel ekleme',
                content: 'Personel sayfasına gidin, "Yeni Personel" butonuna tıklayın. Ad, soyad, pozisyon ve maaş bilgilerini doldurun. Başlangıç tarihi ve iletişim bilgilerini ekleyin. Kaydedin — personel artık devam ve maaş takibinde görünecek.',
                screenshot: 'personel-ekleme'
            },
            {
                title: 'Maaş kaydı',
                content: 'Personel listesinde ilgili kişinin yanındaki "Maaş" butonuna tıklayın. Ödeme dönemini, tutarı ve ödeme tarihini girin. Kaydettiğinizde personelin maaş geçmişine eklenir.',
                screenshot: 'maas-kaydi'
            },
            {
                title: 'Avans kaydı',
                content: 'Personel sayfasında "Avans" butonuna tıklayın. Avans miktarı ve tarihini girin. Avanslar maaş geçmişinde ayrıca görünür, maaştan otomatik düşmez — manuel takip sizin sorumluluğunuzdadır.',
                screenshot: 'avans-kaydi'
            },
            {
                title: 'Devam takibi',
                content: 'Personel → Devam sekmesinden günlük giriş/çıkış veya devamsızlık kaydı tutabilirsiniz. Ay sonunda devam raporunu alarak maaş hesabında kullanabilirsiniz.',
                screenshot: 'devam-takibi'
            }
        ]
    },
    {
        id: 'cari',
        icon: '🏦',
        title: 'Cari Hesap',
        desc: 'Tedarikçi ve müşteri borç/alacak takibi',
        steps: [
            {
                title: 'Cari kart oluşturma',
                content: 'Tanımlamalar → Cari Kartlar sayfasına gidin. "Yeni Cari Kart" butonuna tıklayın. Firma/kişi adı, türü (tedarikçi/müşteri) ve iletişim bilgilerini doldurun. Kaydedin — artık fatura ve ödeme işlemlerinde bu cariyi seçebilirsiniz.',
                screenshot: 'cari-kart-olusturma'
            },
            {
                title: 'Bakiye görüntüleme',
                content: 'Cari Hesap sayfasında tüm carilerin anlık bakiyesi listelenir. Borçlu cariler kırmızı, alacaklılar yeşil gösterilir. İlgili cariye tıklayarak hareket detaylarına ulaşabilirsiniz.',
                screenshot: 'cari-bakiye'
            },
            {
                title: 'Ödeme kaydı',
                content: 'Cari Hesap sayfasında ilgili caride "Ödeme Ekle" butonuna tıklayın. Ödeme tarihini, tutarını ve açıklamasını girin. Kaydettiğinizde bakiye otomatik güncellenir.',
                screenshot: 'odeme-kaydi'
            }
        ]
    },
    {
        id: 'raporlar',
        icon: '📊',
        title: 'Raporlama',
        desc: 'Satış, stok, cari ve maliyet raporları',
        steps: [
            {
                title: 'Satış raporu',
                content: 'Raporlar sayfasında "Satış Raporu" sekmesine gidin. Tarih aralığı seçin. Günlük, haftalık veya aylık dağılımı görün. "Excel\'e Aktar" butonuyla raporu indirin.',
                screenshot: 'satis-raporu'
            },
            {
                title: 'Stok raporu',
                content: 'Stok Raporu sekmesinde tüm malzemelerin mevcut durumu, toplam değeri ve kritik stok uyarıları listelenir. Kategori filtresiyle sadece belirli ürün gruplarını görüntüleyebilirsiniz.',
                screenshot: 'stok-raporu'
            },
            {
                title: 'Maliyet raporu',
                content: 'Maliyet Raporu sekmesinde reçete bazında maliyet analizi yapabilirsiniz. Hangi ürünün ne kadar kar getirdiğini, hammadde maliyetlerinin satışlara oranını görün.',
                screenshot: 'maliyet-raporu'
            },
            {
                title: 'Excel export',
                content: 'Tüm raporlarda "Excel\'e Aktar" butonu bulunur. Tıkladığınızda ilgili rapor .xlsx formatında bilgisayarınıza indirilir. Muhasebeciye iletmek veya arşivlemek için kullanabilirsiniz.',
                screenshot: 'excel-export'
            }
        ]
    },
    {
        id: 'sube',
        icon: '🏢',
        title: 'Şube Yönetimi',
        desc: 'Birden fazla şubeyi tek hesaptan yönetin',
        steps: [
            {
                title: 'Şube ekleme',
                content: 'Tanımlamalar → Şubeler sayfasına gidin. "Yeni Şube" butonuna tıklayın. Şube adı, adresi ve sorumlu kişiyi girin. Kaydedin. Yeni şube artık kullanıcı atama ve raporlamada seçilebilir.',
                screenshot: 'sube-ekleme'
            },
            {
                title: 'Şube bazlı veri girişi',
                content: 'Giriş yaptığınızda hangi şubede çalıştığınız JWT token\'ınıza işlenir. Yaptığınız tüm stok, satış ve personel girişleri otomatik olarak o şubeye aittir. Şube değiştirmek için çıkış yapıp farklı şubeyle giriş yapın.',
                screenshot: 'sube-veri'
            },
            {
                title: 'Konsolide raporlama',
                content: 'TENANT_ADMIN rolüyle giriş yaptığınızda Raporlar sayfasında "Tüm Şubeler" seçeneği görünür. Tüm şubelerin verilerini tek raporda birleştirebilirsiniz.',
                screenshot: 'konsolide-rapor'
            }
        ]
    },
    {
        id: 'kullanicilar',
        icon: '🔐',
        title: 'Kullanıcı Rolleri',
        desc: 'Yetki yönetimi ve güvenli erişim kontrolü',
        steps: [
            {
                title: 'Kullanıcı ekleme',
                content: 'Tanımlamalar → Kullanıcılar sayfasına gidin (sadece TENANT_ADMIN görebilir). "Yeni Kullanıcı" butonuna tıklayın. Ad, e-posta ve şifre girin. Rol ve şube atamasını yapın. Kaydedin — kullanıcı artık sisteme giriş yapabilir.',
                screenshot: 'kullanici-ekleme'
            },
            {
                title: 'Roller ve yetkiler',
                content: 'Sistemde 3 temel rol vardır: TENANT_ADMIN tüm ayarlara ve raporlara erişir. MUDUR stok, satış ve personel işlemlerini yapabilir. Standart kullanıcı sadece atandığı şubenin veri girişini yapabilir. Rolleri Kullanıcılar sayfasından düzenleyebilirsiniz.',
                screenshot: 'roller-yetkiler'
            },
            {
                title: 'Şifre sıfırlama',
                content: 'Kullanıcı şifresini unutursa TENANT_ADMIN olarak Kullanıcılar sayfasına gidin, ilgili kullanıcının "Düzenle" butonuna tıklayın ve yeni şifre belirleyin. Kullanıcıya yeni şifreyi bildirin.',
                screenshot: 'sifre-sifirlama'
            }
        ]
    }
]

export default function Rehber() {
    const [activeSection, setActiveSection] = useState('stok')
    const [openStep, setOpenStep] = useState<number | null>(0)

    const current = SECTIONS.find(s => s.id === activeSection)!

    return (
        <>
            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0a0a0a;
          --surface: #111111;
          --surface2: #1a1a1a;
          --border: rgba(255,255,255,0.08);
          --text: #f0f0f0;
          --muted: #888;
          --lime: #a3e635;
          --lime-glow: rgba(163,230,53,0.10);
          --font-display: 'Syne', sans-serif;
          --font-body: 'Inter', sans-serif;
        }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }

        /* NAV */
        .r-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 64px;
          background: rgba(10,10,10,0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .r-nav-left { display: flex; align-items: center; gap: 20px; }
        .r-back {
          display: flex; align-items: center; gap: 6px;
          color: var(--muted); text-decoration: none;
          font-size: 14px; transition: color 0.2s;
        }
        .r-back:hover { color: var(--lime); }
        .r-nav-logo {
          display: flex; align-items: center; gap: 6px;
          text-decoration: none;
        }
        .r-nav-logo img { height: 32px; width: auto; }
        .r-nav-logo-text {
          font-family: var(--font-display);
          font-size: 18px; font-weight: 800;
          color: var(--text); letter-spacing: -0.5px;
        }
        .r-nav-logo-text span { color: var(--lime); }
        .r-nav-badge {
          font-size: 12px; padding: 4px 10px;
          background: var(--lime-glow);
          border: 1px solid rgba(163,230,53,0.2);
          color: var(--lime); border-radius: 99px;
        }

        /* LAYOUT */
        .r-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
          padding-top: 64px;
        }

        /* SIDEBAR */
        .r-sidebar {
          border-right: 1px solid var(--border);
          padding: 32px 16px;
          position: sticky; top: 64px;
          height: calc(100vh - 64px);
          overflow-y: auto;
        }
        .r-sidebar-title {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--muted); padding: 0 12px;
          margin-bottom: 12px;
        }
        .r-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          cursor: pointer; transition: all 0.15s;
          margin-bottom: 2px; color: var(--muted);
          font-size: 14px; border: none; background: none;
          width: 100%; text-align: left; font-family: var(--font-body);
        }
        .r-nav-item:hover { background: var(--surface2); color: var(--text); }
        .r-nav-item.active {
          background: var(--lime-glow);
          color: var(--lime);
          border: 1px solid rgba(163,230,53,0.15);
        }
        .r-nav-icon { font-size: 16px; flex-shrink: 0; }

        /* MAIN */
        .r-main { padding: 48px 56px; max-width: 820px; }

        .r-section-header { margin-bottom: 40px; }
        .r-section-icon {
          font-size: 32px; margin-bottom: 16px;
          width: 56px; height: 56px;
          background: var(--lime-glow);
          border: 1px solid rgba(163,230,53,0.2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .r-section-title {
          font-family: var(--font-display);
          font-size: 32px; font-weight: 800;
          letter-spacing: -1px; margin-bottom: 8px;
        }
        .r-section-desc { font-size: 16px; color: var(--muted); }

        /* STEPS */
        .r-steps { display: flex; flex-direction: column; gap: 12px; }

        .r-step {
          border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          transition: border-color 0.2s;
        }
        .r-step.open { border-color: rgba(163,230,53,0.25); }

        .r-step-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; cursor: pointer;
          background: none; border: none; width: 100%;
          text-align: left; font-family: var(--font-body);
          gap: 12px;
        }
        .r-step-header:hover .r-step-num { color: var(--lime); }

        .r-step-left { display: flex; align-items: center; gap: 14px; }
        .r-step-num {
          font-family: var(--font-display);
          font-size: 13px; font-weight: 700;
          color: var(--muted); min-width: 24px;
          transition: color 0.2s;
        }
        .r-step.open .r-step-num { color: var(--lime); }
        .r-step-title {
          font-size: 15px; font-weight: 500;
          color: var(--text);
        }
        .r-step-chevron {
          color: var(--muted); font-size: 18px;
          transition: transform 0.2s; flex-shrink: 0;
        }
        .r-step.open .r-step-chevron { transform: rotate(180deg); color: var(--lime); }

        .r-step-body {
          padding: 0 20px 20px 58px;
          display: none;
        }
        .r-step.open .r-step-body { display: block; }

        .r-step-content {
          font-size: 15px; color: var(--muted);
          line-height: 1.8; margin-bottom: 20px;
        }

        .r-screenshot {
          width: 100%; height: 200px;
          background: var(--surface2);
          border: 1px dashed rgba(163,230,53,0.2);
          border-radius: 8px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; color: var(--muted); font-size: 13px;
        }
        .r-screenshot-icon { font-size: 28px; opacity: 0.4; }
        .r-screenshot-label { opacity: 0.5; }

        /* PROGRESS */
        .r-progress {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 32px;
        }
        .r-progress-item {
          height: 3px; flex: 1; border-radius: 99px;
          background: var(--border);
          transition: background 0.3s;
        }
        .r-progress-item.done { background: var(--lime); }

        /* NAV ARROWS */
        .r-nav-arrows {
          display: flex; gap: 10px; margin-top: 48px;
          padding-top: 32px; border-top: 1px solid var(--border);
        }
        .r-arrow-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 8px;
          border: 1px solid var(--border);
          background: none; color: var(--text);
          font-size: 14px; cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.2s; text-decoration: none;
        }
        .r-arrow-btn:hover { border-color: var(--lime); color: var(--lime); }
        .r-arrow-btn.primary {
          background: var(--lime); color: #0a0a0a;
          border-color: var(--lime); font-weight: 600;
          margin-left: auto;
        }
        .r-arrow-btn.primary:hover { opacity: 0.88; color: #0a0a0a; }

        @media (max-width: 768px) {
          .r-layout { grid-template-columns: 1fr; }
          .r-sidebar { display: none; }
          .r-main { padding: 32px 20px; }
        }
      `}</style>

            {/* NAV */}
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
                {/* SIDEBAR */}
                <aside className="r-sidebar">
                    <div className="r-sidebar-title">Konular</div>
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            className={`r-nav-item ${activeSection === s.id ? 'active' : ''}`}
                            onClick={() => { setActiveSection(s.id); setOpenStep(0) }}
                        >
                            <span className="r-nav-icon">{s.icon}</span>
                            {s.title}
                        </button>
                    ))}
                </aside>

                {/* MAIN */}
                <main className="r-main">

                    {/* PROGRESS */}
                    <div className="r-progress">
                        {current.steps.map((_, i) => (
                            <div
                                key={i}
                                className={`r-progress-item ${openStep !== null && i <= openStep ? 'done' : ''}`}
                            />
                        ))}
                    </div>

                    {/* SECTION HEADER */}
                    <div className="r-section-header">
                        <div className="r-section-icon">{current.icon}</div>
                        <h1 className="r-section-title">{current.title}</h1>
                        <p className="r-section-desc">{current.desc}</p>
                    </div>

                    {/* STEPS */}
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
                                    <div className="r-screenshot">
                                        <span className="r-screenshot-icon">🖼️</span>
                                        <span className="r-screenshot-label">Ekran görüntüsü: {step.screenshot}.png</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* NAV ARROWS */}
                    <div className="r-nav-arrows">
                        {SECTIONS.findIndex(s => s.id === activeSection) > 0 && (
                            <button
                                className="r-arrow-btn"
                                onClick={() => {
                                    const idx = SECTIONS.findIndex(s => s.id === activeSection)
                                    setActiveSection(SECTIONS[idx - 1].id)
                                    setOpenStep(0)
                                }}
                            >
                                ← {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) - 1]?.title}
                            </button>
                        )}
                        {SECTIONS.findIndex(s => s.id === activeSection) < SECTIONS.length - 1 && (
                            <button
                                className="r-arrow-btn primary"
                                onClick={() => {
                                    const idx = SECTIONS.findIndex(s => s.id === activeSection)
                                    setActiveSection(SECTIONS[idx + 1].id)
                                    setOpenStep(0)
                                }}
                            >
                                {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) + 1]?.title} →
                            </button>
                        )}
                    </div>

                </main>
            </div>
        </>
    )
}