export type ExportFormat =
  | 'vc_json'
  | 'qr_link'
  | 'apple_wallet'
  | 'google_wallet'
  | 'linkedin'
  | 'oid4vci'

export type CredentialType =
  | 'ExamIntegrityCredential'
  | 'ExamCompletionCredential'
  | 'AccommodationCredential'

export interface VerifiableCredentialPayload {
  '@context': string[]
  type: string[]
  id: string
  issuer: string           // issuer DID
  issuanceDate: string
  expirationDate?: string
  credentialSubject: {
    id: string             // student DID
    examId: string
    examTitle: string
    institutionName: string
    completedAt: string
    integrityScore?: number
    flagCount?: number
    accommodationsApplied?: string[]
  }
  proof: {
    type: string           // 'Ed25519Signature2020'
    created: string
    verificationMethod: string
    proofPurpose: string
    proofValue: string
  }
}

export interface VerifiableCredentialExport {
  credentialId: string
  credentialType: CredentialType
  format: ExportFormat
  payload: VerifiableCredentialPayload
  issuedAt: string
  expiresAt?: string
  issuerDid: string
  subjectDid: string
}

export interface QRVerificationLink {
  url: string
  credentialId: string
  shortCode: string
  expiresAt: string
  verificationStatus: 'valid' | 'expired' | 'revoked' | 'pending'
}

export interface WalletPassLink {
  platform: 'apple' | 'google'
  passUrl: string
  deepLink?: string
  expiresAt?: string
  passSerialNumber?: string
}

export interface LinkedInSharePayload {
  title: string
  description: string
  organizationId?: string   // LinkedIn organization ID for the issuer
  certUrl: string
  credentialId: string
  issuedAt: string
}

export interface OID4VCICredentialOffer {
  credentialOfferUri: string
  credentialType: CredentialType
  issuerState?: string
  pinRequired: boolean
  expiresAt: string
  rawOffer?: object
}

export interface ExportFormatOption {
  id: ExportFormat
  label: string
  description: string
  icon: string
  isStub?: boolean          // MVP: mark demo-only stubs
  available: boolean
}

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    id: 'vc_json',
    label: 'Credential JSON',
    description: 'Download the raw W3C Verifiable Credential as a signed JSON file.',
    icon: '📄',
    available: true,
  },
  {
    id: 'qr_link',
    label: 'QR Verification Link',
    description: 'Share a QR code anyone can scan to verify this credential.',
    icon: '⬛',
    available: true,
  },
  {
    id: 'apple_wallet',
    label: 'Apple Wallet',
    description: 'Add to your iPhone Wallet app.',
    icon: '🍎',
    isStub: true,
    available: true,
  },
  {
    id: 'google_wallet',
    label: 'Google Wallet',
    description: 'Add to your Google Wallet on Android.',
    icon: '🌐',
    isStub: true,
    available: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Certificate',
    description: 'Add this credential directly to your LinkedIn profile.',
    icon: '💼',
    isStub: true,
    available: true,
  },
  {
    id: 'oid4vci',
    label: 'OID4VCI Offer',
    description: 'Claim via any OpenID4VCI-compatible digital wallet.',
    icon: '🔗',
    isStub: true,
    available: true,
  },
]