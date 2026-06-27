export const metadata = {
    title: 'Gizlilik Politikası — GastroBrain',
    description: 'GastroBrain gizlilik politikası ve kişisel veri işleme hakkında bilgi.',
};

export default function GizlilikPolitikasi() {
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Gizlilik Politikası</h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '3rem' }}>Son güncelleme: Haziran 2026</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.8, color: '#d4d4d8' }}>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Genel Bilgi</h2>
                        <p>
                            GastroBrain ("biz", "hizmet") olarak kişisel verilerinizin güvenliğine önem veriyoruz.
                            Bu Gizlilik Politikası, <strong style={{ color: '#fff' }}>gastrobrain.com.tr</strong> ve
                            <strong style={{ color: '#fff' }}> app.gastrobrain.com.tr</strong> adreslerinde sunulan hizmetleri
                            kullanırken toplanan verilerin nasıl işlendiğini açıklamaktadır.
                            Hizmetimizi kullanarak bu politikayı kabul etmiş sayılırsınız.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Toplanan Veriler</h2>
                        <p style={{ marginBottom: '1rem' }}>Hizmetimizi kullanırken aşağıdaki veriler toplanabilir:</p>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><strong style={{ color: '#fff' }}>Hesap bilgileri:</strong> Ad, e-posta adresi, şifre (şifrelenmiş olarak saklanır)</li>
                            <li><strong style={{ color: '#fff' }}>Firma bilgileri:</strong> Firma adı, telefon, adres</li>
                            <li><strong style={{ color: '#fff' }}>Kullanım verileri:</strong> Uygulama içi işlemler (satış, stok, personel kayıtları)</li>
                            <li><strong style={{ color: '#fff' }}>Teknik veriler:</strong> IP adresi, tarayıcı bilgisi, oturum logları</li>
                            <li><strong style={{ color: '#fff' }}>İletişim verileri:</strong> Destek talepleriniz ve geri bildirimleriniz</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Verilerin Kullanım Amacı</h2>
                        <p style={{ marginBottom: '1rem' }}>Toplanan veriler yalnızca şu amaçlarla kullanılır:</p>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Hesabınızı oluşturmak ve yönetmek</li>
                            <li>Hizmetin işlevselliğini sağlamak ve geliştirmek</li>
                            <li>Lisans ve abonelik yönetimi</li>
                            <li>Teknik destek ve müşteri hizmetleri</li>
                            <li>Hizmet bildirimleri ve uyarı e-postaları göndermek</li>
                            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Verilerin Saklanması ve Güvenliği</h2>
                        <p style={{ marginBottom: '1rem' }}>
                            Verileriniz Supabase (PostgreSQL) altyapısında güvenli biçimde saklanmaktadır.
                            Şifreler bcrypt algoritmasıyla şifrelenerek tutulur; düz metin olarak hiçbir yerde saklanmaz.
                            Oturum güvenliği JWT token ile sağlanmaktadır.
                        </p>
                        <p>
                            Verileriniz üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.
                            Yalnızca yasal zorunluluk halinde yetkili mercilerle paylaşılabilir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Çerezler (Cookies)</h2>
                        <p>
                            Uygulama oturum yönetimi için tarayıcı <strong style={{ color: '#fff' }}>localStorage</strong> kullanmaktadır.
                            Üçüncü taraf reklam çerezi kullanılmamaktadır.
                            Hata izleme amacıyla Sentry servisi kullanılmakta olup bu servisin gizlilik politikası
                            için <a href="https://sentry.io/privacy/" target="_blank" rel="noreferrer" style={{ color: '#a3e635' }}>sentry.io/privacy</a> adresini
                            inceleyebilirsiniz.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Veri Sahibinin Hakları (KVKK)</h2>
                        <p style={{ marginBottom: '1rem' }}>
                            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:
                        </p>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                            <li>Verilerin düzeltilmesini veya silinmesini isteme</li>
                            <li>İşlemenin kısıtlanmasını talep etme</li>
                            <li>Veri taşınabilirliği hakkı</li>
                        </ul>
                        <p style={{ marginTop: '1rem' }}>
                            Bu haklarınızı kullanmak için <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a> adresine
                            e-posta gönderebilirsiniz.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Veri Saklama Süresi</h2>
                        <p>
                            Hesabınız aktif olduğu sürece verileriniz saklanır. Hesabınızı silmeniz veya aboneliğinizi
                            sonlandırmanız durumunda verileriniz 30 gün içinde kalıcı olarak silinir.
                            Yasal yükümlülükler kapsamında saklanması gereken veriler ilgili mevzuatta öngörülen
                            süre boyunca tutulur.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>8. Politika Değişiklikleri</h2>
                        <p>
                            Bu politikada yapılacak değişiklikler bu sayfada yayımlanacak ve kayıtlı e-posta
                            adresinize bildirim gönderilecektir. Değişiklikler yayımlandıktan sonra hizmeti
                            kullanmaya devam etmeniz, güncel politikayı kabul ettiğiniz anlamına gelir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>9. İletişim</h2>
                        <p>
                            Gizlilik politikamıza ilişkin sorularınız için:
                        </p>
                        <div style={{ marginTop: '0.75rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <p><strong style={{ color: '#fff' }}>Sorumlu:</strong> Yasin Alkan</p>
                            <p><strong style={{ color: '#fff' }}>E-posta:</strong> <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a></p>
                            <p><strong style={{ color: '#fff' }}>Web:</strong> <a href="https://gastrobrain.com.tr" style={{ color: '#a3e635' }}>gastrobrain.com.tr</a></p>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #27272a', padding: '2rem', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                <p>© 2026 GastroBrain — Tüm hakları saklıdır.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
                    <a href="/kullanim-kosullari" style={{ color: '#71717a', textDecoration: 'none' }}>Kullanım Koşulları</a>
                    <a href="/mesafeli-satis" style={{ color: '#71717a', textDecoration: 'none' }}>Mesafeli Satış Sözleşmesi</a>
                </div>
            </footer>
        </div>
    );
}