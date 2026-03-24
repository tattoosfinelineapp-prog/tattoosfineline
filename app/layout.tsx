import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import NavBar from '@/components/NavBar'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/components/AuthContext'
import CtaBanner from '@/components/CtaBanner'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Tattoos Fine Line — Galería de tatuajes',
  description: 'Descubre miles de tatuajes fine line. Guárdalos, organízalos y comparte los tuyos.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="es">
      <body className="bg-white font-sans antialiased">
        <AuthProvider initialSession={session}>
            <Suspense fallback={<div className="h-16 bg-white border-b border-gray-100" />}>
              <NavBar />
            </Suspense>
            <CtaBanner />
            <main className="min-h-screen bg-white">
              {children}
            </main>
            <BottomNav />
        </AuthProvider>
      </body>
    </html>
  )
}
