// apps/web/src/components/transparency/PublicMetricsDashboard.tsx
import type { TransparencySnapshot } from '@/types/transparency'
import { PublicMetricCard }              from './PublicMetricCard'
import { FlagRateByCategoryChart }       from './FlagRateByCategoryChart'
import { DisputeOutcomesChart }          from './DisputeOutcomesChart'
import { DeletionCompliancePanel }       from './DeletionCompliancePanel'
import { ModelDriftPanel }               from './ModelDriftPanel'
import { TransparencyLogHealthPanel }    from './TransparencyLogHealthPanel'

interface PublicMetricsDashboardProps {
  snapshot: TransparencySnapshot
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2
        className="font-display font-bold"
        style={{ color: 'var(--color-ivory)', fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--color-taupe)', fontSize: 13 }}>
          {description}
        </p>
      )}
    </div>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-card p-6"
      style={{ background: 'var(--color-walnut)', border: '1px solid var(--color-cedar)' }}
    >
      <p
        className="font-semibold mb-4"
        style={{ color: 'var(--color-ivory)', fontSize: 15, letterSpacing: '-0.01em' }}
      >
        {title}
      </p>
      {children}
    </div>
  )
}

export function PublicMetricsDashboard({ snapshot }: PublicMetricsDashboardProps) {
  const { metrics, flagRateByCategory, disputeOutcomes, deletionCompliance, modelDrift, logDetail } = snapshot

  const disputeRate = metrics.disputesFiled > 0
    ? ((metrics.disputesOverturned / metrics.disputesFiled) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-12">

      {/* ── Top KPIs ──────────────────────────────────────────── */}
      <section className="reveal">
        <SectionHeader
          title="Platform activity"
          description={`Snapshot: ${new Date(metrics.snapshotPeriod.from).toLocaleDateString()} – ${new Date(metrics.snapshotPeriod.to).toLocaleDateString()}`}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <PublicMetricCard
            label="Exams protected"
            value={metrics.totalExamsProtected}
            accent="amber"
            size="lg"
            description="Sessions with active integrity monitoring"
          />
          <PublicMetricCard
            label="Credentials issued"
            value={metrics.credentialsIssued}
            accent="sage"
            size="lg"
            description="W3C Verifiable Credentials signed and delivered"
          />
          <PublicMetricCard
            label="Overall flag rate"
            value={metrics.flagRate}
            unit="%"
            accent="neutral"
            description="Sessions with ≥1 integrity flag"
            trend={{ direction: 'down', label: '1.2% vs last period' }}
          />
          <PublicMetricCard
            label="Accommodations"
            value={metrics.accommodationAdjustedSessions}
            accent="slate"
            description="Sessions with adjusted thresholds"
          />
        </div>
      </section>

      {/* ── Disputes ──────────────────────────────────────────── */}
      <section className="reveal">
        <SectionHeader
          title="Dispute outcomes"
          description="Students have the right to dispute any flag. These are the results."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          <PublicMetricCard label="Disputes filed"         value={metrics.disputesFiled}              accent="neutral" />
          <PublicMetricCard label="Auto-resolved"          value={metrics.disputesAutoResolved}        accent="slate"   />
          <PublicMetricCard label="Overturned"             value={metrics.disputesOverturned}          accent="sage"    description="Flags removed after review" />
          <PublicMetricCard label="Overturn rate"          value={`${disputeRate}%`}                   accent="amber"   />
        </div>
        <Panel title="Monthly dispute outcomes (last 9 months)">
          <DisputeOutcomesChart data={disputeOutcomes} />
        </Panel>
      </section>

      {/* ── Flag rates + deletion ─────────────────────────────── */}
      <section className="reveal">
        <SectionHeader
          title="Flag rates and evidence handling"
          description="Aggregate rates only — no personal data is shown."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Flag rate by category">
            <FlagRateByCategoryChart data={flagRateByCategory} />
          </Panel>
          <Panel title="90-day evidence deletion compliance">
            <DeletionCompliancePanel
              records={deletionCompliance}
              overallRate={metrics.evidenceDeletionComplianceRate}
            />
          </Panel>
        </div>
      </section>

      {/* ── System health ─────────────────────────────────────── */}
      <section className="reveal">
        <SectionHeader
          title="System health"
          description="Model drift and transparency log integrity — updated daily."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Model drift monitoring">
            <ModelDriftPanel drift={modelDrift} />
          </Panel>
          <Panel title="Transparency log health">
            <TransparencyLogHealthPanel log={logDetail} />
          </Panel>
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────── */}
      <div
        className="rounded-card px-5 py-4 text-xs leading-relaxed"
        style={{
          background: 'var(--color-mahogany)',
          border: '1px solid var(--color-cedar)',
          color: 'var(--color-taupe)',
          fontSize: 12,
        }}
      >
        All metrics are aggregate and anonymised. No student personal data, biometrics, or individual
        session data is present on this page. Last updated{' '}
        <span style={{ color: 'var(--color-ceramic)' }}>
          {new Date(metrics.lastUpdatedAt).toLocaleString()}
        </span>.
        Data is refreshed every 24 hours. For audit enquiries, contact{' '}
        <a
          href="mailto:transparency@provora.app"
          style={{ color: 'var(--color-amber)', textDecoration: 'underline' }}
        >
          transparency@provora.app
        </a>.
      </div>
    </div>
  )
}