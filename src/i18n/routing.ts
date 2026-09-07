import { defineRouting } from 'next-intl/routing'

// English is the default; Spanish is a first-class locale, not an afterthought.
// The initial market is Los Angeles, so both must be complete.
export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
})

export type Locale = (typeof routing.locales)[number]
