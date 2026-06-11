// apps/web/src/components/transparency/DisputeOutcomesChart.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DisputeOutcomeByMonth } from '@/types/transparency'

interface DisputeOutcomesChartProps {
  data: DisputeOutcomeByMonth[]
}

const COLORS = {
  autoResolved: 'var(--color-slate-blue)',
  overturned:   'var(--color-sage)',
  upheld:       'var(--color-terracotta)',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div
      className="rounded-md px-3 py-2 space-y-1 text-xs"
      style={{
        background: 'var(--color-cedar)',
        border:     '1px solid var(--color-bark)',
        fontFamily: 'var(--font-sans)',
        minWidth:   140,
      }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--color-ivory)', fontSize: 12 }}>
        {label} — {total} disputes
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block rounded-full"
              style={{ width: 6, height: 6, background: p.fill }}
            />
            <span style={{ color: 'var(--color-ceramic)', fontSize: 11 }}>{p.name}</span>
          </div>
          <span style={{ color: 'var(--color-ivory)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-5 mt-2">
      {[
        { key: 'autoResolved', label: 'Auto-resolved', color: COLORS.autoResolved },
        { key: 'overturned',   label: 'Overturned',    color: COLORS.overturned   },
        { key: 'upheld',       label: 'Upheld',        color: COLORS.upheld       },
      ].map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block rounded-full"
            style={{ width: 7, height: 7, background: color }}
          />
          <span style={{ color: 'var(--color-taupe)', fontSize: 11, fontFamily: 'var(--font-sans)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DisputeOutcomesChart({ data }: DisputeOutcomesChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ width: '100%', height: 290 }} />

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
          barSize={18}
          barGap={2}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--color-cedar)"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-taupe)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-taupe)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-cedar)', opacity: 0.3 }} />
          <Bar dataKey="autoResolved" name="Auto-resolved" stackId="a" fill={COLORS.autoResolved} radius={[0, 0, 0, 0]} />
          <Bar dataKey="overturned"   name="Overturned"    stackId="a" fill={COLORS.overturned}   radius={[0, 0, 0, 0]} />
          <Bar dataKey="upheld"       name="Upheld"        stackId="a" fill={COLORS.upheld}        radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  )
}