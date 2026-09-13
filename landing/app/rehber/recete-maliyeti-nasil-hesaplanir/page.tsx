import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reçete Maliyeti Nasıl Hesaplanır? Adım Adım Rehber | GastroBrain',
    description:
        'Restoran ve kafelerde reçete maliyeti hesaplama yöntemi, formülü ve örnek hesaplamalarla adım adım anlatım. Kar marjınızı doğru belirlemenin yolu.',
    alternates: {
        canonical: 'https://www.gastrobrain.com.tr/rehber/recete-maliyeti-nasil-hesaplanir',
    },
};

export default function ReceteMaliyetiYazisi() {
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
                    Maliyet Yönetimi
                </p>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                    Reçete Maliyeti Nasıl Hesaplanır?
                </h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
                    Güncelleme: Eylül 2026 · 6 dakikalık okuma
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.85, color: '#d4d4d8', fontSize: '1rem' }}>

                    <p>
                        Bir restoranda satılan her yemeğin gerçek bir maliyeti vardır — ama çoğu işletmeci bu maliyeti
                        "yaklaşık" olarak bilir, tam olarak değil. Oysa reçete maliyeti doğru hesaplanmadan belirlenen
                        satış fiyatları, ya karı eritir ya da rakiplerin gerisinde kalmanıza yol açar. Bu yazıda reçete
                        maliyetinin nasıl hesaplandığını, hangi kalemlerin dahil edilmesi gerektiğini ve pratikte nasıl
                        uygulanacağını adım adım anlatıyoruz.
                    </p>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Reçete maliyeti nedir?
                        </h2>
                        <p>
                            Reçete maliyeti, bir yemeği hazırlamak için kullanılan tüm hammaddelerin toplam maliyetidir.
                            Örneğin bir "Izgara Tavuk Salata" tabağının maliyeti; tavuk göğsü, marul, domates, zeytinyağı,
                            sos malzemeleri gibi o tabakta kullanılan her ne varsa, hepsinin birim fiyatlarının toplamıdır.
                            Bu rakam, o yemeği kaça satmanız gerektiğine karar vermenizin temelidir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Temel formül
                        </h2>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#a3e635' }}>
                            Reçete Maliyeti = Σ (Malzeme Miktarı × Malzemenin Birim Fiyatı)
                        </div>
                        <p style={{ marginTop: '1rem' }}>
                            Yani reçetedeki her malzemeyi tek tek ele alıp, kullanılan miktarı o malzemenin güncel birim
                            fiyatıyla çarpıyor, sonra hepsini topluyorsunuz. Kulağa basit gelse de asıl zorluk burada
                            başlıyor: "güncel birim fiyat" sürekli değişen bir değer.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Örnek hesaplama
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>
                            "Izgara Tavuk Salata" reçetesini ele alalım (1 porsiyon):
                        </p>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #27272a', color: '#71717a', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>Malzeme</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Miktar</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Birim Fiyat</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Tutar</th>
                                    </tr>
                                </thead>
                                <tbody style={{ color: '#a1a1aa' }}>
                                    <tr style={{ borderBottom: '1px solid #18181b' }}>
                                        <td style={{ padding: '0.6rem 1rem' }}>Tavuk göğsü</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>150 g</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>₺180/kg</td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₺27,00</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #18181b' }}>
                                        <td style={{ padding: '0.6rem 1rem' }}>Marul</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>80 g</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>₺25/kg</td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₺2,00</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #18181b' }}>
                                        <td style={{ padding: '0.6rem 1rem' }}>Domates</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>60 g</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>₺30/kg</td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₺1,80</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #18181b' }}>
                                        <td style={{ padding: '0.6rem 1rem' }}>Zeytinyağı</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>15 ml</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>₺400/L</td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₺6,00</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '0.6rem 1rem' }}>Sos malzemeleri</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>—</td>
                                        <td style={{ padding: '0.6rem 1rem' }}>—</td>
                                        <td style={{ padding: '0.6rem 1rem', textAlign: 'right' }}>₺3,20</td>
                                    </tr>
                                    <tr style={{ borderTop: '1px solid #27272a', color: '#a3e635', fontWeight: 700 }}>
                                        <td style={{ padding: '0.75rem 1rem' }} colSpan={3}>Toplam reçete maliyeti</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>₺40,00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Maliyetten satış fiyatına: gıda maliyet oranı
                        </h2>
                        <p>
                            Reçete maliyetini bulduktan sonra sıradaki soru: "Bu yemeği kaça satmalıyım?" Burada devreye
                            <strong style={{ color: '#fff' }}> gıda maliyet oranı (food cost %)</strong> giriyor. Restoran
                            sektöründe genel kabul gören oran, satış fiyatının %28-35'i arasında hammadde maliyeti
                            hedeflemektir.
                        </p>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#a3e635', marginTop: '0.75rem' }}>
                            Önerilen Satış Fiyatı = Reçete Maliyeti ÷ Hedef Gıda Maliyet Oranı
                        </div>
                        <p style={{ marginTop: '1rem' }}>
                            Örneğimizdeki ₺40 maliyetli salata için %30 hedef oran uygularsak: 40 ÷ 0,30 = ₺133,3 — yani bu
                            yemeği yaklaşık ₺135'e satmak, hedeflediğiniz kar marjını koruyacaktır.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Sık yapılan hatalar
                        </h2>
                        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <li><strong style={{ color: '#fff' }}>Fireyi hesaba katmamak:</strong> Soğan soyarken, et ayıklarken oluşan kayıp (fire), gerçek maliyeti %5-15 artırabilir. Fire oranını malzeme bazında ayrıca hesaplamak gerekir.</li>
                            <li><strong style={{ color: '#fff' }}>Eski fiyatlarla hesaplamak:</strong> Tedarikçi fiyatları değiştiğinde reçete maliyetleri otomatik güncellenmezse, aylar sonra fark edilmeyen bir kar erimesi yaşanır.</li>
                            <li><strong style={{ color: '#fff' }}>Sos ve baharatları göz ardı etmek:</strong> Tek tek küçük görünen bu kalemler, toplamda maliyetin %10'una kadar çıkabilir.</li>
                            <li><strong style={{ color: '#fff' }}>Porsiyon standardizasyonu olmaması:</strong> Aynı yemeği her seferinde farklı miktarda malzemeyle hazırlamak, maliyet hesabını anlamsız kılar.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                            Manuel mi, yazılımla mı?
                        </h2>
                        <p>
                            Az sayıda reçeteniz varsa Excel ile de bu hesabı tutabilirsiniz. Ama tedarikçi fiyatları
                            değiştikçe onlarca reçeteyi elle güncellemek, işletme büyüdükçe sürdürülebilir olmaktan çıkar.
                            GastroBrain gibi sistemlerde stok kartına girilen güncel birim fiyat, o malzemeyi kullanan tüm
                            reçetelere otomatik yansır — maliyetler her zaman güncel kalır, satış fiyatı kararlarını
                            tahmine değil veriye dayandırabilirsiniz.
                        </p>
                    </section>

                    <div style={{ background: '#18181b', border: '1px solid rgba(163,230,53,0.2)', borderRadius: '0.75rem', padding: '1.5rem', marginTop: '0.5rem' }}>
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Reçete maliyetlerinizi otomatik takip etmek ister misiniz?</p>
                        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            GastroBrain ile stok fiyatı değiştiğinde tüm reçete maliyetleriniz otomatik güncellenir.
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