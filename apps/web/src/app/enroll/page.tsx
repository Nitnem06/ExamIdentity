'use client'

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/shared/Nav'
import { Footer } from '@/components/shared/Footer'
import { enroll, exportRecovery, listUniversities } from '@/lib/auth'
import { useAuth } from '@/lib/auth/AuthContext'
import type { University } from '@/types/auth'

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radius-soft)',
  border: '1px solid rgba(244,234,220,0.16)',
  background: 'rgba(19,11,7,0.6)',
  color: 'var(--color-ivory)',
  fontSize: 15,
  outline: 'none',
}

export default function EnrollPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [unis, setUnis] = useState<University[]>([])
  const [universityId, setUniversityId] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ did: string } | null>(null)

  useEffect(() => {
    listUniversities()
      .then((u) => {
        setUnis(u)
        if (u[0]) setUniversityId(u[0].universityId)
      })
      .catch(() => setError('Could not load universities. Is the API running on :3001?'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters.')
      return
    }
    if (passphrase !== confirm) {
      setError('Passphrases do not match.')
      return
    }
    setBusy(true)
    try {
      const { did } = await enroll({ universityId, passphrase })
      await refresh()
      setResult({ did })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function downloadRecovery() {
    if (!result) return
    const json = await exportRecovery(result.did)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `examidentity-recovery-${result.did.slice(0, 18)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Nav />
      <main className="center-wrap" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          {!result ? (
            <div className="card" style={{ padding: 36 }}>
              <p className="label mb-2">Get started</p>
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
                Create your exam identity
              </h1>
              <p style={{ color: 'var(--color-sand)', fontSize: 14, marginBottom: 26 }}>
                Your identity is self-sovereign. We generate a key on your device and
                protect it with a passphrase — only you can unlock it.
              </p>

              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="label mb-1 block">Institution</label>
                  <select
                    value={universityId}
                    onChange={(e) => setUniversityId(e.target.value)}
                    style={fieldStyle}
                    required
                  >
                    {unis.length === 0 ? <option value="">Loading…</option> : null}
                    {unis.map((u) => (
                      <option key={u.universityId} value={u.universityId}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1 block">Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="At least 8 characters"
                    style={fieldStyle}
                    required
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Confirm passphrase</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={fieldStyle}
                    required
                  />
                </div>

                {error ? (
                  <p style={{ color: '#e6a17a', fontSize: 13 }}>{error}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy || !universityId}
                  className="btn-primary"
                  style={{ padding: '13px 20px', fontSize: 15, opacity: busy ? 0.7 : 1 }}
                >
                  {busy ? 'Creating identity…' : 'Create identity'}
                </button>
              </form>

              <p style={{ color: 'var(--color-taupe)', fontSize: 13, marginTop: 20 }}>
                Already enrolled?{' '}
                <Link href="/login" style={{ color: 'var(--color-amber-glow)', fontWeight: 700 }}>
                  Log in
                </Link>
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 36 }}>
              <p className="label mb-2">Identity created</p>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--color-ivory)',
                  marginBottom: 10,
                }}
              >
                You&apos;re all set
              </h1>
              <p style={{ color: 'var(--color-sand)', fontSize: 14, marginBottom: 8 }}>
                Your identity key — save this; you&apos;ll paste it to log in:
              </p>
              <code
                style={{
                  display: 'block',
                  wordBreak: 'break-all',
                  fontSize: 12,
                  color: 'var(--color-amber-glow)',
                  background: 'rgba(19,11,7,0.6)',
                  borderRadius: 'var(--radius-soft)',
                  padding: 12,
                  marginBottom: 20,
                }}
              >
                {result.did.replace(/^did:key:z/, '')}
              </code>
              <p style={{ color: 'var(--color-sand)', fontSize: 13, marginBottom: 18 }}>
                Save a recovery file to log in on another device. Without it (and your
                passphrase) your identity can&apos;t be recovered.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadRecovery}
                  className="btn-ghost"
                  style={{ padding: '11px 18px', fontSize: 14 }}
                >
                  Download recovery file
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/exam')}
                  className="btn-primary"
                  style={{ padding: '11px 22px', fontSize: 14 }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
