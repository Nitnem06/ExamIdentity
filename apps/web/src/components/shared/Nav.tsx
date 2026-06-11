// apps/web/src/components/shared/Nav.tsx
"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',              label: 'Platform'     },
  { href: '/transparency',  label: 'Transparency' },
]

/** Amber wax-seal SVG mark */
function SealMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="var(--color-amber-surface)" stroke="var(--color-amber-dim)" strokeWidth="1" />
      <path
        d="M14 6 L17.5 12 L22 13.5 L18 17.5 L18.5 22 L14 19.5 L9.5 22 L10 17.5 L6 13.5 L10.5 12 Z"
        fill="var(--color-amber)"
        fillRule="evenodd"
      />
    </svg>
  )
}

export function Nav() {
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background:    'var(--color-mahogany)',
        borderBottom:  '1px solid var(--color-cedar)',
        backdropFilter: 'blur(8px)',
        height:        'var(--nav-height)',
      }}
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-6"
        style={{ maxWidth: 'var(--page-max)' }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="ExamIdentity home"
        >
          <SealMark />
          <span
            className="font-display font-bold tracking-tight"
            style={{
              fontFamily:  'var(--font-display)',
              fontSize:    17,
              color:       'var(--color-ivory)',
              letterSpacing: '-0.03em',
            }}
          >
            Exam<span style={{ color: 'var(--color-amber)' }}>Identity</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
                style={{
                  fontSize:  14,
                  fontWeight: 500,
                  color:      active ? 'var(--color-amber-glow)' : 'var(--color-ceramic)',
                  background: active ? 'var(--color-amber-surface)' : 'transparent',
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <Link
            href="/wallet/export/demo"
            className="btn-ghost hidden sm:inline-flex"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            My Wallet
          </Link>
          <Link
            href="#get-started"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  )
}