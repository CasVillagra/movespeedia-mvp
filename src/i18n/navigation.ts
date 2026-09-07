import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Use these instead of next/link and next/navigation so locale is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
