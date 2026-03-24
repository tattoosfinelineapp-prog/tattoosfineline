import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-semibold text-gray-100 select-none mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Página no encontrada</h1>
      <p className="text-gray-400 mb-8 max-w-sm">
        La página que buscas no existe o fue eliminada.
      </p>
      <Link
        href="/galeria"
        className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-colors"
      >
        Ver galería
      </Link>
    </div>
  )
}
