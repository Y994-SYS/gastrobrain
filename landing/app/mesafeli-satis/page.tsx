export const metadata = {
    title: 'Mesafeli Satış Sözleşmesi — GastroBrain',
    description: 'GastroBrain abonelik hizmeti mesafeli satış sözleşmesi.',
};

export default function MesafeliSatis() {
    const tarih = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div style={{ background: '#09090b', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <header style={{ borderBottom: '1px solid #27272a', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="GastroBrain" style={{ height: '2rem' }} />
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#fff' }}>
                        Gastro<span style={{ color: '#a3e635' }}>BRAIN</span>
                    </span>
                </a>
                <a href="/" style={{ color: '#a1a1aa', fontSize: '0.875rem', textDecoration: 'none' }}>← Ana Sayfa</a>
            </header>

            {/* Content */}
            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Mesafeli Satış Sözleşmesi</h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '3rem' }}>Son güncelleme: Haziran 2026</p>

                {/* Taraflar kutusu */}
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <p style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '0.25rem' }}>SATICI</p>
                        <p style={{ color: '#fff', fontWeight: 600 }}>GastroBrain — Yasin Alkan</p>
                        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                            E-posta: <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a>
                        </p>
                    </div>
                    <div style={{ borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
                        <p style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '0.25rem' }}>ALICI</p>
                        <p style={{ color: '#d4d4d8' }}>Kayıt formunu dolduran ve hizmeti satın alan kişi/firma</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.8, color: '#d4d4d8' }}>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 1 — Sözleşmenin Konusu</h2>
                        <p>
                            İşbu Mesafeli Satış Sözleşmesi, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
                            Mesafeli Sözleşmeler Yönetmeliği hükümleri kapsamında, Alıcı'nın GastroBrain
                            abonelik hizmetini satın almasına ilişkin koşulları düzenler.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 2 — Hizmet Bilgileri</h2>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p><strong style={{ color: '#fff' }}>Hizmet adı:</strong> GastroBrain Restoran Yönetim Yazılımı</p>
                            <p><strong style={{ color: '#fff' }}>Hizmet türü:</strong> SaaS (Bulut tabanlı yazılım aboneliği)</p>
                            <p><strong style={{ color: '#fff' }}>Aylık plan:</strong> ₺799 + KDV / ay</p>
                            <p><strong style={{ color: '#fff' }}>Yıllık plan:</strong> ₺7.990 + KDV / yıl</p>
                            <p><strong style={{ color: '#fff' }}>Ödeme yöntemi:</strong> Havale / EFT</p>
                            <p><strong style={{ color: '#fff' }}>Deneme süresi:</strong> 30 gün ücretsiz</p>
                        </div>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 3 — Sipariş ve Ödeme</h2>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Abonelik satın alımı uygulama içindeki Abonelik sayfası üzerinden gerçekleştirilir.</li>
                            <li>Ödeme havale/EFT yöntemiyle yapılır. Açıklama kısmına firma adı yazılmalıdır.</li>
                            <li>Ödeme bildirimi <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a> adresine
                                dekont iletilerek yapılır.</li>
                            <li>Ödeme onaylandıktan sonra lisans en geç 24 saat içinde aktive edilir.</li>
                            <li>Fatura/makbuz talepleri e-posta ile iletilmelidir.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 4 — Teslimat</h2>
                        <p>
                            Hizmet dijital ortamda sunulmaktadır. Ödeme onayından itibaren en geç 24 saat
                            içinde hesabınıza erişim aktive edilir ve e-posta ile bildirim gönderilir.
                            Fiziksel bir ürün teslimatı söz konusu değildir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 5 — Cayma Hakkı</h2>
                        <p style={{ marginBottom: '1rem' }}>
                            6502 sayılı Kanun'un 49. maddesi uyarınca, dijital içerik ve hizmetlerde cayma hakkı
                            istisnası uygulanabilir. Bununla birlikte müşteri memnuniyetini ön planda tutan
                            yaklaşımımız çerçevesinde:
                        </p>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Hizmet aktivasyonundan itibaren <strong style={{ color: '#fff' }}>14 gün</strong> içinde cayma talebinde bulunabilirsiniz.</li>
                            <li>Bu süre zarfında hizmetin aktif kullanımına başlanmamış olması gerekir.</li>
                            <li>Cayma talebinizi <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a> adresine
                                yazılı olarak iletmeniz yeterlidir.</li>
                            <li>Onaylanan cayma taleplerinde ödeme 7 iş günü içinde iade edilir.</li>
                            <li>30 günlük ücretsiz deneme süresi kullanıldıysa cayma hakkı kullanılamaz.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 6 — Abonelik İptali</h2>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz.</li>
                            <li>İptal talebi için <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a> adresine
                                e-posta gönderiniz.</li>
                            <li>İptal işlemi mevcut abonelik döneminin sonunda geçerli olur; kalan süre için iade yapılmaz.</li>
                            <li>İptal sonrası verilerinize 30 gün boyunca erişebilir, dışa aktarabilirsiniz.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 7 — Gizlilik</h2>
                        <p>
                            Kişisel ve iş verilerinizin işlenmesi <a href="/gizlilik" style={{ color: '#a3e635' }}>Gizlilik Politikamız</a> kapsamında
                            yürütülmektedir. Verileriniz üçüncü taraflarla paylaşılmaz.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 8 — Uyuşmazlık Çözümü</h2>
                        <p>
                            Bu sözleşmeden doğan uyuşmazlıklarda öncelikle e-posta yoluyla dostane çözüm yoluna
                            gidilir. Çözüme kavuşturulamayan uyuşmazlıklarda İstanbul Tüketici Hakem Heyetleri
                            ve Mahkemeleri yetkilidir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Madde 9 — Yürürlük</h2>
                        <p>
                            Bu sözleşme, Alıcı'nın kayıt formunu doldurması ve ödeme işlemini gerçekleştirmesiyle
                            yürürlüğe girer. Sözleşmenin bir örneği kayıt e-postasıyla Alıcı'ya iletilir.
                            Sözleşme Türkiye Cumhuriyeti hukuku kapsamında geçerlidir.
                        </p>
                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #27272a', padding: '2rem', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                <p>© 2026 GastroBrain — Tüm hakları saklıdır.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
                    <a href="/gizlilik" style={{ color: '#71717a', textDecoration: 'none' }}>Gizlilik Politikası</a>
                    <a href="/kullanim-kosullari" style={{ color: '#71717a', textDecoration: 'none' }}>Kullanım Koşulları</a>
                </div>
            </footer>
        </div>
    );
}