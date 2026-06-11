"use client";

import Link from 'next/link'

const LINKS = {
  Platform: [
    { href: '/',                    label: 'Overview'        },
    { href: '/transparency',        label: 'Transparency'    },
    { href: '/wallet/export/demo',  label: 'Student Wallet'  },
  ],
  Trust: [
    { href: '/transparency',         label: 'Public Metrics'  },
    { href: '/docs/data-model',      label: 'Data Model'      },
    { href: '/docs/dispute-process', label: 'Dispute Process' },
  ],
  Developers: [
    { href: '/docs/api',             label: 'API Reference'   },
    { href: '/docs/did-spec',        label: 'DID / VC Spec'   },
    { href: '/docs/open-source',     label: 'Open Source'     },
  ],
  Legal: [
    { href: '/privacy',              label: 'Privacy Policy'  },
    { href: '/terms',                label: 'Terms of Use'    },
    { href: '/gdpr',                 label: 'GDPR'            },
  ],
}

export function Footer() {
  return (
    <footer
      style={{
        background:   'var(--color-espresso)',
        borderTop:    '1px solid var(--color-cedar)',
      }}
    >
      {/* Link grid */}
      <div
        className="mx-auto px-6 py-12 grid grid-cols-2 gap-8 sm:grid-cols-4"
        style={{ maxWidth: 'var(--page-max)' }}
      >
        {Object.entries(LINKS).map(([section, links]) => (
          <div key={section}>
            <p
              className="font-semibold mb-4 uppercase tracking-wider"
              style={{ color: 'var(--color-ceramic)', fontSize: 11, letterSpacing: '0.08em' }}
            >
              {section}
            </p>
            <ul className="space-y-2.5">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-150"
                    style={{ color: 'var(--color-taupe)', fontSize: 13 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ceramic)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-taupe)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Brand stamp row */}
      <div
        className="mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ maxWidth: 'var(--page-max)', borderTop: '1px solid var(--color-cedar)' }}
      >
        <p
          className="font-display font-bold tracking-tight select-none"
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      32,
            color:         'var(--color-cedar)',
            letterSpacing: '-0.04em',
          }}
        >
          Exam<span style={{ color: 'var(--color-amber-dim)' }}>Identity</span>
        </p>

        <div className="text-center sm:text-right space-y-1">
          <p className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
            Self-sovereign exam integrity. Students own their data.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
            © {new Date().getFullYear()} ExamIdentity. Built on W3C DID & Verifiable Credentials.
          </p>
        </div>
      </div>
    </footer>
  )
}