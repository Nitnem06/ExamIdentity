// Identity & Enrollment — shared domain types (Category A: student-owned data).

/**
 * Key custody tier.
 * - SELF_CUSTODY: the student holds their private key; the platform never stores it.
 * - STANDARD: the platform stores the private key encrypted under a platform key
 *   (convenience tier — recoverable, lower sovereignty).
 */
export type CustodyTier = 'SELF_CUSTODY' | 'STANDARD'

/** Exam accommodation applied to a student (mirrors AccommodationType). */
export type StudentAccommodation =
  | 'NONE'
  | 'EXTENDED_TIME'
  | 'SCREEN_READER'
  | 'BREAKS_ALLOWED'
  | 'SEPARATE_ROOM'
  | 'ASSISTIVE_TECH'
  | 'REDUCED_DISTRACTION'

/** A registered institution that can run exams and issue credentials. */
export interface UniversityProfile {
  universityId: string
  name: string
  did: string
  createdAt: string
}

/** Public-facing student profile (no private keys, no secrets). */
export interface StudentProfile {
  did: string
  universityId: string
  universityDid: string
  publicKey: string
  custodyTier: CustodyTier
  accommodation: StudentAccommodation
  createdAt: string
  updatedAt: string
}

/** Platform roles for access control. */
export type Role = 'student' | 'university' | 'reviewer'

/** Challenge issued for DID-based (signature) login. */
export interface LoginChallenge {
  did: string
  /** Random nonce the holder must sign with their private key. */
  nonce: string
  expiresAt: string
}

/** Login request: a signature over the issued nonce. */
export interface LoginRequest {
  did: string
  /** Hex Ed25519 signature over the nonce. */
  signature: string
}

/** Result of a successful login / token issuance. */
export interface AuthResult {
  token: string
  role: Role
  /** Subject identifier (a DID for students, an id for universities/reviewers). */
  subject: string
  profile?: StudentProfile
}

/** Decoded JWT payload. */
export interface AuthPrincipal {
  sub: string
  role: Role
}
export interface EnrollmentRequest {
  universityId: string
  custodyTier?: CustodyTier
  accommodation?: StudentAccommodation
}

/**
 * Result of enrollment. The private key is returned exactly once and ONLY for
 * SELF_CUSTODY enrollments — it is never persisted by the platform in that tier.
 */
export interface EnrollmentResult {
  profile: StudentProfile
  /** did:key identifier (same as profile.did, surfaced for convenience). */
  did: string
  /**
   * Hex-encoded private key. Present ONLY for SELF_CUSTODY; the student must
   * store it. Omitted for STANDARD (platform-held, encrypted at rest).
   */
  privateKey?: string
  /** Short-lived auth token issued on enrollment (populated once auth lands). */
  token?: string
}
