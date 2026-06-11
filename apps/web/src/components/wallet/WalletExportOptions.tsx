'use client'

import type { ExportFormat } from '@/types/credentialBridge'
import { EXPORT_FORMAT_OPTIONS } from '@/types/credentialBridge'

interface WalletExportOptionsProps {
  selected: ExportFormat | null
  onSelect: (format: ExportFormat) => void
  loading?: boolean
}

export function WalletExportOptions({ selected, onSelect, loading }: WalletExportOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {EXPORT_FORMAT_OPTIONS.map((opt) => {
        const isSelected = selected === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            disabled={loading}
            className="text-left rounded-card p-4 transition-all duration-150"
            style={{
              background: isSelected ? 'var(--color-amber-surface)' : 'var(--color-mahogany)',
              border: isSelected
                ? '1px solid var(--color-amber)'
                : '1px solid var(--color-cedar)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span style={{ fontSize: 20 }}>{opt.icon}</span>
              {opt.isStub && (
                <span className="badge badge-neutral" style={{ fontSize: 9, padding: '2px 6px' }}>
                  Demo
                </span>
              )}
            </div>
            <p
              className="font-semibold text-sm mb-1"
              style={{
                color: isSelected ? 'var(--color-amber-glow)' : 'var(--color-ivory)',
                fontSize: 13,
              }}
            >
              {opt.label}
            </p>
            <p className="text-xs leading-snug" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
              {opt.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}