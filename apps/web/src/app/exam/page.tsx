'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSessionExplanations } from '@/lib/api/explanations'
import { ExplainableFlagCard } from '@/components/exam/ExplainableFlagCard'
import type { AccommodationType } from '@/types/explanations'

const ACCOMMODATIONS: AccommodationType[] = [
  'NONE',
  'EXTENDED_TIME',
  'SCREEN_READER',
  'BREAKS_ALLOWED',
  'ASSISTIVE_TECH',
  'REDUCED_DISTRACTION',
]

export default function ExamFlagsPage() {
  const [sessionId] = useState('sess-001')
  const [accommodation, setAccommodation] = useState<AccommodationType>('NONE')
  const { data, isLoading, isError } = useSessionExplanations(sessionId, accommodation)

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Explainable Flag Cards
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Transparent proctoring flags for session{' '}
          <span className="font-mono">{sessionId}</span>. Change the accommodation
          to see how adjusted thresholds turn flags into auto-resolutions.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label
          htmlFor="accommodation"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Accommodation
        </label>
        <select
          id="accommodation"
          value={accommodation}
          onChange={(e) => setAccommodation(e.target.value as AccommodationType)}
          className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        >
          {ACCOMMODATIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading explanations…</p>
      ) : isError ? (
        <p className="text-sm text-red-600">
          Could not reach the API. Start the API service on port 3001.
        </p>
      ) : data && data.explanations.length > 0 ? (
        <div className="flex flex-col gap-4">
          {data.explanations.map((explanation) => (
            <ExplainableFlagCard
              key={explanation.flagId}
              explanation={explanation}
              onDispute={(flagId) => alert(`Dispute opened for ${flagId}`)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No flags for this session.</p>
      )}
    </main>
  )
}
