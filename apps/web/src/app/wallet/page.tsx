'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Nav } from '@/components/shared/Nav'
import { Footer } from '@/components/shared/Footer'
import { useAuth } from '@/lib/auth/AuthContext'
import { getMyCredentials } from '@/lib/api/me'

export default function WalletPage() {
  const { me, loading } = useAuth()
  const { data: credentials, isLoading } = useQuery({
    queryKey: ['my-credentials'],
    queryFn: getMyCredentials,
    enabled: Boolean(me),
  })

  return (
    <>
      <Nav />
      <main className="center-wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p className="label mb-2">My wallet</p>
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
            Your credentials
          </h1>
          <p style={{ color: 'var(--color-sand)', fontSize: 14, marginBottom: 26 }}>
            Verifiable exam integrity credentials issued to your identity.
          </p>

          {loading ? (
            <p style={{ color: 'var(--color-taupe)', fontSize: 14 }}>Loading…</p>
          ) : !me ? (
            <div className="card reveal-pop" style={{ padding: 28 }}>
              <p style={{ color: 'var(--color-ceramic)', fontSize: 15, marginBottom: 14 }}>
                Log in to see your credentials.
              </p>
              <Link
                href="/login"
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: 14 }}
              >
                Log in
              </Link>
            </div>
          ) : isLoading ? (
            <p style={{ color: 'var(--color-taupe)', fontSize: 14 }}>Loading credentials…</p>
          ) : credentials && credentials.length > 0 ? (
            <div className="flex flex-col gap-3">
              {credentials.map((c) => (
                <Link
                  key={c.id}
                  href={`/wallet/export/${c.id}`}
                  className="card reveal-pop"
                  style={{ padding: 20, display: 'block' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p style={{ color: 'var(--color-ivory)', fontSize: 16, fontWeight: 700 }}>
                        {c.examName}
                      </p>
                      <p style={{ color: 'var(--color-taupe)', fontSize: 12, marginTop: 2 }}>
                        {c.issuingInstitution} · {new Date(c.issuanceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className="badge badge-low"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      {c.integrityScoreBand}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card reveal-pop" style={{ padding: 28 }}>
              <p style={{ color: 'var(--color-ceramic)', fontSize: 15, marginBottom: 8 }}>
                No credentials yet.
              </p>
              <p style={{ color: 'var(--color-taupe)', fontSize: 13, marginBottom: 16 }}>
                Credentials are issued when you complete a proctored exam. Want to see how
                export works?
              </p>
              <Link
                href="/wallet/export/demo"
                className="btn-ghost"
                style={{ padding: '10px 18px', fontSize: 14 }}
              >
                View a demo credential
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
