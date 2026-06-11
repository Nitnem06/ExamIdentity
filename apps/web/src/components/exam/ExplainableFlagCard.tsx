"use client";

import { useState } from 'react'
import type { ExplainableFlag } from '@/types/explanations'
import { FLAG_TYPE_LABELS, RECOMMENDED_ACTION_LABELS } from '@/types/explanations'
import { FlagSeverityBadge } from './FlagSeverityBadge'
import { FlagReasonList } from './FlagReasonList'

interface ExplainableFlagCardProps {
  flag: ExplainableFlag
  sessionStart?: number
  defaultExpanded?: boolean
  onDispute?: (flagId: string) => void
  showDispute?: boolean
}

// ✅ Added explicit timeZone to ensure server and client render identically
function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC', // ✅ Fixes hydration mismatch
  })
}

const ACTION_ICONS: Record<string, string> = {
  auto_resolved:           '✓',
  note_for_review:         '○',
  flag_for_manual_review:  '⚑',
  escalate_to_institution: '▲',
}

export function ExplainableFlagCard({
  flag,
  defaultExpanded = false,
  onDispute,
  showDispute = true,
}: ExplainableFlagCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const confidencePct = Math.round(flag.confidence * 100)
  const durationSec = Math.round((flag.timeRange.end - flag.timeRange.start) / 1000)

  const borderColors = {
    low:      'var(--color-sage)',
    medium:   'var(--color-amber)',
    high:     'var(--color-terracotta)',
    critical: '#e05050',
  }
  const borderColor = borderColors[flag.severity]

  return (
    <div
      className="rounded-card overflow-hidden transition-all duration-200"
      style={{
        background:   'var(--color-walnut)',
        border:       `1px solid var(--color-cedar)`,
        borderLeft:   `3px solid ${borderColor}`,
      }}
    >
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 group"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--color-ivory)', fontFamily: 'var(--font-sans)', fontSize: 14 }}
            >
              {FLAG_TYPE_LABELS[flag.type]}
            </span>
            <FlagSeverityBadge severity={flag.severity} />
            {flag.accommodation.applied && (
              <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                ⚑ Accommodation
              </span>
            )}
          </div>

          {/* ✅ suppressHydrationWarning as extra safety net */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span
              className="text-xs"
              style={{ color: 'var(--color-taupe)', fontSize: 11 }}
              suppressHydrationWarning
            >
              {formatTimestamp(flag.timeRange.start)}
              {' – '}
              {formatTimestamp(flag.timeRange.end)}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
              {durationSec}s
            </span>
            <span className="text-xs" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
              {confidencePct}% confidence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
            {ACTION_ICONS[flag.recommendedAction]}{' '}
            {RECOMMENDED_ACTION_LABELS[flag.recommendedAction]}
          </span>
          <span
            className="text-xs transition-transform duration-200"
            style={{
              color: 'var(--color-taupe)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 border-t animate-fade-in"
          style={{ borderColor: 'var(--color-cedar)' }}
        >
          <div className="mt-4 mb-5">
            <p className="label">What happened</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-parchment)', fontSize: 14 }}>
              {flag.explanation}
            </p>
          </div>

          <hr className="divider" />

          <div className="mb-4">
            <p className="label">Evidence details</p>
            <FlagReasonList flag={flag} />
          </div>

          <div className="flex items-center justify-between gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--color-cedar)' }}>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block rounded-full"
                style={{ width: 7, height: 7, background: borderColor }}
              />
              <span className="text-xs" style={{ color: 'var(--color-ceramic)', fontSize: 12 }}>
                {RECOMMENDED_ACTION_LABELS[flag.recommendedAction]}
              </span>
            </div>
            {showDispute && onDispute && flag.recommendedAction !== 'auto_resolved' && (
              <button
                className="btn-ghost"
                style={{ padding: '7px 14px', fontSize: 13 }}
                onClick={(e) => { e.stopPropagation(); onDispute(flag.id) }}
              >
                Dispute this flag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}