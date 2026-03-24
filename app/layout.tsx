import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { AuthProvider } from '@/components/AuthContext'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Tattoos Fine Line - Galería de tatuajes',
  description: 'Descubre los mejores tatuajes fine line. Galería curada con miles de diseños por zona, motivo y tamaño.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="es">
      <body className="bg-white font-sans antialiased">
        <AuthProvider initialSession={session}>
          <NavBar />
          <main className="min-h-screen bg-white">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
