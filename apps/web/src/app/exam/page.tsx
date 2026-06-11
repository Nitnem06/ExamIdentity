'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Nav } from '@/components/shared/Nav'
import { Footer } from '@/components/shared/Footer'
import { ExplainableFlagCard } from '@/components/exam/ExplainableFlagCard'
import { disputeFlag, getSessionFlags } from '@/lib/api/explanations'
import { getMySessions } from '@/lib/api/me'
import { useAuth } from '@/lib/auth/AuthContext'

const ACCOMMODATIONS = [
  'NONE',
  'EXTENDED_TIME',
  'SCREEN_READER',
  'BREAKS_ALLOWED',
  'ASSISTIVE_TECH',
  'REDUCED_DISTRACTION',
]

const fieldStyle = {
  padding: '9px 13px',
  borderRadius: 'var(--radius-soft)',
  border: '1px solid rgba(244,234,220,0.16)',
  background: 'rgba(19,11,7,0.6)',
  color: 'var(--color-ivory)',
  fontSize: 14,
  outline: 'none',
}

// Demo fallback session (seeded) when the student has none of their own.
const DEMO_SESSION = { sessionId: 'sess-001', examName: 'Calculus II — Final (demo)' }

export default function ExamFlagsPage() {
  const { me } = useAuth()
  const [accommodation, setAccommodation] = useState('NONE')
  const [chosen, setChosen] = useState<string>('')

  const { data: mySessions } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: getMySessions,
    enabled: Boolean(me),
  })

  const sessionOptions = useMemo(() => {
    const mine = (mySessions ?? []).map((s) => ({ sessionId: s.sessionId, examName: s.examName }))
    return mine.length > 0 ? mine : [DEMO_SESSION]
  }, [mySessions])

  const sessionId = chosen || sessionOptions[0].sessionId

  const { data, isLoading, isError } = useQuery({
    queryKey: ['session-flags', sessionId, accommodation],
    queryFn: () => getSessionFlags(sessionId, accommodation),
  })

  async function onDispute(flagId: string) {
    try {
      const res = await disputeFlag(flagId, 'Submitted from the exam review page')
      alert(`Dispute ${res.disputeId} opened for ${flagId}`)
    } catch {
      alert('Could not submit dispute — are you logged in as the student?')
    }
  }

  return (
    <>
      <Nav />
      <main className="center-wrap" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <p className="label mb-2">Explainable flags</p>
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
            Session review
          </h1>
          <p style={{ color: 'var(--color-sand)', fontSize: 14, marginBottom: 24 }}>
            Transparent proctoring flags. Change the accommodation to see how adjusted
            thresholds turn flags into auto-resolutions.
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="session" className="label">
                Session
              </label>
              <select
                id="session"
                value={sessionId}
                onChange={(e) => setChosen(e.target.value)}
                style={fieldStyle}
              >
                {sessionOptions.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.examName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="accommodation" className="label">
                Accommodation
              </label>
              <select
                id="accommodation"
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                style={fieldStyle}
              >
                {ACCOMMODATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p style={{ color: 'var(--color-taupe)', fontSize: 14 }}>Loading explanations…</p>
          ) : isError ? (
            <p style={{ color: '#e6a17a', fontSize: 14 }}>
              Could not reach the API. Start the API service on port 3001.
            </p>
          ) : data && data.flags.length > 0 ? (
            <div className="flex flex-col gap-4">
              {data.flags.map((flag) => (
                <ExplainableFlagCard key={flag.id} flag={flag} onDispute={onDispute} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-taupe)', fontSize: 14 }}>No flags for this session.</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
