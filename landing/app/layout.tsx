import { Inter, Syne } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: 'GastroBrain — Restoran Yönetim Sistemi',
  description: 'Stok, reçete, satış, personel ve raporlamayı tek platformda yönetin. Türkiye\'nin restoranlarına özel SaaS çözümü.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${inter.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  )
}