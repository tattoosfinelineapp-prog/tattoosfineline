'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, Search, Upload, User } from 'lucide-react'
import { useAuth } from './AuthContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { user, openAuthModal } = useAuth()

  const items = [
    { href: '/',       icon: Home,     label: 'Inicio' },
    { href: '/feed',   icon: Sparkles, label: 'Feed',  requiresAuth: true },
    { href: '/buscar', icon: Search,   label: 'Buscar' },
    { href: '/upload', icon: Upload,   label: 'Subir', requiresAuth: true },
    { href: user ? `/perfil/${user.id}` : null, icon: User, label: 'Perfil', requiresAuth: true },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111] md:hidden safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {items.map(item => {
          const isActive = item.href
            ? item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
            : false

          if (item.requiresAuth && !user) {
            return (
              <button
                key={item.label}
                onClick={() => openAuthModal('login')}
                className="flex-1 flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white transition-colors"
              >
                <item.icon size={22} strokeWidth={1.8} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          }

          if (!item.href) return null

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
