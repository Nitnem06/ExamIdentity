'use client'

import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/shared/Nav'
import { Footer } from '@/components/shared/Footer'
import { importRecovery, login } from '@/lib/auth'
import { useAuth } from '@/lib/auth/AuthContext'

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radius-soft)',
  border: '1px solid rgba(244,234,220,0.16)',
  background: 'rgba(31,21,14,0.6)',
  color: 'var(--color-ivory)',
  fontSize: 15,
  outline: 'none',
}

/** Accept just the key (hex), a `z…` multibase, or a full `did:key:…`. */
function normalizeDid(input: string): string {
  const v = input.trim()
  if (v.startsWith('did:key:')) return v
  if (v.startsWith('z')) return `did:key:${v}`
  return `did:key:z${v}`
}

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [did, setDid] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(normalizeDid(did), passphrase)
      await refresh()
      router.push('/exam')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onImportRecovery(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const importedDid = await importRecovery(text)
      setDid(importedDid)
      setError('')
    } catch {
      setError('Invalid recovery file.')
    }
  }

  return (
    <>
      <Nav />
      <main className="center-wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="card reveal-pop" style={{ padding: 36 }}>
            <p className="label mb-2">Welcome back</p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--color-ivory)',
                marginBottom: 8,
              }}
            >
              Log in
            </h1>
            <p style={{ color: 'var(--color-sand)', fontSize: 14, marginBottom: 26 }}>
              Enter your DID and passphrase. Your key is unlocked on this device to prove
              your identity — nothing secret is sent to the server.
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div>
                <label className="label mb-1 block">Identity key</label>
                <input
                  type="text"
                  value={did}
                  onChange={(e) => setDid(e.target.value)}
                  placeholder="Paste your key (the part after did:key:z)"
                  style={fieldStyle}
                  required
                />
              </div>

              <div>
                <label className="label mb-1 block">Passphrase</label>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  style={fieldStyle}
                  required
                />
              </div>

              {error ? <p style={{ color: '#e6a17a', fontSize: 13 }}>{error}</p> : null}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary"
                style={{ padding: '13px 20px', fontSize: 15, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? 'Signing in…' : 'Log in'}
              </button>
            </form>

            <div
              style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid rgba(244,234,220,0.12)',
              }}
            >
              <p style={{ color: 'var(--color-taupe)', fontSize: 13, marginBottom: 10 }}>
                New device? Import your recovery file:
              </p>
              <input
                type="file"
                accept="application/json"
                onChange={onImportRecovery}
                style={{ color: 'var(--color-sand)', fontSize: 13 }}
              />
            </div>

            <p style={{ color: 'var(--color-taupe)', fontSize: 13, marginTop: 20 }}>
              No identity yet?{' '}
              <Link href="/enroll" style={{ color: 'var(--color-amber-glow)', fontWeight: 700 }}>
                Get started
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
