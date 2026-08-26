import type { Metadata } from 'next';
import HomeClient from './home-client';

// ─── SEO Metadata ──────────────────────────────────────────────────────────
// Next.js App Router: bu export sunucu tarafında render edilir, client
// component'e (HomeClient) dokunmaz. Hedef anahtar kelimeler: "restoran stok
// takip programı", "reçete maliyet hesaplama", "restoran otomasyon sistemi".
export const metadata: Metadata = {
  title: 'GastroBrain — Restoran Stok, Reçete Maliyeti ve Satış Takip Programı',
  description:
    'Restoranınız için stok takibi, reçete maliyet hesaplama, satış ve şube yönetimi tek platformda. 1 ay ücretsiz deneyin, kredi kartı gerekmez.',
  keywords: [
    'restoran stok takip programı',
    'reçete maliyet hesaplama',
    'restoran otomasyon sistemi',
    'restoran yazılımı',
    'çok şubeli restoran yönetimi',
    'restoran fire takibi',
  ],
  openGraph: {
    title: 'GastroBrain — Restoranınızı Akıllıca Yönetin',
    description:
      'Stok takibinden reçete maliyetine, satışlardan personel yönetimine — her şey tek platformda.',
    url: 'https://gastrobrain.com.tr',
    siteName: 'GastroBrain',
    locale: 'tr_TR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://gastrobrain.com.tr',
  },
};

export default function Home() {
  return <HomeClient />;
}