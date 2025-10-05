import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import BottomNav from './components/mobile/BottomNav'
import SplashScreen from './components/mobile/SplashScreen'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DaycareConnect - Find Quality Childcare',
  description: 'Professional childcare booking platform connecting parents with trusted daycare providers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DaycareConnect',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full overflow-x-hidden`}>
        <SplashScreen />
        <AuthProvider>
          <div className="flex flex-col h-full">
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              {children}
            </main>
            <div className="md:hidden">
              <BottomNav />
            </div>
          </div>
          <PWAInstallPrompt />
          <OfflineIndicator />
        </AuthProvider>
      </body>
    </html>
  )
}