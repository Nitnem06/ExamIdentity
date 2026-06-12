// apps/web/src/app/wallet/export/[credentialId]/page.tsx
import type { Metadata } from 'next'
import { Nav }                   from '@/components/shared/Nav'
import { Footer }                from '@/components/shared/Footer'
import { CredentialBridgePanel } from '@/components/wallet/CredentialBridgePanel'

// ✅ params is a Promise in Next.js 15+
interface PageProps {
  params: Promise<{ credentialId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { credentialId } = await params  // ✅ awaited

  const isDemo = credentialId === 'demo'
  return {
    title: isDemo
      ? 'Export Demo — Credential Wallet'
      : `Export Credential ${credentialId.slice(0, 8)}`,
    description: 'Export your Provora verifiable credential to your preferred format.',
  }
}

// ✅ Must be async to await params
export default async function CredentialExportPage({ params }: PageProps) {
  const { credentialId } = await params  // ✅ awaited
  const isDemo = credentialId === 'demo'

  return (
    <>
      <Nav />

      <main style={{ background: 'var(--color-dark-roast)', minHeight: 'calc(100dvh - var(--nav-height))' }}>
        {/* Page header */}
        <div
          style={{
            background:   'var(--color-mahogany)',
            borderBottom: '1px solid var(--color-cedar)',
            padding:      '40px 0 32px',
          }}
        >
          <div className="mx-auto px-6" style={{ maxWidth: 800 }}>
            <div className="flex items-center gap-2 mb-3">
              <a
                href="/wallet"
                className="text-xs flex items-center gap-1"
                style={{ color: 'var(--color-taupe)', fontSize: 12 }}
              >
                ← Wallet
              </a>
              <span style={{ color: 'var(--color-cedar)' }}>/</span>
              <span className="text-xs" style={{ color: 'var(--color-ceramic)', fontSize: 12 }}>
                Export
              </span>
            </div>
            <h1
              className="font-display font-bold"
              style={{
                fontFamily:    'var(--font-display)',
                fontSize:      28,
                color:         'var(--color-ivory)',
                letterSpacing: '-0.02em',
              }}
            >
              Export Credential
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--color-sand)', fontSize: 14 }}>
              Choose a format to export or share your exam integrity credential.
              Your private key never leaves your device.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto px-6 py-10" style={{ maxWidth: 800 }}>

          {/* Demo banner */}
          {isDemo && (
            <div
              className="rounded-md px-4 py-3 mb-8 flex items-start gap-3 text-sm"
              style={{
                background: 'var(--color-amber-surface)',
                border:     '1px solid color-mix(in srgb, var(--color-amber) 30%, transparent)',
                color:      'var(--color-ceramic)',
                fontSize:   13,
              }}
            >
              <span style={{ color: 'var(--color-amber)', fontSize: 16 }}>◈</span>
              <span>
                <span className="font-semibold" style={{ color: 'var(--color-amber-glow)' }}>
                  Demo mode.{' '}
                </span>
                This page uses a sample credential. In production, you'd land here from your exam
                history after authentication.
              </span>
            </div>
          )}

          {/* Main panel */}
          <div
            className="rounded-card p-6"
            style={{ background: 'var(--color-walnut)', border: '1px solid var(--color-cedar)' }}
          >
            <CredentialBridgePanel
              credentialId={isDemo ? 'cred-001' : credentialId}
              examTitle={isDemo ? 'Calculus II — Final' : 'Exam Integrity Credential'}
              studentDid="did:key:zDemoStudent"
            />
          </div>

          {/* Info strip */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {[
              {
                icon:  '🔒',
                title: 'Your key, your data',
                body:  'The proof is signed with your DID key. Provora cannot revoke or alter it without your consent.',
              },
              {
                icon:  '📋',
                title: 'Publicly verifiable',
                body:  "Anyone with the QR link or VC JSON can verify this credential against the issuer's DID Document.",
              },
              {
                icon:  '⏳',
                title: 'No expiry by default',
                body:  "Credentials don't expire unless the institution sets a policy. Check the expirationDate field in the VC.",
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-card p-4"
                style={{ background: 'var(--color-mahogany)', border: '1px solid var(--color-cedar)' }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <p className="font-semibold mt-2 mb-1" style={{ color: 'var(--color-ivory)', fontSize: 13 }}>
                  {title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-taupe)', fontSize: 12 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}