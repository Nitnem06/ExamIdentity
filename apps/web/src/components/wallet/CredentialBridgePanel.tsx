'use client'

import { useState } from 'react'
import type { ExportFormat, VerifiableCredentialExport, QRVerificationLink } from '@/types/credentialBridge'
import { WalletExportOptions } from './WalletExportOptions'
import { CredentialExportPreview } from './CredentialExportPreview'
import { QRCodeVerifier } from './QRCodeVerifier'
import {
  LinkedInShareButton,
  AppleWalletPassButton,
  GoogleWalletPassButton,
} from './LinkedInShareButton'
import { exportCredential, getQRLink } from '@/lib/api/credentialBridge'

interface CredentialBridgePanelProps {
  credentialId: string
  examTitle: string
  studentDid: string
}

export function CredentialBridgePanel({
  credentialId,
  examTitle,
  studentDid,
}: CredentialBridgePanelProps) {
  const [selected, setSelected] = useState<ExportFormat | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [vcExport, setVcExport] = useState<VerifiableCredentialExport | null>(null)
  const [qrLink, setQrLink]     = useState<QRVerificationLink | null>(null)

  async function handleSelect(format: ExportFormat) {
    setSelected(format)
    setError(null)
    setVcExport(null)
    setQrLink(null)
    setLoading(true)

    try {
      if (format === 'vc_json') {
        const data = await exportCredential(credentialId, 'vc_json')
        setVcExport(data)
      } else if (format === 'qr_link') {
        const [data, qr] = await Promise.all([
          exportCredential(credentialId, 'vc_json'),
          getQRLink(credentialId),
        ])
        setVcExport(data)
        setQrLink(qr)
      } else {
        // Stubs — just show the VC for preview
        const data = await exportCredential(credentialId, 'vc_json')
        setVcExport(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!vcExport) return
    const blob = new Blob([JSON.stringify(vcExport.payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `provora-credential-${credentialId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="label mb-1">Export credential</p>
        <p className="font-semibold" style={{ color: 'var(--color-ivory)', fontSize: 17 }}>
          {examTitle}
        </p>
        <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
          {studentDid.slice(0, 24)}…
        </p>
      </div>

      {/* Format selector */}
      <WalletExportOptions selected={selected} onSelect={handleSelect} loading={loading} />

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-4" style={{ color: 'var(--color-ceramic)' }}>
          <span className="animate-pulse-amber" style={{ color: 'var(--color-amber)' }}>◉</span>
          <span className="text-sm">Preparing credential…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-md px-4 py-3 text-sm"
          style={{
            background: 'var(--color-terra-dim)',
            border: '1px solid var(--color-terracotta)',
            color: 'var(--color-terracotta)',
          }}
        >
          {error}
        </div>
      )}

      {/* Result panels */}
      {vcExport && !loading && (
        <div className="space-y-4 animate-fade-in">

          {/* QR display */}
          {qrLink && selected === 'qr_link' && (
            <div className="card">
              <p className="label mb-4">QR Verification</p>
              <QRCodeVerifier qr={qrLink} />
            </div>
          )}

          {/* Credential JSON preview */}
          {selected === 'vc_json' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <p className="label mb-0">Credential preview</p>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleDownload}>
                  Download .json
                </button>
              </div>
              <CredentialExportPreview credential={vcExport} />
            </div>
          )}

          {/* Wallet / social stubs */}
          {selected === 'apple_wallet' && vcExport && (
            <div className="card">
              <p className="label mb-4">Add to Apple Wallet</p>
              <AppleWalletPassButton passUrl="#" isStub />
            </div>
          )}
          {selected === 'google_wallet' && vcExport && (
            <div className="card">
              <p className="label mb-4">Add to Google Wallet</p>
              <GoogleWalletPassButton passUrl="#" isStub />
            </div>
          )}
          {selected === 'linkedin' && vcExport && (
            <div className="card">
              <p className="label mb-4">Share on LinkedIn</p>
              <LinkedInShareButton
                payload={{
                  title:        examTitle,
                  description:  'Verified exam credential issued by Provora',
                  certUrl:      `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${credentialId}`,
                  credentialId: credentialId,
                  issuedAt:     vcExport.issuedAt,
                }}
                isStub
              />
            </div>
          )}
          {selected === 'oid4vci' && (
            <div className="card">
              <p className="label mb-3">OID4VCI Credential Offer</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-ceramic)', fontSize: 14 }}>
                Scan with any OpenID4VCI-compatible wallet to claim this credential.
              </p>
              <div
                className="rounded-md px-3 py-2 text-xs font-mono"
                style={{
                  background: 'var(--color-espresso)',
                  border: '1px solid var(--color-cedar)',
                  color: 'var(--color-ceramic)',
                  fontSize: 11,
                }}
              >
                openid-credential-offer://?credential_offer_uri=https://api.provora.app/oid4vci/offer/{credentialId}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--color-taupe)', fontSize: 11 }}>
                This is a demo stub. OID4VCI issuance endpoint coming in v2.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}