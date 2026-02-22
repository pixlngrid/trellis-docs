import { footerConfig } from '@/config/navigation'

export function Footer() {
  return (
    <footer className="bg-[var(--primary)] text-center text-xs font-bold text-white dark:text-[var(--color-accent-teal-300)] py-1">
      {footerConfig.copyright}&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;{footerConfig.poweredBy}
    </footer>
  )
}
