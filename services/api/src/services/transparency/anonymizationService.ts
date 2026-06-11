// Anonymization helpers for public transparency metrics.
//
// Ensures published aggregates cannot be used to re-identify individuals:
//  - small counts below the k-anonymity threshold are suppressed (reported as 0)
//  - a RATE derived from a suppressed count is ALSO suppressed, so a published
//    rate + total can never be used to back out a small count
//  - rates are rounded to a fixed precision
//
// The threshold is configurable via config.kAnonymity (env K_ANONYMITY,
// default 5). Set K_ANONYMITY=1 in development to see live numbers.

import { config } from '../../config'

const THRESHOLD = config.kAnonymity

/** Suppress counts below the k-anonymity threshold. */
export function suppressSmallCount(count: number): number {
  return count < THRESHOLD ? 0 : count
}

/** Round a percentage/rate to one decimal place. */
export function roundRate(rate: number): number {
  return Math.round(rate * 10) / 10
}

/** Round a duration (hours) to one decimal place. */
export function roundHours(hours: number): number {
  return Math.round(hours * 10) / 10
}

/** Compute a percentage (0..100), guarding against divide-by-zero. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return roundRate((part / whole) * 100)
}

/**
 * Compute a percentage that is suppressed (returned as 0) when the underlying
 * numerator is below the k-anonymity threshold. Use this for any rate whose
 * numerator is a small, potentially-identifying count.
 */
export function suppressedPct(part: number, whole: number): number {
  if (part < THRESHOLD) return 0
  return pct(part, whole)
}

/** The k-anonymity threshold in effect (exposed for documentation/UX). */
export const kAnonymityThreshold = THRESHOLD
