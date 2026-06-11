// Auth types for the web client (mirrors the API's identity/auth contract).

export type Role = 'student' | 'university' | 'reviewer'
export type CustodyTier = 'SELF_CUSTODY' | 'STANDARD'

export interface StudentProfile {
  did: string
  universityId: string
  universityDid: string
  publicKey: string
  custodyTier: CustodyTier
  accommodation: string
  createdAt: string
  updatedAt: string
}

export interface University {
  universityId: string
  name: string
  did: string
}

export interface EnrollResult {
  profile: StudentProfile
  did: string
  privateKey?: string
  token: string
}

export interface AuthMe {
  role: Role
  subject: string
  profile?: StudentProfile
}
