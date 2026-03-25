import Link from 'next/link'
import { LayoutDashboard, Image, Flag, Users, Mail } from 'lucide-react'

const NAV = [
  { href: '/admin',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/fotos',    label: 'Fotos',       icon: Image },
  { href: '/admin/reportes', label: 'Reportes',    icon: Flag },
  { href: '/admin/usuarios', label: 'Usuarios',    icon: Users },
  { href: '/admin/emails',   label: 'Emails',      icon: Mail },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">tattoosfineline</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver a la app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
