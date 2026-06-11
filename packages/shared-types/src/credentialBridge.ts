// Cross-Platform Credential Bridge — shared domain types
//
// Types for exporting and sharing ExamIdentity verifiable credentials outside
// the platform: raw VC JSON, Verifiable Presentations, QR verification links,
// and wallet/social pass links (Apple Wallet, Google Wallet, LinkedIn,
// OID4VCI).

import type { ExamCredential } from './index'

/** Serialization formats a credential can be exported as. */
export type ExportFormat =
  | 'VC_JSON' // raw W3C Verifiable Credential 2.0 JSON
  | 'VC_JWT' // JWT-encoded VC (compact, signed)
  | 'VP_JSON' // Verifiable Presentation wrapping the VC
  | 'QR' // QR code encoding a verification link
  | 'PDF' // human-readable certificate (demo stub)

/** Destinations a credential can be pushed / shared to. */
export type WalletTarget =
  | 'DOWNLOAD_JSON'
  | 'QR_LINK'
  | 'APPLE_WALLET'
  | 'GOOGLE_WALLET'
  | 'LINKEDIN'
  | 'OID4VCI'

/** W3C Verifiable Presentation 2.0 wrapping one or more credentials. */
export interface VerifiablePresentation {
  '@context': string[]
  type: string[]
  /** DID of the holder presenting the credential. */
  holder: string
  verifiableCredential: ExamCredential[]
  /** Optional cryptographic proof (Ed25519). */
  proof?: Record<string, unknown>
}

/** Request body for POST /api/credential-bridge/export. */
export interface CredentialExportRequest {
  credentialId: string
  format: ExportFormat
  /** Holder DID (defaults to the credential subject). */
  holderDid?: string
  /** Intended audience / verifier (for VP / OID4VCI). */
  audience?: string
}

/** Result of an export operation. */
export interface CredentialExportResult {
  credentialId: string
  format: ExportFormat
  /** Suggested filename for download. */
  filename: string
  mimeType: string
  /** Serialized payload (JSON string, JWT, base64 PDF, etc.). */
  payload: string
  createdAt: string
}

/** A QR verification link a third party can scan to verify a credential. */
export interface QrVerificationLink {
  credentialId: string
  /** Absolute URL a verifier opens to validate the credential. */
  verificationUrl: string
  /** The exact string encoded into the QR image. */
  qrPayload: string
  /** Data URL of the rendered QR image (SVG/PNG), when generated. */
  qrImageDataUrl?: string
  expiresAt: string
  /** Whether the link is single-use. */
  oneTime: boolean
}

export type VerificationStatus =
  | 'VALID'
  | 'EXPIRED'
  | 'REVOKED'
  | 'TAMPERED'
  | 'UNKNOWN'

/** Result returned when a verifier resolves a QR verification link. */
export interface QrVerificationResult {
  credentialId: string
  verified: boolean
  status: VerificationStatus
  issuer: string
  /** Non-identifying summary, e.g. "Calculus II — HIGH integrity, 0 flags". */
  subjectSummary: string
  issuedAt: string
  checkedAt: string
  /**
   * Mock zero-knowledge privacy indicator for the MVP. When true the verifier
   * confirmed validity without the holder revealing the underlying evidence.
   */
  privacyProofVerified: boolean
}

/** A single shareable link/button rendered in the bridge panel. */
export interface WalletPassLink {
  target: WalletTarget
  label: string
  /** Action URL (deep link, OAuth share URL, .pkpass endpoint, etc.). */
  url: string
  /** Whether the integration is live or a demo stub in this build. */
  available: boolean
  /** Optional caption, e.g. "Demo stub — not a production pass". */
  note?: string
}

/** Aggregate options describing how a credential can be bridged out. */
export interface CredentialBridgeOptions {
  credentialId: string
  credentialType: string
  examName: string
  issuingInstitution: string
  supportedFormats: ExportFormat[]
  passLinks: WalletPassLink[]
  qr: QrVerificationLink
}
