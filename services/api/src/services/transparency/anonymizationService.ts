// Anonymization helpers for public transparency metrics.
//
// Ensures published aggregates cannot be used to re-identify individuals:
//  - small counts below a k-anonymity threshold are suppressed (reported as 0)
//  - rates are rounded to a fixed precision
//  - no field that could carry an identifier is ever passed through here

const K_ANONYMITY_THRESHOLD = 5

/** Suppress counts below the k-anonymity threshold. */
export function suppressSmallCount(count: number): number {
  return count < K_ANONYMITY_THRESHOLD ? 0 : count
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

/** The k-anonymity threshold in effect (exposed for documentation/UX). */
export const kAnonymityThreshold = K_ANONYMITY_THRESHOLD
