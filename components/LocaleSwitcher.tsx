'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggle = async () => {
    const next = locale === 'es' ? 'en' : 'es'
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    })
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-40"
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {locale === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
