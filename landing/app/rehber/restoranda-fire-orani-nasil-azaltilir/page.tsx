import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Restoranda Fire Oranı Nasıl Azaltılır? | GastroBrain',
    description:
        'Restoran ve kafelerde fire (zayi) oranı nasıl hesaplanır, kabul edilebilir sınırlar nedir ve fireyi azaltmak için uygulanabilir 7 yöntem.',
    alternates: {
        canonical: 'https://www.gastrobrain.com.tr/rehber/restoranda-fire-orani-nasil-azaltilir',
    },
};

export default function FireOraniYazisi() {
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
                    Stok Yönetimi
                </p>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                    Restoranda Fire Oranı Nasıl Azaltılır?
                </h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
                    Güncelleme: Eylül 2026 · 7 dakikalık okuma
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.85, color: '#d4d4d8', fontSize: '1rem' }}>

                    <p>
                        Fire, bir restoranın kâr marjını sessizce eriten en büyük kalemlerden biridir. Bozulan sebze,
                        fazla pişirilen et, yanlış porsiyonlanan tabaklar — hiçbiri tek başına büyük görünmez, ama ay
                        sonunda toplandığında ciroyu ciddi şekilde etkiler. Bu yazıda fire oranının nasıl hesaplandığını,
                        sektörde kabul edilebilir sınırların ne olduğunu ve fireyi azaltmak için uygulanabilir somut
                        yöntemleri anlatıyoruz.
                    </p>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Fire oranı nasıl hesaplanır?
                        </h2>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#a3e635' }}>
                            Fire Oranı (%) = (Fire Tutarı ÷ Toplam Satın Alma Tutarı) × 100
                        </div>
                        <p style={{ marginTop: '1rem' }}>
                            Örneğin bir ay içinde toplam ₺150.000'lik hammadde satın aldınız ve bunun ₺9.000'lık kısmı
                            bozulma, fazla kesim veya hatalı hazırlık nedeniyle kullanılamaz hale geldiyse, fire oranınız
                            %6'dır (9.000 ÷ 150.000 × 100).
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Kabul edilebilir fire oranı nedir?
                        </h2>
                        <p>
                            Sektörde genel kabul gören sınır, ürün grubuna göre değişmekle birlikte, toplam hammaddede
                            <strong style={{ color: '#fff' }}> %4-8 arası</strong> makul kabul edilir. Taze sebze-meyve gibi
                            kolay bozulan ürünlerde bu oran doğal olarak daha yüksek (%8-12) olabilirken, kuru gıda ve
                            donuk ürünlerde %2'nin altında kalması beklenir. Fire oranınız %10'u aşıyorsa, bu bir uyarı
                            işaretidir ve kaynağının araştırılması gerekir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Fireyi azaltmak için 7 yöntem
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>1. FIFO (İlk giren, ilk çıkar) prensibini uygulayın</h3>
                                <p>Depoya yeni gelen ürünleri arkaya, eski ürünleri öne yerleştirin. Personel her zaman önce eskiyi kullansın. Bu tek kural, bozulma kaynaklı fireyi ciddi oranda azaltır.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>2. Reçeteleri standartlaştırın</h3>
                                <p>Her yemeğin porsiyon miktarı, aşçıdan aşçıya değişmemeli. Standart reçete, hem fazla malzeme kullanımını hem de müşteri şikayetlerini azaltır.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>3. Sipariş miktarlarını satış verisine göre planlayın</h3>
                                <p>"Belki lazım olur" mantığıyla fazla stok almak, en büyük fire sebeplerinden biridir. Geçmiş satış verilerine bakarak haftalık tüketim tahmini yapın.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>4. Personeli fire konusunda bilinçlendirin</h3>
                                <p>Mutfak ekibi fireyi bir maliyet kalemi olarak görmüyorsa azaltma motivasyonu da olmaz. Haftalık fire raporlarını ekiple paylaşmak farkındalığı artırır.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>5. Depolama koşullarını gözden geçirin</h3>
                                <p>Yanlış sıcaklıkta saklanan sebze-meyve ve et ürünleri çok daha hızlı bozulur. Soğuk zincirin her aşamada korunduğundan emin olun.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>6. Her fire kaydını nedeniyle birlikte tutun</h3>
                                <p>"3 kg domates zayi" yazmak yeterli değil — "bozulma", "fazla kesim", "düşürüldü" gibi nedeni de kaydedin. Zamanla hangi nedenin en çok tekrarlandığını görüp o noktaya odaklanabilirsiniz.</p>
                            </div>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>7. Düzenli sayım yapın</h3>
                                <p>Haftalık veya aylık fiili sayım, sistemdeki stok ile gerçek stok arasındaki farkı ortaya çıkarır. Bu fark genellikle kayıt dışı kalan fireyi gösterir.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Fireyi takip etmezseniz ne olur?
                        </h2>
                        <p>
                            Fire kaydı tutulmayan bir işletmede, ay sonunda "stoklar neden bu kadar erken bitti?" sorusuna
                            net bir cevap bulunamaz. Oysa her zayi ve tüketim kaydı sistematik tutulduğunda, hangi
                            malzemenin ne kadar fire verdiği, hangi şubenin daha dikkatli çalıştığı net biçimde görülebilir
                            — ve iyileştirme buradan başlar.
                        </p>
                    </section>

                    <div style={{ background: '#18181b', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '0.5rem' }}>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Fire kayıtlarınızı otomatik raporlamak ister misiniz?</p>
                        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            GastroBrain ile her zayi kaydı otomatik raporlanır, hangi malzemenin ne kadar fire verdiğini anlık görürsünüz.
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