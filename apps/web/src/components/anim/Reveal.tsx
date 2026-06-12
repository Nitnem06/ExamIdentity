'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '@/lib/useInView'

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'pop' | 'fade'

const OFFSETS: Record<RevealVariant, string> = {
  up: 'translateY(30px)',
  down: 'translateY(-30px)',
  left: 'translateX(-36px)',
  right: 'translateX(36px)',
  pop: 'translateY(20px) scale(0.96)',
  fade: 'none',
}

interface RevealProps {
  children: ReactNode
  variant?: RevealVariant
  /** Delay in ms (use with index for stagger, e.g. delay={i * 90}). */
  delay?: number
  /** Animation duration in ms. */
  duration?: number
  className?: string
  style?: CSSProperties
  /** Re-trigger every time it enters view (default: animate once). */
  repeat?: boolean
}

/**
 * Scroll-reveal wrapper. Animates its children into place when scrolled into
 * view using IntersectionObserver. Cross-browser and reduced-motion safe.
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  duration = 720,
  className,
  style,
  repeat = false,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: !repeat })

  const animatedStyle: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'none' : OFFSETS[variant],
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
    ...style,
  }

  return (
    <div ref={ref} className={className} style={animatedStyle}>
      {children}
    </div>
  )
}
