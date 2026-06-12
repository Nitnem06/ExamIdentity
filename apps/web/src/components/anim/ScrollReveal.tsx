'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SELECTOR = '.reveal, .reveal-left, .reveal-right, .reveal-pop'

/**
 * Site-wide scroll-reveal. Observes every element carrying a reveal class and
 * adds `.is-inview` when it scrolls into view (cross-browser, no per-element
 * wiring). Re-scans on route change. Reduced-motion safe.
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    let observer: IntersectionObserver | undefined

    // Defer to the next frame so freshly-navigated DOM is present.
    const raf = requestAnimationFrame(() => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))

      const prefersReduced = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (prefersReduced || typeof IntersectionObserver === 'undefined') {
        els.forEach((el) => el.classList.add('is-inview'))
        return
      }

      observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-inview')
              obs.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )

      els.forEach((el) => {
        if (!el.classList.contains('is-inview')) observer!.observe(el)
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
