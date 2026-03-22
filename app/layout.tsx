import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Tattoos Fine Line - Galería de tatuajes',
  description: 'Descubre los mejores tatuajes fine line. Galería curada con miles de diseños por zona, motivo y tamaño.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-white font-sans antialiased">
        <NavBar />
        <main className="min-h-screen bg-white">
          {children}
        </main>
      </body>
    </html>
  )
}
