# PROYECTO: tattoosfineline.com

## Stack
- Frontend: Next.js 14 + Tailwind CSS
- Base de datos: Supabase
- Deploy: Vercel
- IA: Claude Vision API (claude-sonnet-4-20250514)
- Autenticación: Supabase Auth

## Reglas de desarrollo
- Diseño blanco y limpio, tipografía DM Sans
- NUNCA diseño oscuro
- NUNCA comentarios en las fotos
- Las API keys NUNCA van en el frontend, siempre en .env.local
- Español como idioma principal de la interfaz

## Estructura de la app
- Galería masonry tipo Pinterest
- Filtros: motivo, zona corporal, tamaño
- Buscador en tiempo real
- Likes y guardados (sin comentarios)
- Usuarios: registro, carpetas, perfiles
- Tatuadores: perfil propio, subida de fotos
- Tagger IA automático con panel de revisión manual

## Base de datos (Supabase)
Tablas principales:
- photos: id, url, title, alt_text, description, tags, motivo, zona, tamaño, confidence, status (published/pending/review), tatuador_id, likes, created_at
- users: id, email, nombre, tipo (cliente/tatuador), avatar
- saves: id, user_id, photo_id, carpeta
- carpetas: id, user_id, nombre

## Tagger IA — 3 niveles
- confidence >= 0.85 → publica automáticamente
- confidence 0.60-0.84 → va a pendientes
- confidence < 0.60 → revisión manual
- No es tatuaje → rechaza con error
- Foto oscura o borrosa → revisión manual

## SEO
- Cada foto tiene URL propia: /tattoo/[id]-[slug]
- Alt text optimizado para Google Imágenes
- Sitemap automático

## Dominio
- tattoosfineline.com (Hostinger)
- Deploy en Vercel
