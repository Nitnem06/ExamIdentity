// apps/web/src/lib/api/credentialBridge.ts
//
// Adapts the real API (`GET /api/credential-bridge/:id/export`, `/qr`,
// `/verify/:id`) into the wallet UI's shapes. Wallet/OID4VCI remain offline
// stubs. Uses the shared, token-aware axios client.

import { apiClient } from './client'
import type {
  ExportFormat,
  OID4VCICredentialOffer,
  QRVerificationLink,
  VerifiableCredentialExport,
  VerifiableCredentialPayload,
  WalletPassLink,
} from '@/types/credentialBridge'

// ── Real API shapes ────────────────────────────────────────────
interface ApiExamCredential {
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    examName: string
    issuingInstitution: string
    institutionDid: string
    completedAt: string
    integrityScoreBand: 'HIGH' | 'MEDIUM' | 'LOW'
    flagCount: number
    disputeStatus: string
    sessionReference: string
  }
  proof?: {
    type?: string
    created?: string
    verificationMethod?: string
    proofPurpose?: string
    proofValue?: string
  }
}

interface ApiExportResult {
  credentialId: string
  format: string
  filename: string
  mimeType: string
  payload: string // serialized JSON for VC_JSON
  createdAt: string
}

interface ApiQrLink {
  credentialId: string
  verificationUrl: string
  qrPayload: string
  expiresAt: string
  oneTime: boolean
}

const BAND_TO_SCORE: Record<'HIGH' | 'MEDIUM' | 'LOW', number> = { HIGH: 95, MEDIUM: 75, LOW: 45 }

function toPayload(c: ApiExamCredential): VerifiableCredentialPayload {
  const s = c.credentialSubject
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/2018/credentials/v1'],
    type: c.type,
    id: c.id,
    issuer: c.issuer,
    issuanceDate: c.issuanceDate,
    credentialSubject: {
      id: s.id,
      examId: s.sessionReference,
      examTitle: s.examName,
      institutionName: s.issuingInstitution,
      completedAt: s.completedAt,
      integrityScore: BAND_TO_SCORE[s.integrityScoreBand],
      flagCount: s.flagCount,
    },
    proof: {
      type: c.proof?.type ?? 'Ed25519Signature2020',
      created: c.proof?.created ?? c.issuanceDate,
      verificationMethod: c.proof?.verificationMethod ?? `${c.issuer}#keys-1`,
      proofPurpose: c.proof?.proofPurpose ?? 'assertionMethod',
      proofValue: c.proof?.proofValue ?? '(unsigned demo credential)',
    },
  }
}

/** Export a credential. The real API serves VC JSON; we parse + adapt it. */
export async function exportCredential(
  credentialId: string,
  format: ExportFormat,
): Promise<VerifiableCredentialExport> {
  const { data } = await apiClient.get<ApiExportResult>(
    `/api/credential-bridge/${encodeURIComponent(credentialId)}/export`,
    { params: { format: 'VC_JSON' } },
  )
  const credential = JSON.parse(data.payload) as ApiExamCredential
  const payload = toPayload(credential)
  return {
    credentialId: credential.id,
    credentialType: 'ExamIntegrityCredential',
    format,
    payload,
    issuedAt: credential.issuanceDate,
    issuerDid: credential.issuer,
    subjectDid: credential.credentialSubject.id,
  }
}

/** Generate a QR verification link via the real API. */
export async function getQRLink(credentialId: string): Promise<QRVerificationLink> {
  const { data } = await apiClient.get<ApiQrLink>(
    `/api/credential-bridge/${encodeURIComponent(credentialId)}/qr`,
  )
  return {
    url: data.verificationUrl,
    credentialId: data.credentialId,
    shortCode: credentialId.replace(/^cred-/, '').slice(0, 6).toUpperCase(),
    expiresAt: data.expiresAt,
    verificationStatus: 'valid',
  }
}

/** Publicly verify a credential by id (no auth). */
export async function verifyCredentialPublic(
  credentialId: string,
): Promise<{ valid: boolean; reason?: string; checkedAt: string }> {
  const { data } = await apiClient.get<{ verified: boolean; status: string; checkedAt: string }>(
    `/api/credential-bridge/verify/${encodeURIComponent(credentialId)}`,
  )
  return { valid: data.verified, reason: data.status, checkedAt: data.checkedAt }
}

// ── Offline stubs (no backend call) ────────────────────────────
export async function getWalletPassLink(
  credentialId: string,
  platform: 'apple' | 'google',
): Promise<WalletPassLink> {
  return {
    platform,
    passUrl: '#',
    expiresAt: undefined,
    passSerialNumber: `${platform}-${credentialId}`,
  }
}

export async function getOID4VCIOffer(credentialId: string): Promise<OID4VCICredentialOffer> {
  return {
    credentialOfferUri: `openid-credential-offer://?credential_offer_uri=${
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
    }/oid4vci/offer/${credentialId}`,
    credentialType: 'ExamIntegrityCredential',
    pinRequired: false,
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  }
}
