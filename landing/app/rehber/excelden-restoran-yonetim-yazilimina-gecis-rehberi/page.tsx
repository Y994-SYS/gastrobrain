import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Excel'den Restoran Yönetim Yazılımına Geçiş Rehberi | GastroBrain",
    description:
        "Excel ile stok ve maliyet takibinin sınırları, restoran yönetim yazılımına ne zaman geçmeli, geçiş sürecinde dikkat edilmesi gerekenler.",
    alternates: {
        canonical: 'https://www.gastrobrain.com.tr/rehber/excelden-restoran-yonetim-yazilimina-gecis-rehberi',
    },
};

export default function ExcelGecisYazisi() {
    return (
        <div style={{ background: '#09090b', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ borderBottom: '1px solid #27272a', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="GastroBrain" style={{ height: '2rem' }} />
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#fff' }}>
                        Gastro<span style={{ color: '#a3e635' }}>BRAIN</span>
                    </span>
                </a>
                <a href="/rehber" style={{ color: '#a1a1aa', fontSize: '0.875rem', textDecoration: 'none' }}>← Rehber</a>
            </header>

            <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
                <p style={{ color: '#a3e635', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Dijitalleşme
                </p>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                    Excel&apos;den Restoran Yönetim Yazılımına Geçiş Rehberi
                </h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
                    Güncelleme: Eylül 2026 · 7 dakikalık okuma
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.85, color: '#d4d4d8', fontSize: '1rem' }}>

                    <p>
                        Çoğu restoran, işine Excel tablolarıyla başlar — ve bir süre bu yeterli gelir. Ama işletme
                        büyüdükçe, şube sayısı arttıkça veya sadece günlük iş yükü kalabalıklaştıkça, Excel'in sınırları
                        hızla ortaya çıkar. Bu yazıda Excel'in nerede yetersiz kaldığını, ne zaman bir yönetim yazılımına
                        geçmeniz gerektiğini ve geçiş sürecinde nelere dikkat etmeniz gerektiğini anlatıyoruz.
                    </p>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Excel neden bir noktadan sonra yetersiz kalır?
                        </h2>
                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <li><strong style={{ color: '#fff' }}>Tek kişi bağımlılığı:</strong> Genelde tabloyu tek bir kişi (genelde işletme sahibi) hazırlar ve günceller. O kişi izinliyken veya işten ayrıldığında sistem kilitlenir.</li>
                            <li><strong style={{ color: '#fff' }}>Eşzamanlı çalışma sorunu:</strong> Aynı anda iki kişi aynı dosyayı düzenleyemez; biri kaydedince diğerinin değişiklikleri kaybolabilir.</li>
                            <li><strong style={{ color: '#fff' }}>Manuel formül hataları:</strong> Bir hücredeki yanlış formül veya kopyala-yapıştır hatası, fark edilmeden tüm maliyet hesaplarını bozabilir.</li>
                            <li><strong style={{ color: '#fff' }}>Anlık güncellik yok:</strong> Tedarikçi fiyatı değiştiğinde, o fiyatı kullanan onlarca reçeteyi elle güncellemek gerekir — genelde bu yapılmaz ve maliyetler eskir.</li>
                            <li><strong style={{ color: '#fff' }}>Çok şubeli takip imkansızlaşır:</strong> Her şube ayrı dosya tutuyorsa, konsolide bir görünüm elde etmek saatler alan manuel birleştirme işine dönüşür.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Geçiş zamanı geldiğinin işaretleri
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>Aşağıdakilerden ikisi veya daha fazlası size tanıdık geliyorsa, muhtemelen geçiş vaktiniz gelmiştir:</p>
                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Ay sonu stok sayımı ve rapor hazırlığı bir günden fazla sürüyor</li>
                            <li>Birden fazla şubeniz var ve verileri birleştirmek manuel iş gerektiriyor</li>
                            <li>"Bu ürün ne kadar kâr getiriyor?" sorusuna hızlı cevap veremiyorsunuz</li>
                            <li>Tablo dosyası bozulduğunda veya kaybolduğunda panik yaşadınız</li>
                            <li>Personel sayısı arttı ve herkesin aynı anda veri girmesi gerekiyor</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Geçiş sürecinde dikkat edilmesi gerekenler
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>1. Verilerinizi önceden düzenleyin</h3>
                                <p>Excel'inizdeki malzeme listesini, birim fiyatları ve reçeteleri aktarmadan önce gözden geçirin. Tekrarlanan veya eski kayıtları temizlemek, yeni sistemde daha temiz bir başlangıç sağlar.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>2. Paralel çalışma dönemi planlayın</h3>
                                <p>İlk 1-2 hafta hem eski hem yeni sistemi birlikte kullanmak, veri kaybı riskini azaltır ve ekibin alışmasını kolaylaştırır.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>3. Ekibi eğitin, tek kişiye bırakmayın</h3>
                                <p>Yeni sistemin avantajı, herkesin veri girebilmesidir — ama bunun için en az 2-3 kişinin temel işlemleri (stok girişi, satış kaydı) bilmesi gerekir.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>4. İlk ayı "kalibrasyon dönemi" olarak görün</h3>
                                <p>İlk hafta ve aylarda küçük veri giriş hataları normaldir. Sayım ve raporları bu dönemde daha sık kontrol edin, alışkanlıklar oturunca hata payı düşer.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Ne zaman geçmemelisiniz?
                        </h2>
                        <p>
                            Tek şubeli, çok az sayıda ürünü olan ve sahibi tarafından her şeyin elle takip edilebildiği çok
                            küçük bir işletmeyseniz, Excel bir süre daha yeterli olabilir. Geçiş, işin büyüklüğüne değil,
                            yukarıdaki işaretlerin kaçının sizde göründüğüne göre değerlendirilmelidir.
                        </p>
                    </section>

                    <div style={{ background: '#18181b', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '0.5rem' }}>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Excel'den geçişi kolaylaştırmak ister misiniz?</p>
                        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            GastroBrain'de kurulum desteğiyle verilerinizi birlikte aktarırız — ilk aydan itibaren tam kullanıma hazır olursunuz.
                        </p>
                        <a
                            href="https://app.gastrobrain.com.tr/kayit"
                            style={{ display: 'inline-block', background: '#a3e635', color: '#000', fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.9rem' }}
                        >
                            1 Ay Ücretsiz Dene
                        </a>
                    </div>

                </div>
            </main>

            <footer style={{ borderTop: '1px solid #27272a', padding: '2rem', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                <p>© 2026 GastroBrain — Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}