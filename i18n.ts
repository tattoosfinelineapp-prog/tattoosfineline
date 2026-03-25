import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('locale')?.value
  const acceptLang = headers().get('Accept-Language') ?? ''

  let locale: string
  if (cookieLocale === 'en' || cookieLocale === 'es') {
    locale = cookieLocale
  } else {
    // Detect from Accept-Language — default to 'es', switch to 'en' if browser prefers English
    locale = /^en\b/i.test(acceptLang) ? 'en' : 'es'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
