import './globals.css'

export const metadata = {
  title: 'GastroBrain — Restoran Yönetim Sistemi',
  description: 'Stok, reçete, satış, personel ve raporlamayı tek platformda yönetin. Türkiye\'nin restoranlarına özel SaaS çözümü.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}