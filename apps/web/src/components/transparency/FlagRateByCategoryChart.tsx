// apps/web/src/components/transparency/FlagRateByCategoryChart.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { FlagRateByCategory } from '@/types/transparency'

interface FlagRateByCategoryChartProps {
  data: FlagRateByCategory[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-md px-3 py-2 text-xs"
      style={{
        background: 'var(--color-cedar)',
        border:     '1px solid var(--color-bark)',
        color:      'var(--color-ivory)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--color-ceramic)', fontSize: 11 }}>{label}</p>
      <p style={{ color: 'var(--color-amber-glow)' }}>
        Rate: <span className="font-bold">{payload[0].value}%</span>
      </p>
      {payload[0].payload.count !== undefined && (
        <p style={{ color: 'var(--color-taupe)', fontSize: 10 }}>
          {payload[0].payload.count.toLocaleString()} flags
        </p>
      )}
    </div>
  )
}

// Bar color stepped by value
function barColor(rate: number): string {
  if (rate >= 4) return 'var(--color-terracotta)'
  if (rate >= 2) return 'var(--color-amber)'
  return 'var(--color-sage)'
}

export function FlagRateByCategoryChart({ data }: FlagRateByCategoryChartProps) {
  const sorted = [...data].sort((a, b) => b.rate - a.rate)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ width: '100%', height: 260 }} />

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
          barSize={12}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            stroke="var(--color-cedar)"
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-taupe)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 'dataMax + 1']}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={130}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-ceramic)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-cedar)', opacity: 0.4 }} />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, idx) => (
              <Cell key={idx} fill={barColor(entry.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}