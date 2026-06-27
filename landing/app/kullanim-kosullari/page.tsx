export const metadata = {
    title: 'Kullanım Koşulları — GastroBrain',
    description: 'GastroBrain hizmet kullanım koşulları.',
};

export default function KullanimKosullari() {
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
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Kullanım Koşulları</h1>
                <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '3rem' }}>Son güncelleme: Haziran 2026</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.8, color: '#d4d4d8' }}>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>1. Kabul</h2>
                        <p>
                            Bu Kullanım Koşulları, GastroBrain tarafından sunulan restoran yönetim yazılımı hizmetini
                            ("Hizmet") kullanımınızı düzenler. Hizmete erişerek veya kullanarak bu koşulları kabul
                            etmiş sayılırsınız. Kabul etmiyorsanız hizmeti kullanmayınız.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>2. Hizmet Tanımı</h2>
                        <p>
                            GastroBrain; restoran, kafe ve gıda işletmelerine yönelik bulut tabanlı bir yönetim
                            yazılımıdır. Stok takibi, satış yönetimi, reçete maliyetlendirme, personel ve cari
                            hesap modüllerini kapsar. Hizmet SaaS (Software as a Service) modeliyle sunulmaktadır.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>3. Hesap ve Güvenlik</h2>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Hesap açmak için doğru ve güncel bilgi sağlamakla yükümlüsünüz.</li>
                            <li>Hesabınızın güvenliğinden siz sorumlusunuz; şifrenizi kimseyle paylaşmayınız.</li>
                            <li>Her firma için ayrı hesap oluşturulmalıdır.</li>
                            <li>Yetkisiz erişim tespit edildiğinde derhal <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}>info@gastrobrain.com.tr</a> adresini bilgilendirin.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>4. Lisans ve Abonelik</h2>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Kayıt sonrası 30 günlük ücretsiz deneme süresi tanınır.</li>
                            <li>Deneme süresi sonunda ücretli aboneliğe geçilmediği takdirde erişim askıya alınır.</li>
                            <li>Abonelik planları ve fiyatlar <a href="/abonelik" style={{ color: '#a3e635' }}>abonelik sayfasında</a> belirtilmiştir.</li>
                            <li>Ödeme havale/EFT yöntemiyle yapılır; ödeme onaylandıktan sonra lisans aktive edilir.</li>
                            <li>Lisans süresi dolmadan 7 gün ve 3 gün önce e-posta bildirimi gönderilir.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>5. Yasaklı Kullanımlar</h2>
                        <p style={{ marginBottom: '1rem' }}>Aşağıdaki eylemler kesinlikle yasaktır:</p>
                        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>Sistemi tersine mühendislik, kopyalama veya dağıtma girişimi</li>
                            <li>Başka kullanıcıların hesaplarına veya verilerine yetkisiz erişim</li>
                            <li>Sisteme zarar verici yazılım, script veya bot kullanımı</li>
                            <li>Yasadışı amaçlarla kullanım</li>
                            <li>Hizmeti yeniden satmak veya lisanslamak</li>
                        </ul>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>6. Veri Sahipliği</h2>
                        <p>
                            Sisteme girdiğiniz tüm iş verileri (stok, satış, personel, cari kayıtlar) size aittir.
                            GastroBrain bu verileri üçüncü taraflarla paylaşmaz veya ticari amaçla kullanmaz.
                            Aboneliğinizi sonlandırmanız durumunda verilerinizi dışa aktarmanız için 30 günlük
                            süre tanınır.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>7. Hizmet Sürekliliği</h2>
                        <p>
                            Hizmetin kesintisiz çalışması için azami özen gösterilmektedir. Ancak planlı bakım,
                            teknik arıza veya mücbir sebeplerden kaynaklanan kesintilerden sorumluluk kabul
                            edilmez. Planlı bakım öncesinde kullanıcılar bilgilendirilir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>8. Sorumluluk Sınırı</h2>
                        <p>
                            GastroBrain, hizmetin kullanımından doğan dolaylı, tesadüfi veya özel zararlardan
                            sorumlu tutulamaz. Hizmetin toplam sorumluluğu, son 3 ay içinde ödenen abonelik
                            ücreti ile sınırlıdır. Yazılım "olduğu gibi" sunulmaktadır; belirli bir amaca
                            uygunluk garantisi verilmez.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>9. Hesap Feshi</h2>
                        <p>
                            Kullanım koşullarının ihlali halinde hesabınız önceden bildirim yapılmaksızın
                            askıya alınabilir veya kapatılabilir. Hesabınızı kendiniz kapatmak isterseniz
                            <a href="mailto:info@gastrobrain.com.tr" style={{ color: '#a3e635' }}> info@gastrobrain.com.tr</a> adresine
                            talep iletebilirsiniz.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>10. Uygulanacak Hukuk</h2>
                        <p>
                            Bu koşullar Türkiye Cumhuriyeti hukuku kapsamında yorumlanır ve uygulanır.
                            Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>11. Değişiklikler</h2>
                        <p>
                            Bu koşullar zaman zaman güncellenebilir. Önemli değişiklikler e-posta ile bildirilir.
                            Güncel koşullar her zaman bu sayfada yayımlanır.
                        </p>
                    </section>

                    <section>
                        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>12. İletişim</h2>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    <a href="/gizlilik" style={{ color: '#71717a', textDecoration: 'none' }}>Gizlilik Politikası</a>
                    <a href="/mesafeli-satis" style={{ color: '#71717a', textDecoration: 'none' }}>Mesafeli Satış Sözleşmesi</a>
                </div>
            </footer>
        </div>
    );
}