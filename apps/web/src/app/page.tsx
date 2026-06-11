"use client";

import Link from 'next/link'
import { Nav }                  from '@/components/shared/Nav'
import { Footer }               from '@/components/shared/Footer'
import { ExplainableFlagCard }  from '@/components/exam/ExplainableFlagCard'
import { FlagEvidenceTimeline } from '@/components/exam/FlagEvidenceTimeline'
import type { ExplainableFlag, FlagExplanationResponse } from '@/types/explanations'

// ── Demo data for the landing page previews ─────────────────────

const NOW = Date.now()

const DEMO_FLAGS: ExplainableFlag[] = [
  {
    id:          'flag-001',
    sessionId:   'session-demo',
    type:        'gaze_deviation',
    severity:    'medium',
    timeRange:   { start: NOW - 2_400_000, end: NOW - 2_392_000 },
    observedValue:   '34°',
    baselineValue:   '8°',
    policyThreshold: '20°',
    adjustedThreshold: '20°',
    accommodation:   { applied: false },
    confidence:      0.82,
    explanation:
      'Your gaze moved significantly outside the expected focal zone for 8 seconds. The model observed a mean deviation of 34° from screen centre, compared to your personal baseline of 8°. This occurred once during the session.',
    recommendedAction: 'note_for_review',
    evidenceHashes:    ['sha256:a1b2c3d4e5f6…'],
    createdAt:         new Date(NOW - 2_392_000).toISOString(),
  },
  {
    id:          'flag-002',
    sessionId:   'session-demo',
    type:        'audio_anomaly',
    severity:    'low',
    timeRange:   { start: NOW - 1_800_000, end: NOW - 1_796_000 },
    observedValue:   '68 dB',
    baselineValue:   '22 dB',
    policyThreshold: '55 dB',
    adjustedThreshold: '65 dB',
    accommodation:   { applied: true, type: 'Noise-Tolerant Environment', description: 'Threshold raised by 10 dB due to approved accommodation for noisy environment.', adjustmentFactor: 1.18 },
    confidence:      0.64,
    explanation:
      'A brief audio spike was detected. Because you have an approved noise-tolerant environment accommodation, the policy threshold was raised to 65 dB — the observed 68 dB marginally exceeded this adjusted threshold.',
    recommendedAction: 'auto_resolved',
    evidenceHashes:    ['sha256:b2c3d4e5f6a1…'],
    createdAt:         new Date(NOW - 1_796_000).toISOString(),
  },
]

const DEMO_SESSION: FlagExplanationResponse = {
  sessionId:       'session-demo',
  studentDid:      'did:key:z6Mkj8…',
  examId:          'exam-calc-101',
  examTitle:       'Calculus I — Midterm Exam',
  institutionName: 'University of Delhi',
  sessionDate:     new Date(NOW - 2_400_000).toISOString(),
  flags:           DEMO_FLAGS,
  totalFlags:      2,
  highSeverityCount: 0,
  reviewStatus:    'pending',
}

// ── Page sections ────────────────────────────────────────────────

function FeatureTag({ text }: { text: string }) {
  return (
    <span
      className="badge badge-neutral"
      style={{ fontSize: 10, padding: '3px 10px', letterSpacing: '0.06em' }}
    >
      {text}
    </span>
  )
}

function SectionDivider() {
  return (
    <div
      className="w-full"
      style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--color-cedar) 30%, var(--color-cedar) 70%, transparent)' }}
    />
  )
}

export default function HomePage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        style={{
          background:    'var(--color-dark-roast)',
          paddingTop:    96,
          paddingBottom: 96,
        }}
      >
        <div
          className="mx-auto px-6"
          style={{ maxWidth: 'var(--page-max)' }}
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className="inline-block rounded-full"
              style={{ width: 6, height: 6, background: 'var(--color-amber)', animation: 'pulse-amber 2s ease-in-out infinite' }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-amber)', fontSize: 11, letterSpacing: '0.1em' }}
            >
              Open-standard exam integrity
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold mb-6"
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(40px, 6vw, 72px)',
              color:         'var(--color-ivory)',
              letterSpacing: '-0.03em',
              lineHeight:    1.05,
              maxWidth:      680,
            }}
          >
            Students own their{' '}
            <span style={{ color: 'var(--color-amber)' }}>identity.</span>
            <br />
            Evidence stays{' '}
            <span style={{ color: 'var(--color-ceramic)' }}>in escrow.</span>
          </h1>

          {/* Sub */}
          <p
            className="mb-8 leading-relaxed"
            style={{ color: 'var(--color-sand)', fontSize: 18, maxWidth: 520 }}
          >
            ExamIdentity replaces black-box proctoring with an open system.
            You see every flag, you own every credential, and the evidence
            that affects your grade is never held by the institution alone.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="#features" className="btn-primary" style={{ padding: '12px 24px', fontSize: 15 }}>
              See how it works
            </Link>
            <Link href="/transparency" className="btn-ghost" style={{ padding: '12px 24px', fontSize: 15 }}>
              Public transparency report →
            </Link>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center gap-5 mt-10 pt-8" style={{ borderTop: '1px solid var(--color-cedar)' }}>
            {[
              'W3C Verifiable Credentials',
              'did:key identity',
              'Ed25519 signatures',
              'GDPR Article 17 compliant',
              '90-day evidence retention',
            ].map((t) => (
              <span key={t} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-taupe)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-amber-dim)' }}>◆</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Data ownership model ──────────────────────────────── */}
      <section style={{ background: 'var(--color-mahogany)', padding: '80px 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 'var(--page-max)' }}>
          <p className="label mb-3">Three domains, zero ambiguity</p>
          <h2
            className="font-display font-bold mb-10"
            style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--color-ivory)', letterSpacing: '-0.02em', maxWidth: 500 }}
          >
            Who owns what — and why it matters
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label:    'Category A — Student data',
                owner:    'You',
                examples: ['DID + key material', 'Biometric baseline', 'Exam wallet', 'Credential history'],
                color:    'var(--color-amber)',
                bg:       'var(--color-amber-surface)',
                border:   'color-mix(in srgb, var(--color-amber) 20%, transparent)',
              },
              {
                label:    'Category B — Integrity evidence',
                owner:    'Neutral escrow',
                examples: ['Behavioural vectors', 'Flag evidence', 'Session traces', 'Dual-key encrypted'],
                color:    'var(--color-slate-blue)',
                bg:       'var(--color-slate-dim)',
                border:   'color-mix(in srgb, var(--color-slate-blue) 20%, transparent)',
                note:     'Deleted after 90 days',
              },
              {
                label:    'Category C — Institutional data',
                owner:    'Institution',
                examples: ['Exam configuration', 'Academic thresholds', 'Session report', 'Grade decisions'],
                color:    'var(--color-ceramic)',
                bg:       'var(--color-walnut)',
                border:   'var(--color-cedar)',
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className="rounded-card p-5"
                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
              >
                <p className="text-2xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-taupe)', fontSize: 10, letterSpacing: '0.06em' }}>
                  {cat.label}
                </p>
                <p className="font-display font-bold mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: cat.color, letterSpacing: '-0.02em' }}>
                  Owned by {cat.owner}
                </p>
                <ul className="space-y-1.5">
                  {cat.examples.map((ex) => (
                    <li key={ex} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-parchment)', fontSize: 12 }}>
                      <span style={{ color: cat.color, marginTop: 2 }}>·</span>
                      {ex}
                    </li>
                  ))}
                </ul>
                {cat.note && (
                  <p className="mt-3 text-xs" style={{ color: 'var(--color-amber)', fontSize: 11 }}>
                    ⏱ {cat.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Feature 1: Explainable Flags ─────────────────────── */}
      <section id="features" style={{ background: 'var(--color-dark-roast)', padding: '80px 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 'var(--page-max)' }}>
          <div className="grid gap-12 lg:grid-cols-2 items-start">

            {/* Left: copy */}
            <div className="lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-4">
                <FeatureTag text="Feature 01" />
                <FeatureTag text="Explainability" />
              </div>
              <h2
                className="font-display font-bold mb-4"
                style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--color-ivory)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Every flag explained.<br />
                <span style={{ color: 'var(--color-amber)' }}>No more</span> "suspicious activity."
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-sand)', fontSize: 15 }}>
                Traditional proctors give you a verdict, not a reason. ExamIdentity shows you exactly
                what triggered each flag — your observed value, your personal baseline, the policy
                threshold, and whether your accommodation was applied.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Observed value vs your personal baseline',
                  'Exact policy threshold and adjusted threshold',
                  'Which accommodation was applied (if any)',
                  'Model confidence score',
                  'Recommended action and dispute option',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-ceramic)', fontSize: 14 }}>
                    <span style={{ color: 'var(--color-amber)', marginTop: 2 }}>◆</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: live demo */}
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="label">Live preview — {DEMO_SESSION.examTitle}</p>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                  {DEMO_FLAGS.length} flags
                </span>
              </div>

              {/* Timeline */}
              <div className="card mb-2">
                <FlagEvidenceTimeline
                  flags={DEMO_FLAGS}
                  sessionStart={NOW - 3_600_000}
                  sessionEnd={NOW - 600_000}
                />
              </div>

              {DEMO_FLAGS.map((flag) => (
                <ExplainableFlagCard
                  key={flag.id}
                  flag={flag}
                  defaultExpanded={flag.id === 'flag-001'}
                  showDispute
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Feature 2: Credential Bridge ─────────────────────── */}
      <section style={{ background: 'var(--color-mahogany)', padding: '80px 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 'var(--page-max)' }}>
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FeatureTag text="Feature 02" />
                <FeatureTag text="Portability" />
              </div>
              <h2
                className="font-display font-bold mb-4"
                style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--color-ivory)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Your credential lives<br />
                <span style={{ color: 'var(--color-amber)' }}>outside</span> our platform.
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-sand)', fontSize: 15 }}>
                Export your exam integrity credential as a signed W3C VC, add it to Apple or Google Wallet,
                share it on LinkedIn, or issue it via OID4VCI to any compatible digital wallet.
                You hold the proof, not us.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📄', label: 'Signed VC JSON',      note: 'W3C VC 2.0'          },
                  { icon: '⬛', label: 'QR Verification',      note: 'Publicly verifiable'  },
                  { icon: '🍎', label: 'Apple Wallet',         note: 'Coming in v1'         },
                  { icon: '💼', label: 'LinkedIn',             note: 'Coming in v1'         },
                ].map(({ icon, label, note }) => (
                  <div
                    key={label}
                    className="rounded-card p-4"
                    style={{ background: 'var(--color-walnut)', border: '1px solid var(--color-cedar)' }}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <p className="font-semibold mt-2 mb-0.5" style={{ color: 'var(--color-ivory)', fontSize: 13 }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>{note}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/wallet/export/demo"
                className="btn-primary mt-6 inline-flex"
                style={{ padding: '11px 22px', fontSize: 14 }}
              >
                Try the export demo →
              </Link>
            </div>

            {/* Visual: credential card mockup */}
            <div
              className="rounded-card p-6 relative overflow-hidden"
              style={{
                background:  'var(--color-walnut)',
                border:      '1px solid var(--color-bark)',
                minHeight:   280,
              }}
            >
              {/* Amber glow background accent */}
              <div
                className="absolute -top-12 -right-12 rounded-full pointer-events-none"
                style={{
                  width:  200,
                  height: 200,
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--color-amber) 12%, transparent) 0%, transparent 70%)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="label mb-1">Verifiable Credential</p>
                    <p className="font-display font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--color-ivory)', letterSpacing: '-0.02em' }}>
                      Calculus I — Midterm Exam
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-taupe)', fontSize: 12 }}>
                      University of Delhi
                    </p>
                  </div>
                  <span className="badge badge-low">✓ Valid</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Issued',       val: new Date().toLocaleDateString() },
                    { label: 'Proof type',   val: 'Ed25519Signature2020'          },
                    { label: 'Subject DID',  val: 'did:key:z6Mkj8…'               },
                    { label: 'Integrity',    val: 'Verified'                      },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="label mb-0.5">{label}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--color-ceramic)', fontSize: 12 }}>{val}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="rounded-md px-3 py-2 text-xs font-mono truncate"
                  style={{ background: 'var(--color-espresso)', border: '1px solid var(--color-cedar)', color: 'var(--color-amber-dim)', fontSize: 10 }}
                >
                  proofValue: "z58DAdFfa9…"
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Feature 3: Transparency ───────────────────────────── */}
      <section style={{ background: 'var(--color-dark-roast)', padding: '80px 0' }}>
        <div className="mx-auto px-6" style={{ maxWidth: 'var(--page-max)' }}>
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Stats preview */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Exams protected',   value: '18,432',  accent: 'color: var(--color-amber-glow)'  },
                { label: 'Credentials issued',value: '17,890',  accent: 'color: var(--color-sage)'        },
                { label: 'Overturn rate',     value: '19.6%',   accent: 'color: var(--color-slate-blue)'  },
                { label: 'Deletion compliance', value: '99.6%', accent: 'color: var(--color-ceramic)'     },
              ].map(({ label, value, accent }) => (
                <div
                  key={label}
                  className="rounded-card p-5"
                  style={{ background: 'var(--color-walnut)', border: '1px solid var(--color-cedar)' }}
                >
                  <p className="label mb-1">{label}</p>
                  <p className="font-display font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.02em', ...Object.fromEntries([accent.split(': ')]) }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Copy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FeatureTag text="Feature 03" />
                <FeatureTag text="Accountability" />
              </div>
              <h2
                className="font-display font-bold mb-4"
                style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--color-ivory)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Aggregate metrics,<br />
                <span style={{ color: 'var(--color-amber)' }}>publicly auditable.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-sand)', fontSize: 15 }}>
                Anyone can inspect our platform's flag rates, dispute outcomes, deletion compliance,
                and model drift — without ever seeing a student's personal data. The transparency
                log is hash-chained and tamper-evident.
              </p>
              <Link
                href="/transparency"
                className="btn-primary"
                style={{ padding: '11px 22px', fontSize: 14 }}
              >
                View full transparency report →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section
        id="get-started"
        style={{ background: 'var(--color-mahogany)', padding: '80px 0', borderTop: '1px solid var(--color-cedar)' }}
      >
        <div
          className="mx-auto px-6 text-center"
          style={{ maxWidth: 640 }}
        >
          <h2
            className="font-display font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--color-ivory)', letterSpacing: '-0.03em' }}
          >
            Exam integrity that{' '}
            <span style={{ color: 'var(--color-amber)' }}>respects you.</span>
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color: 'var(--color-sand)', fontSize: 16 }}>
            Whether you're a student who wants control over your data, or an institution that wants
            transparent, defensible integrity decisions — ExamIdentity was built for you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="#" className="btn-primary" style={{ padding: '13px 28px', fontSize: 15 }}>
              Request a demo
            </Link>
            <Link href="/transparency" className="btn-ghost" style={{ padding: '13px 28px', fontSize: 15 }}>
              Read the transparency report
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}