import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/foto/', '/galeria', '/tendencias', '/buscar', '/mapa', '/buscar-artista'],
      disallow: ['/admin', '/api', '/mensajes', '/perfil/editar', '/upload', '/onboarding', '/auth'],
    },
    sitemap: 'https://tattoosfineline.com/sitemap.xml',
  }
}
