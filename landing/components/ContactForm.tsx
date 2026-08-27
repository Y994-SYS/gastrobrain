'use client';

import { useState } from 'react';

// GastroBrain backend'i farklı bir subdomain'de (app.gastrobrain.com.tr)
// çalıştığı için bu, cross-origin bir istek. Backend'de CORS ayarının
// gastrobrain.com.tr origin'ine izin verdiğinden emin ol.
const ILETISIM_API_URL = 'https://app.gastrobrain.com.tr/api/iletisim';

type Durum = 'bekliyor' | 'gonderiliyor' | 'basarili' | 'hata';

export default function ContactForm() {
    const [form, setForm] = useState({ ad: '', email: '', telefon: '', mesaj: '' });
    const [durum, setDurum] = useState<Durum>('bekliyor');
    const [hataMesaji, setHataMesaji] = useState('');

    const gonder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (durum === 'gonderiliyor') return;

        setDurum('gonderiliyor');
        setHataMesaji('');

        try {
            const res = await fetch(ILETISIM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setHataMesaji(data.hata || 'Bir şeyler ters gitti, lütfen tekrar deneyin.');
                setDurum('hata');
                return;
            }

            setDurum('basarili');
            setForm({ ad: '', email: '', telefon: '', mesaj: '' });
        } catch (err) {
            setHataMesaji('Bağlantı hatası — lütfen tekrar deneyin veya doğrudan email atın.');
            setDurum('hata');
        }
    };

    if (durum === 'basarili') {
        return (
            <div className="contact-form-success">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.5rem' }}>Mesajınız gönderildi</h3>
                <p style={{ color: '#71717a', fontSize: '0.9rem' }}>En kısa sürede size dönüş yapacağız.</p>
                <button
                    onClick={() => setDurum('bekliyor')}
                    style={{
                        marginTop: '1.25rem', background: 'none', border: '1px solid #3f3f46',
                        color: '#a1a1aa', padding: '0.5rem 1.25rem', borderRadius: 8,
                        fontSize: '0.85rem', cursor: 'pointer',
                    }}
                >
                    Yeni mesaj gönder
                </button>

                <style>{`
          .contact-form-success {
            background: #18181b; border: 1px solid #27272a; border-radius: 16px;
            padding: 2.5rem; text-align: center; max-width: 500px; margin: 0 auto;
          }
        `}</style>
            </div>
        );
    }

    return (
        <form onSubmit={gonder} className="contact-form">
            <div className="contact-form-row">
                <div className="contact-form-field">
                    <label>İsim *</label>
                    <input
                        type="text"
                        required
                        maxLength={200}
                        value={form.ad}
                        onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                        placeholder="Adınız Soyadınız"
                    />
                </div>
                <div className="contact-form-field">
                    <label>Telefon</label>
                    <input
                        type="tel"
                        maxLength={50}
                        value={form.telefon}
                        onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))}
                        placeholder="05XX XXX XX XX"
                    />
                </div>
            </div>

            <div className="contact-form-field">
                <label>E-posta *</label>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ornek@restoran.com"
                />
            </div>

            <div className="contact-form-field">
                <label>Mesajınız *</label>
                <textarea
                    required
                    maxLength={5000}
                    rows={4}
                    value={form.mesaj}
                    onChange={e => setForm(f => ({ ...f, mesaj: e.target.value }))}
                    placeholder="Restoranınız hakkında birkaç detay ve nasıl yardımcı olabileceğimizi yazın..."
                />
            </div>

            {durum === 'hata' && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '-0.5rem' }}>{hataMesaji}</p>
            )}

            <button type="submit" disabled={durum === 'gonderiliyor'} className="contact-form-submit">
                {durum === 'gonderiliyor' ? 'Gönderiliyor...' : 'Mesaj Gönder'}
            </button>

            <style>{`
        .contact-form {
          background: #18181b; border: 1px solid #27272a; border-radius: 16px;
          padding: 2rem; max-width: 560px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 1.1rem;
        }
        .contact-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
        @media (max-width: 480px) { .contact-form-row { grid-template-columns: 1fr; } }
        .contact-form-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .contact-form-field label { font-size: 0.8rem; color: #a1a1aa; font-weight: 600; }
        .contact-form-field input, .contact-form-field textarea {
          background: #09090b; border: 1px solid #3f3f46; border-radius: 10px;
          padding: 0.7rem 0.9rem; color: #fff; font-size: 0.9rem; font-family: inherit;
          outline: none; transition: border-color 0.2s; resize: vertical;
        }
        .contact-form-field input:focus, .contact-form-field textarea:focus { border-color: #a3e635; }
        .contact-form-submit {
          background: #a3e635; color: #000; font-weight: 700; font-size: 0.95rem;
          padding: 0.85rem; border-radius: 10px; border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .contact-form-submit:hover { background: #bef264; }
        .contact-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
        </form>
    );
}