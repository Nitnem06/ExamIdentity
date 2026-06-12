'use client'

import type { ReactNode } from 'react'

/**
 * App Router template — remounts on every navigation, so the `route-enter`
 * animation replays on each page transition (gentle fade + rise).
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-enter">{children}</div>
}
