// apps/web/src/app/transparency/page.tsx
import type { Metadata } from 'next'
import { Nav }                      from '@/components/shared/Nav'
import { Footer }                   from '@/components/shared/Footer'
import { PublicMetricsDashboard }   from '@/components/transparency/PublicMetricsDashboard'
import { getTransparencySnapshot } from '@/lib/api/transparency'

export const metadata: Metadata = {
  title: 'Transparency Report',
  description:
    'Aggregate platform metrics for Provora — flag rates, dispute outcomes, deletion compliance, and model drift. No personal data shown.',
}

// Re-validate once per day — public data, no auth needed
export const revalidate = 86400

export default async function TransparencyPage() {
  const snapshot = await getTransparencySnapshot()

  return (
    <>
      <Nav />

      <main>
        {/* Page header */}
        <div
          style={{
            background:    'var(--color-mahogany)',
            borderBottom:  '1px solid var(--color-cedar)',
            padding:       '48px 0 40px',
          }}
        >
          <div className="mx-auto px-6" style={{ maxWidth: 'var(--page-max)' }}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--color-amber)', fontSize: 11, letterSpacing: '0.1em' }}
                >
                  Public record
                </p>
                <h1
                  className="font-display font-bold"
                  style={{
                    fontFamily:    'var(--font-display)',
                    fontSize:      'clamp(28px, 4vw, 42px)',
                    color:         'var(--color-ivory)',
                    letterSpacing: '-0.03em',
                    lineHeight:    1.1,
                  }}
                >
                  Transparency Report
                </h1>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-sand)', fontSize: 14, maxWidth: 480 }}>
                  Aggregate integrity metrics for the Provora platform.
                  No student personal data, biometrics, or session-level detail is shown here.
                </p>
              </div>

              {/* Last updated */}
              <div className="shrink-0 text-right">
                <p className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
                  Last updated
                </p>
                <p className="font-mono text-sm" style={{ color: 'var(--color-ceramic)', fontSize: 13 }}>
                  {new Date(snapshot.metrics.lastUpdatedAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div
          className="mx-auto px-6 py-12"
          style={{ maxWidth: 'var(--page-max)' }}
        >
          <PublicMetricsDashboard snapshot={snapshot} />
        </div>
      </main>

      <Footer />
    </>
  )
}