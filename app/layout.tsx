import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
})

const TITULO_PADRAO = 'Quitutes — Pedidos de Café da Manhã'
const DESCRICAO_PADRAO = 'Pedidos de cesta de café da manhã das pousadas de Ibitipoca, direto para o grupo do WhatsApp.'

export const metadata: Metadata = {
  metadataBase: new URL('https://quitutes-beth.vercel.app'),
  title: TITULO_PADRAO,
  description: DESCRICAO_PADRAO,
  generator: 'v0.app',
  // Sem isso, "Adicionar à Tela de Início" no iPhone criava só um atalho — a página abria
  // dentro do Safari em vez de rodar como app instalado, e o iOS só libera a Push API
  // (Notification/PushManager) para um app de verdade instalado assim.
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Quitutes',
  },
  // Next só gera a meta tag "mobile-web-app-capable" (padrão mais novo). O iOS mais antigo
  // (16.4 a 17.3) só reconhece a versão com o prefixo "apple-", então mantemos as duas.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: TITULO_PADRAO,
    description: DESCRICAO_PADRAO,
    siteName: 'Quitutes',
    locale: 'pt_BR',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quitutes — Pedidos de Café da Manhã' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO_PADRAO,
    description: DESCRICAO_PADRAO,
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`light bg-background ${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
