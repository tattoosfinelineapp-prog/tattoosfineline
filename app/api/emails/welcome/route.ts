import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

type TipoCuenta = 'tatuador' | 'estudio' | 'inspiracion'

function getTemplate(tipo: TipoCuenta, nombre: string): { subject: string; html: string } {
  const base = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; color: #111111;">
      <div style="padding: 48px 40px;">
        <div style="font-size: 22px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 40px;">
          tattoosfineline
        </div>
  `

  const footer = `
      </div>
      <div style="border-top: 1px solid #f0f0f0; padding: 24px 40px;">
        <p style="font-size: 12px; color: #aaaaaa; margin: 0; line-height: 1.6;">
          Has recibido este email porque te registraste en tattoosfineline.com.<br>
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `

  if (tipo === 'tatuador') {
    return {
      subject: `Bienvenido, ${nombre} 🎨 — tu perfil de tatuador está listo`,
      html: `${base}
        <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.5px;">
          Hola, ${nombre}
        </h1>
        <p style="font-size: 16px; color: #555; margin: 0 0 32px; line-height: 1.6;">
          Tu cuenta de tatuador en tattoosfineline está lista. Ahora puedes subir tu trabajo y llegar a miles de personas buscando fine line.
        </p>

        <div style="background: #f8f8f8; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 14px; font-weight: 600; margin: 0 0 12px;">Qué puedes hacer ahora:</p>
          <ul style="font-size: 14px; color: #555; margin: 0; padding-left: 20px; line-height: 2;">
            <li>Subir tus tatuajes con análisis IA automático</li>
            <li>Crear carpetas por estilo o zona corporal</li>
            <li>Ver las estadísticas de tus publicaciones</li>
            <li>Que tus clientes te encuentren por nombre</li>
          </ul>
        </div>

        <a href="https://tattoosfineline.com/upload"
           style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
          Subir primera foto
        </a>
      ${footer}`,
    }
  }

  if (tipo === 'estudio') {
    return {
      subject: `${nombre} ya está en tattoosfineline 🏠`,
      html: `${base}
        <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.5px;">
          Hola, ${nombre}
        </h1>
        <p style="font-size: 16px; color: #555; margin: 0 0 32px; line-height: 1.6;">
          Tu estudio está registrado en tattoosfineline. Muestra el trabajo de todo tu equipo en un solo perfil.
        </p>

        <div style="background: #f8f8f8; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <p style="font-size: 14px; font-weight: 600; margin: 0 0 12px;">Próximos pasos:</p>
          <ul style="font-size: 14px; color: #555; margin: 0; padding-left: 20px; line-height: 2;">
            <li>Completa el perfil con dirección y web</li>
            <li>Sube los mejores trabajos del estudio</li>
            <li>Organiza por tatuador o estilo en carpetas</li>
            <li>Comparte tu perfil con clientes</li>
          </ul>
        </div>

        <a href="https://tattoosfineline.com/upload"
           style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
          Subir trabajos del estudio
        </a>
      ${footer}`,
    }
  }

  // inspiracion
  return {
    subject: `Bienvenido a tattoosfineline, ${nombre} ✨`,
    html: `${base}
      <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.5px;">
        Hola, ${nombre}
      </h1>
      <p style="font-size: 16px; color: #555; margin: 0 0 32px; line-height: 1.6;">
        Tu cuenta está lista. Explora miles de tatuajes fine line, guarda los que te inspiren y crea carpetas con tus favoritos.
      </p>

      <div style="background: #f8f8f8; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
        <p style="font-size: 14px; font-weight: 600; margin: 0 0 12px;">Te va a encantar:</p>
        <ul style="font-size: 14px; color: #555; margin: 0; padding-left: 20px; line-height: 2;">
          <li>Galería con miles de tatuajes fine line</li>
          <li>Guarda fotos en carpetas por estilo</li>
          <li>Busca por zona corporal o motivo</li>
          <li>Descubre los tatuadores más populares</li>
        </ul>
      </div>

      <a href="https://tattoosfineline.com/galeria"
         style="display: inline-block; background: #111111; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 600;">
        Explorar galería
      </a>
    ${footer}`,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, nombre, tipo_cuenta } = body
    console.log('[welcome-email] request:', { email, nombre, tipo_cuenta })

    if (!email || !tipo_cuenta) {
      console.error('[welcome-email] missing fields:', body)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[welcome-email] RESEND_API_KEY not set')
      return NextResponse.json({ error: 'No API key' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const tipo = (tipo_cuenta as TipoCuenta) ?? 'inspiracion'
    const displayName = nombre || email.split('@')[0]
    const { subject, html } = getTemplate(tipo, displayName)

    console.log('[welcome-email] sending to:', email, '| tipo:', tipo)
    const { data, error } = await resend.emails.send({
      from: 'tattoosfineline <hola@tattoosfineline.com>',
      to: email,
      subject,
      html,
    })

    if (error) {
      console.error('[welcome-email] resend error:', error)
      return NextResponse.json({ error: 'Email failed', detail: error }, { status: 500 })
    }

    console.log('[welcome-email] sent ok, id:', data?.id)
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error('[welcome-email] exception:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
