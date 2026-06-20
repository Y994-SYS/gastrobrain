'use client';

import { useEffect } from 'react';
import Image from 'next/image';
const APP_URL = 'https://app.gastrobrain.com.tr/kayit';
// const APP_URL = 'https://gastrobrain-frontend.onrender.com/kayit';

const ozellikler = [
  {
    emoji: '📦',
    baslik: 'Stok Yönetimi',
    aciklama: 'Giriş faturalarından zayi giderlerine kadar tüm stok hareketlerini takip edin.',
    liste: ['Giriş / iade faturası', 'Zayi ve tüketim kaydı', 'Ay sonu sayım', 'Kritik stok uyarıları'],
  },
  {
    emoji: '🍽️',
    baslik: 'Reçete & Maliyet',
    aciklama: 'Her yemeğin gerçek maliyetini hesaplayın. Fiyatlandırmanızı veriye dayandırın.',
    liste: ['Reçete tanımlama', 'Otomatik maliyet hesabı', 'Brüt kar marjı analizi', 'Stokla entegre tüketim'],
  },
  {
    emoji: '💰',
    baslik: 'Satış Takibi',
    aciklama: 'Günlük satışları kaydedin, analiz edin, karşılaştırın.',
    liste: ['Hızlı satış girişi', 'Günlük / aylık toplam', 'Kategori bazlı dağılım'],
  },
  {
    emoji: '🤝',
    baslik: 'Cari Hesap',
    aciklama: 'Tedarikçi borç/alacak takibi, ödeme kayıtları, bakiye raporları.',
    liste: ['Tedarikçi yönetimi', 'Borç/alacak takibi', 'Ödeme geçmişi'],
  },
  {
    emoji: '👥',
    baslik: 'Personel Yönetimi',
    aciklama: 'Maaş, avans ve devam kayıtlarını tek yerden yönetin.',
    liste: ['Personel özlük bilgileri', 'Maaş ve avans takibi', 'Devam / devamsızlık'],
  },
  {
    emoji: '📊',
    baslik: 'Raporlama',
    aciklama: 'Satış, stok, cari ve maliyet raporlarını saniyeler içinde alın.',
    liste: ['Satış raporu', 'Stok durum raporu', 'Cari hesap raporu', 'Excel export'],
  },
];

const planlar = [
  {
    ad: 'Başlangıç',
    aylik: '₺799',
    yillik: '₺7.990',
    populer: false,
    ozellikler: ['1 Şube', '5 Kullanıcı', 'Stok Yönetimi', 'Reçete & Maliyet', 'Satış Takibi', 'Temel Raporlar', 'Email Destek'],
  },
  {
    ad: 'Profesyonel',
    aylik: '₺1.499',
    yillik: '₺14.990',
    populer: true,
    ozellikler: ['Sınırsız Şube', 'Sınırsız Kullanıcı', 'Tüm Başlangıç Özellikleri', 'Cari Hesap', 'Personel & Maaş', 'Gelişmiş Raporlar + Excel', 'Rol Yönetimi', 'Öncelikli Destek'],
  },
  {
    ad: 'Kurumsal',
    aylik: 'Teklif Al',
    yillik: 'Teklif Al',
    populer: false,
    ozellikler: ['Her şey dahil', 'Özel entegrasyonlar', 'Yerinde eğitim', 'Özel SLA', 'Hesap yöneticisi'],
  },
];

const sorular = [
  { soru: 'Kurulum ne kadar sürer?', cevap: 'Temel kurulum ve veri girişi ortalama 1 iş günü sürer. Stok kartlarınız ve reçeteleriniz hazırsa sistemi aynı gün kullanmaya başlayabilirsiniz.' },
  { soru: 'Birden fazla şubemi yönetebilir miyim?', cevap: 'Evet. Her şube bağımsız yönetilir, kullanıcılar sadece yetkili oldukları şubeleri görür. Konsolide raporlama ile tüm şubelerinizi tek ekrandan takip edebilirsiniz.' },
  { soru: 'Verilerim güvende mi?', cevap: 'Tüm veriler şifrelenmiş veritabanında saklanır. Her firma verisi birbirinden izole çalışır. HTTPS şifrelemesi ve rol bazlı erişim kontrolü uygulanır.' },
  { soru: '1 aylık deneme sonrası ne olur?', cevap: 'Deneme süresi bitince bir plan seçmeniz gerekir. Kredi kartı bilgisi girmeden deneyebilirsiniz, verileriniz silinmez.' },
  { soru: 'Destek nasıl alırım?', cevap: 'Email ve telefon desteği sunuyoruz. Profesyonel planda öncelikli destek sağlanmaktadır.' },
  { soru: 'İstediğim zaman iptal edebilir miyim?', cevap: 'Evet, istediğiniz zaman iptal edebilirsiniz. Uzun vadeli sözleşme veya ceza yoktur.' },
];

export default function Home() {
  useEffect(() => {
    const faqBtns = document.querySelectorAll('.faq-q');
    faqBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }, []);

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        nav {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 2rem;
          background: rgba(9,9,11,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #27272a;
        }
        .nav-logo-wrap { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
        .nav-logo-text { font-size: 1.25rem; font-weight: 900; color: #fff; }
        .nav-logo-text span { color: #a3e635; }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-links a { color: #a1a1aa; text-decoration: none; font-size: 0.875rem; position: relative; transition: color 0.2s; }
        .nav-links a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #a3e635; transition: width 0.3s; }
        .nav-links a:hover { color: #fff; }
        .nav-links a:hover::after { width: 100%; }
        .nav-cta {
          background: #a3e635 !important; color: #000 !important; font-weight: 700 !important;
          padding: 0.5rem 1.25rem; border-radius: 8px; transition: background 0.2s !important;
        }
        .nav-cta:hover { background: #bef264 !important; }
        .nav-cta::after { display: none !important; }

        .hero { text-align: center; padding: 6rem 1.5rem; max-width: 900px; margin: 0 auto; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(163,230,53,0.1); border: 1px solid rgba(163,230,53,0.3);
          color: #a3e635; font-size: 0.75rem; font-weight: 600;
          padding: 0.35rem 1rem; border-radius: 999px; margin-bottom: 1.5rem;
        }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #a3e635; animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .hero h1 { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; line-height: 1.1; color: #fff; margin-bottom: 1.5rem; }
        .hero h1 em { font-style: normal; color: #a3e635; }
        .hero-sub { color: #a1a1aa; font-size: 1.125rem; max-width: 600px; margin: 0 auto 2.5rem; line-height: 1.6; }
        .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-primary {
          background: #a3e635; color: #000; font-weight: 700; font-size: 1rem;
          padding: 0.875rem 2rem; border-radius: 12px; text-decoration: none;
          animation: pulse-lime 2.5s infinite; transition: background 0.2s;
        }
        .btn-primary:hover { background: #bef264; }
        @keyframes pulse-lime {
          0%,100% { box-shadow: 0 0 0 0 rgba(163,230,53,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(163,230,53,0); }
        }
        .btn-secondary {
          border: 1px solid #3f3f46; color: #fff; font-weight: 600; font-size: 1rem;
          padding: 0.875rem 2rem; border-radius: 12px; text-decoration: none; transition: border-color 0.2s;
        }
        .btn-secondary:hover { border-color: #71717a; }
        .hero-stats { display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap; }
        .hero-stat-num { display: block; font-size: 2rem; font-weight: 900; color: #a3e635; transition: transform 0.2s; }
        .hero-stat-num:hover { transform: scale(1.1); }
        .hero-stat-lbl { font-size: 0.8rem; color: #71717a; }

        .mockup-section { padding: 0 1.5rem 5rem; max-width: 900px; margin: 0 auto; }
        .mockup-wrap { border: 1px solid #27272a; border-radius: 12px; overflow: hidden; background: #18181b; }
        .mockup-bar { display: flex; align-items: center; gap: 6px; padding: 0.75rem 1rem; background: #09090b; border-bottom: 1px solid #27272a; }
        .mockup-dot { width: 12px; height: 12px; border-radius: 50%; }
        .mockup-url { margin-left: 0.75rem; font-size: 0.7rem; color: #52525b; font-family: monospace; }
        .mockup-inner { display: flex; }
        .mockup-sidebar { width: 160px; padding: 1rem; border-right: 1px solid #27272a; flex-shrink: 0; }
        .mockup-logo { font-size: 0.875rem; font-weight: 900; color: #fff; margin-bottom: 1rem; }
        .mockup-logo span { color: #a3e635; }
        .m-nav-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; color: #71717a; padding: 0.35rem 0.5rem; border-radius: 6px; margin-bottom: 2px; }
        .m-nav-item.active { background: rgba(163,230,53,0.1); color: #a3e635; }
        .m-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
        .mockup-main { flex: 1; padding: 1rem; }
        .m-heading { font-size: 0.75rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem; }
        .m-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.5rem; margin-bottom: 1rem; }
        .m-card { background: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 0.6rem; }
        .m-card-val { font-size: 1rem; font-weight: 900; color: #fff; }
        .m-card-val.lime { color: #a3e635; }
        .m-card-lbl { font-size: 0.6rem; color: #71717a; margin-top: 2px; }
        .m-table { width: 100%; border-collapse: collapse; font-size: 0.65rem; }
        .m-table th { text-align: left; color: #52525b; font-weight: 600; padding: 0.4rem 0.5rem; border-bottom: 1px solid #27272a; }
        .m-table td { color: #a1a1aa; padding: 0.4rem 0.5rem; border-bottom: 1px solid #18181b; }
        .m-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .m-badge.ok { background: rgba(163,230,53,0.1); color: #a3e635; }
        .m-badge.warn { background: rgba(251,191,36,0.1); color: #fbbf24; }

        .divider { border: none; border-top: 1px solid #27272a; margin: 0; }
        section { padding: 5rem 1.5rem; }
        .container { max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 0.75rem; font-weight: 700; color: #a3e635; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
        .section-title { font-size: clamp(1.75rem,4vw,2.5rem); font-weight: 900; color: #fff; margin-bottom: 1rem; }
        .section-sub { color: #71717a; max-width: 600px; line-height: 1.6; margin-bottom: 3rem; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .feature-card {
          background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 1.5rem;
          transition: border-color 0.25s ease;
        }
        .feature-card:hover { border-color: #a3e635; }
        .feature-icon { font-size: 2rem; margin-bottom: 0.75rem; }
        .feature-title { font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .feature-desc { font-size: 0.875rem; color: #71717a; margin-bottom: 1rem; line-height: 1.5; }
        .feature-list { list-style: none; }
        .feature-list li { font-size: 0.8rem; color: #a1a1aa; padding: 0.2rem 0 0.2rem 1rem; position: relative; }
        .feature-list li::before { content: '✓'; position: absolute; left: 0; color: #a3e635; font-size: 0.7rem; }

        .how-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px,1fr)); gap: 2rem; }
        .how-step { padding: 1.5rem; border-left: 2px solid #a3e635; }
        .how-num { font-size: 2.5rem; font-weight: 900; color: #27272a; margin-bottom: 0.5rem; }
        .how-title { font-size: 1.125rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem; }
        .how-desc { font-size: 0.875rem; color: #71717a; line-height: 1.6; }

        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px,1fr)); gap: 1.5rem; }
        .plan-kart {
          background: #18181b; border-radius: 16px; padding: 1.75rem; position: relative;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .plan-kart:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); border-color: #a3e635 !important; }
        .plan-kart.populer:hover { box-shadow: 0 20px 40px rgba(163,230,53,0.2); border-color: #a3e635 !important; }
        .plan-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #a3e635; color: #000; font-size: 0.7rem; font-weight: 900;
          padding: 4px 12px; border-radius: 999px; white-space: nowrap;
        }
        .plan-ad { font-size: 1.125rem; font-weight: 900; color: #fff; margin-bottom: 0.5rem; }
        .plan-fiyat { font-size: 2.25rem; font-weight: 900; color: #fff; }
        .plan-fiyat span { font-size: 0.875rem; font-weight: 400; color: #71717a; }
        .plan-yillik { font-size: 0.75rem; color: #71717a; margin-bottom: 1.5rem; margin-top: 0.25rem; }
        .plan-liste { list-style: none; margin-bottom: 1.75rem; }
        .plan-liste li { font-size: 0.875rem; color: #a1a1aa; padding: 0.3rem 0 0.3rem 1.25rem; position: relative; }
        .plan-liste li::before { content: '✓'; position: absolute; left: 0; color: #a3e635; }
        .plan-btn {
          display: block; text-align: center; font-weight: 700; font-size: 0.875rem;
          padding: 0.75rem; border-radius: 10px; text-decoration: none; transition: opacity 0.2s;
        }
        .plan-btn {
  transition: all 0.2s ease;
}
.plan-btn:hover { 
  opacity: 0.85; 
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(163,230,53,0.25);
}

        .faq-list { display: flex; flex-direction: column; gap: 0.75rem; max-width: 700px; margin: 0 auto; }
        .faq-item { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; transition: border-color 0.25s; }
        .faq-item:hover, .faq-item.open { border-color: #a3e635; }
        .faq-q {
          width: 100%; text-align: left; background: none; border: none; color: #fff;
          font-size: 0.9rem; font-weight: 600; padding: 1rem 1.25rem;
          cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem;
          font-family: inherit;
        }
        .faq-icon { color: #a3e635; font-size: 1.25rem; flex-shrink: 0; transition: transform 0.25s; }
        .faq-item.open .faq-icon { transform: rotate(45deg); }
        .faq-a { font-size: 0.875rem; color: #71717a; line-height: 1.6; max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.25s; padding: 0 1.25rem; }
        .faq-item.open .faq-a { max-height: 200px; padding: 0 1.25rem 1rem; }

        .cta-strip { background: rgba(163,230,53,0.05); border: 1px solid rgba(163,230,53,0.2); border-radius: 16px; padding: 3rem; text-align: center; max-width: 700px; margin: 0 auto; }
        .cta-strip h2 { font-size: clamp(1.5rem,3vw,2rem); font-weight: 900; color: #fff; margin-bottom: 0.75rem; }
        .cta-strip p { color: #71717a; margin-bottom: 2rem; }

        footer { border-top: 1px solid #27272a; padding: 2rem 1.5rem; }
        .footer-inner { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .footer-logo-wrap { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
        .footer-logo-text { font-size: 1.25rem; font-weight: 900; color: #fff; }
        .footer-logo-text span { color: #a3e635; }
        .footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
        .footer-links a { font-size: 0.875rem; color: #71717a; text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: #fff; }
        .footer-copy { font-size: 0.75rem; color: #3f3f46; }

        @media (max-width: 640px) {
          nav { padding: 0.875rem 1rem; }
          .nav-links { display: none; }
        }
      `}</style>

      <main style={{ background: '#09090b', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

        {/* NAV */}
        <nav>
          <a href="#" className="nav-logo-wrap">
            <Image src="/logo.png" alt="GastroBrain" width={36} height={36} />
            <span className="nav-logo-text">Gastro<span>Brain</span></span>
          </a>
          <div className="nav-links">
            <a href="#ozellikler">Özellikler</a>
            <a href="#nasil-calisir">Nasıl çalışır</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <a href="#sss">SSS</a>
            <a href="/rehber" style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--lime)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>Rehber</a>
            <a href="https://app.gastrobrain.com.tr/giris" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>Giriş Yap</a>
            <a href={APP_URL} className="nav-cta">1 Ay Ücretsiz Dene</a>
          </div>
        </nav>

        {/* HERO */}
        <div className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Türkiye&apos;nin restoranlarına özel
          </div>
          <h1>Restoranınızı<br /><em>akıllıca</em> yönetin</h1>
          <p className="hero-sub">
            Stok takibinden reçete maliyetine, satışlardan personel yönetimine — her şey tek platformda.
          </p>
          <div className="hero-actions">
            <a href={APP_URL} className="btn-primary">1 Ay Ücretsiz Başla</a>
            <a href="#ozellikler" className="btn-secondary">Özelliklere bak</a>
          </div>
          <div className="hero-stats">
            {[
              { sayi: '8', etiket: 'Temel modül' },
              { sayi: '%30', etiket: 'Daha az fire' },
              { sayi: '5 dk', etiket: 'Kurulum süresi' },
              { sayi: '7/24', etiket: 'Destek' },
            ].map(s => (
              <div key={s.etiket} className="hero-stat">
                <span className="hero-stat-num">{s.sayi}</span>
                <span className="hero-stat-lbl">{s.etiket}</span>
              </div>
            ))}
          </div>
          <a href="/rehber" style={{ marginTop: '1.5rem', fontSize: 13, color: 'var(--muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            📖 Kullanım kılavuzunu incele →
          </a>
        </div>

        {/* MOCKUP */}
        <div className="mockup-section">
          <div className="mockup-wrap">
            <div className="mockup-bar">
              <div className="mockup-dot" style={{ background: '#ff5f57' }}></div>
              <div className="mockup-dot" style={{ background: '#ffbd2e' }}></div>
              <div className="mockup-dot" style={{ background: '#28c840' }}></div>
              <div className="mockup-url">app.gastrobrain.com/dashboard</div>
            </div>
            <div className="mockup-inner">
              <div className="mockup-sidebar">
                <div className="mockup-logo">Gastro<span>Brain</span></div>
                <div className="m-nav-item active"><span className="m-dot"></span> Dashboard</div>
                <div className="m-nav-item"><span className="m-dot"></span> Stok</div>
                <div className="m-nav-item"><span className="m-dot"></span> Reçeteler</div>
                <div className="m-nav-item"><span className="m-dot"></span> Satışlar</div>
                <div className="m-nav-item"><span className="m-dot"></span> Cari Hesap</div>
                <div className="m-nav-item"><span className="m-dot"></span> Personel</div>
                <div className="m-nav-item"><span className="m-dot"></span> Raporlar</div>
              </div>
              <div className="mockup-main">
                <div className="m-heading">Bugünün özeti</div>
                <div className="m-cards">
                  <div className="m-card"><div className="m-card-val lime">₺18.450</div><div className="m-card-lbl">Günlük satış</div></div>
                  <div className="m-card"><div className="m-card-val">%67</div><div className="m-card-lbl">Kar marjı</div></div>
                  <div className="m-card"><div className="m-card-val" style={{ color: '#fbbf24' }}>3</div><div className="m-card-lbl">Kritik stok</div></div>
                </div>
                <table className="m-table">
                  <thead><tr><th>Stok kalemi</th><th>Miktar</th><th>Durum</th></tr></thead>
                  <tbody>
                    <tr><td>Dana kuşbaşı</td><td>12.4 kg</td><td><span className="m-badge ok">Normal</span></td></tr>
                    <tr><td>Zeytinyağı</td><td>1.8 L</td><td><span className="m-badge warn">Az</span></td></tr>
                    <tr><td>Un</td><td>24 kg</td><td><span className="m-badge ok">Normal</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* ÖZELLİKLER */}
        <section id="ozellikler">
          <div className="container">
            <div className="section-label">Özellikler</div>
            <h2 className="section-title">Mutfaktan kasaya, her adım kontrol altında</h2>
            <p className="section-sub">Küçük restoranlardan büyük zincir işletmelere ölçeklenen, restorancılar için tasarlanmış bir sistem.</p>
            <div className="features-grid">
              {ozellikler.map(o => (
                <div key={o.baslik} className="feature-card">
                  <div className="feature-icon">{o.emoji}</div>
                  <div className="feature-title">{o.baslik}</div>
                  <div className="feature-desc">{o.aciklama}</div>
                  <ul className="feature-list">
                    {o.liste.map(l => <li key={l}>{l}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* NASIL ÇALIŞIR */}
        <section id="nasil-calisir">
          <div className="container">
            <div className="section-label">Nasıl çalışır</div>
            <h2 className="section-title">Kurulumdan kullanıma üç adım</h2>
            <div className="how-wrap">
              {[
                { num: '01', baslik: 'Kaydolun', aciklama: '1 aylık ücretsiz denemenizi başlatın. Kredi kartı gerekmez, kurulum dakikalar içinde tamamlanır.' },
                { num: '02', baslik: 'Verilerinizi girin', aciklama: 'Stok kartlarınızı, reçetelerinizi ve personel bilgilerinizi sisteme aktarın. Yardımcı oluruz.' },
                { num: '03', baslik: 'Kullanmaya başlayın', aciklama: 'İlk günden itibaren stok takibi, satış kaydı ve raporlama tamamen hazır.' },
              ].map(s => (
                <div key={s.num} className="how-step">
                  <div className="how-num">{s.num}</div>
                  <div className="how-title">{s.baslik}</div>
                  <div className="how-desc">{s.aciklama}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* FİYATLAR */}
        <section id="fiyatlar">
          <div className="container">
            <div className="section-label">Fiyatlandırma</div>
            <h2 className="section-title">Şeffaf, gizli ücretsiz fiyatlar</h2>
            <p className="section-sub">1 ay ücretsiz deneyin. Kredi kartı gerekmez. İstediğiniz zaman iptal edin.</p>
            <div className="pricing-grid">
              {planlar.map(p => (
                <div key={p.ad} className={`plan-kart ${p.populer ? 'populer' : ''}`} style={{ border: `2px solid ${p.populer ? '#a3e635' : '#27272a'}` }}>
                  {p.populer && <div className="plan-badge">EN POPÜLER</div>}
                  <div className="plan-ad">{p.ad}</div>
                  <div className="plan-fiyat">
                    {p.aylik}{p.aylik !== 'Teklif Al' && <span>/ay</span>}
                  </div>
                  <div className="plan-yillik">
                    {p.yillik !== 'Teklif Al' ? `Yıllık: ${p.yillik} (%17 indirim)` : 'Size özel fiyat'}
                  </div>
                  <ul className="plan-liste">
                    {p.ozellikler.map(o => <li key={o}>{o}</li>)}
                  </ul>
                  <a
                    href={p.aylik === 'Teklif Al' ? 'mailto:info@gastrobrain.com' : APP_URL}
                    className="plan-btn"
                    style={{ background: p.populer ? '#a3e635' : '#27272a', color: p.populer ? '#000' : '#fff' }}
                  >
                    {p.aylik === 'Teklif Al' ? 'Teklif Al' : '1 Ay Ücretsiz Dene'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* SSS */}
        <section id="sss">
          <div className="container">
            <div className="section-label">SSS</div>
            <h2 className="section-title">Sık sorulan sorular</h2>
            <div className="faq-list">
              {sorular.map(s => (
                <div key={s.soru} className="faq-item">
                  <button className="faq-q">{s.soru} <span className="faq-icon">+</span></button>
                  <div className="faq-a">{s.cevap}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* CTA */}
        <section>
          <div className="container">
            <div className="cta-strip">
              <h2>Restoranınızı bugün dijitalleştirin</h2>
              <p>1 ay ücretsiz deneyin. Kredi kartı gerekmez, kurulum dakikalar içinde.</p>
              <a href={APP_URL} className="btn-primary" style={{ display: 'inline-block' }}>
                Hemen Ücretsiz Başla
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-inner">
            <a href="#" className="footer-logo-wrap">
              <Image src="/logo.png" alt="GastroBrain" width={28} height={28} />
              <span className="footer-logo-text">Gastro<span>Brain</span></span>
            </a>
            <div className="footer-links">
              <a href="#ozellikler">Özellikler</a>
              <a href="#fiyatlar">Fiyatlar</a>
              <a href="#sss">SSS</a>
              <a href="/rehber">Kullanım Kılavuzu</a>
              <a href="mailto:info@gastrobrain.com">İletişim</a>
            </div>
            <p className="footer-copy">© 2026 GastroBrain. Tüm hakları saklıdır.</p>
          </div>
        </footer>

      </main>
    </>
  );
}