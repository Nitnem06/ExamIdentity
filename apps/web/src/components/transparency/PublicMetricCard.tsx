// apps/web/src/components/transparency/PublicMetricCard.tsx
import { CountUp } from '@/components/anim/CountUp'

interface PublicMetricCardProps {
  label:        string
  value:        string | number
  unit?:        string
  description?: string
  trend?:       { direction: 'up' | 'down' | 'neutral'; label: string }
  accent?:      'amber' | 'sage' | 'terracotta' | 'slate' | 'neutral'
  size?:        'sm' | 'md' | 'lg'
}

const ACCENT_CONFIG = {
  amber:      { value: 'var(--color-amber-glow)',   bg: 'var(--color-amber-surface)',   border: 'color-mix(in srgb, var(--color-amber) 25%, transparent)' },
  sage:       { value: 'var(--color-sage)',          bg: 'var(--color-sage-dim)',         border: 'color-mix(in srgb, var(--color-sage) 25%, transparent)'  },
  terracotta: { value: 'var(--color-terracotta)',    bg: 'var(--color-terra-dim)',        border: 'color-mix(in srgb, var(--color-terracotta) 25%, transparent)' },
  slate:      { value: 'var(--color-slate-blue)',    bg: 'var(--color-slate-dim)',        border: 'color-mix(in srgb, var(--color-slate-blue) 25%, transparent)' },
  neutral:    { value: 'var(--color-ceramic)',       bg: 'var(--color-walnut)',           border: 'var(--color-cedar)' },
}

const TREND_ICONS = { up: '↑', down: '↓', neutral: '→' }
const TREND_COLORS = { up: 'var(--color-sage)', down: 'var(--color-terracotta)', neutral: 'var(--color-taupe)' }

export function PublicMetricCard({
  label,
  value,
  unit,
  description,
  trend,
  accent = 'neutral',
  size = 'md',
}: PublicMetricCardProps) {
  const cfg = ACCENT_CONFIG[accent]
  const valueFontSize = size === 'lg' ? 40 : size === 'md' ? 30 : 22

  return (
    <div
      className="rounded-card p-5 flex flex-col gap-2 lift"
      style={{
        background: cfg.bg,
        border:     `1px solid ${cfg.border}`,
      }}
    >
      {/* Label */}
      <p
        className="text-2xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-taupe)', letterSpacing: '0.06em', fontSize: 11 }}
      >
        {label}
      </p>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-display font-bold leading-none"
          style={{ color: cfg.value, fontSize: valueFontSize, fontFamily: 'var(--font-display)' }}
        >
          {typeof value === 'number' ? (
            <CountUp value={value} decimals={Number.isInteger(value) ? 0 : 1} />
          ) : (
            value
          )}
        </span>
        {unit && (
          <span
            className="text-sm"
            style={{ color: 'var(--color-ceramic)', fontSize: 13 }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Description + trend */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {description && (
          <p className="text-xs leading-snug" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
            {description}
          </p>
        )}
        {trend && (
          <span
            className="text-xs font-medium shrink-0"
            style={{ color: TREND_COLORS[trend.direction], fontSize: 11 }}
          >
            {TREND_ICONS[trend.direction]} {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}