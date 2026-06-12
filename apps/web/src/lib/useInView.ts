'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

export interface InViewOptions {
  threshold?: number
  rootMargin?: string
  /** Reveal only once, then stop observing. */
  once?: boolean
}

/**
 * Returns a ref and whether the element is in the viewport.
 * Falls back to "visible" when IntersectionObserver is unavailable or the user
 * prefers reduced motion.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: InViewOptions = {},
): [RefObject<T | null>, boolean] {
  const { threshold = 0.12, rootMargin = '0px 0px -8% 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}
