import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import NavBar from '@/components/NavBar'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/components/AuthContext'
import CtaBanner from '@/components/CtaBanner'
import WelcomePopup from '@/components/WelcomePopup'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'tattoosfineline — Galería de tatuajes fine line',
  description: 'Descubre miles de tatuajes fine line. Guárdalos, organízalos y comparte los tuyos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'tattoosfineline',
    statusBarStyle: 'default',
  },
  themeColor: '#111111',
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-white font-sans antialiased">
        <AuthProvider initialSession={session}>
          <Suspense fallback={<div className="h-16 bg-white border-b border-gray-100" />}>
            <NavBar />
          </Suspense>
          <CtaBanner />
          <WelcomePopup />
          <main className="min-h-screen bg-white">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
