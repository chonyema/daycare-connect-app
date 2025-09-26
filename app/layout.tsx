import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from './contexts/AuthContext'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'

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
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <PWAInstallPrompt />
          <OfflineIndicator />
        </AuthProvider>
      </body>
    </html>
  )
}