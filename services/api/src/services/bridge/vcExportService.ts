// Verifiable Credential export service.
//
// Produces portable representations of an ExamIdentity credential: raw VC JSON,
// a signed Verifiable Presentation, a (mock) JWT, and a human-readable text
// certificate. Ed25519 signing is provided by @examidentity/crypto-utils.

import { generateKeyPair, sign, toHex } from '@examidentity/crypto-utils'
import type {
  CredentialExportRequest,
  CredentialExportResult,
  ExportFormat,
  VerifiablePresentation,
} from '@examidentity/shared-types'
import type { ExamCredential } from '@examidentity/shared-types'
import { credentialRepository } from '../../data'

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Wrap a credential in a signed W3C Verifiable Presentation. */
export function buildPresentation(
  credential: ExamCredential,
  holderDid?: string,
): VerifiablePresentation {
  const holder = holderDid ?? credential.credentialSubject.id
  const presentation: VerifiablePresentation = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://www.w3.org/2018/credentials/v1',
    ],
    type: ['VerifiablePresentation'],
    holder,
    verifiableCredential: [credential],
  }

  // Sign the presentation payload (MVP: ephemeral key, hex signature).
  const keyPair = generateKeyPair()
  const payload = JSON.stringify({
    holder,
    credentialId: credential.id,
    created: new Date().toISOString(),
  })
  const signature = sign(payload, keyPair.privateKey)
  presentation.proof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: `did:key:z${keyPair.publicKeyHex}#keys-1`,
    proofPurpose: 'authentication',
    proofValue: signature,
    publicKeyHex: toHex(keyPair.publicKey),
  }
  return presentation
}

function toJwt(credential: ExamCredential): string {
  const header = base64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }))
  const body = base64url(
    JSON.stringify({
      iss: credential.issuer,
      sub: credential.credentialSubject.id,
      vc: credential,
      iat: Math.floor(Date.now() / 1000),
    }),
  )
  const keyPair = generateKeyPair()
  const signature = base64url(sign(`${header}.${body}`, keyPair.privateKey))
  return `${header}.${body}.${signature}`
}

function toTextCertificate(credential: ExamCredential): string {
  const s = credential.credentialSubject
  const lines = [
    'EXAMIDENTITY — VERIFIABLE INTEGRITY CREDENTIAL',
    '================================================',
    `Exam:            ${s.examName}`,
    `Institution:     ${s.issuingInstitution}`,
    `Completed:       ${s.completedAt}`,
    `Integrity Band:  ${s.integrityScoreBand}`,
    `Flags:           ${s.flagCount}`,
    `Dispute Status:  ${s.disputeStatus}`,
    `Credential ID:   ${credential.id}`,
    `Issuer DID:      ${credential.issuer}`,
    `Subject DID:     ${s.id}`,
  ]
  return lines.join('\n')
}

const MIME: Record<ExportFormat, string> = {
  VC_JSON: 'application/json',
  VP_JSON: 'application/json',
  VC_JWT: 'application/jwt',
  QR: 'text/plain',
  PDF: 'text/plain', // MVP: plain-text certificate stub
}

export async function exportCredential(
  request: CredentialExportRequest,
): Promise<CredentialExportResult> {
  const record = await credentialRepository.findById(request.credentialId)
  if (!record) {
    throw new Error(`Credential not found: ${request.credentialId}`)
  }
  const credential = record.credential
  let payload: string

  switch (request.format) {
    case 'VC_JSON':
      payload = JSON.stringify(credential, null, 2)
      break
    case 'VP_JSON':
      payload = JSON.stringify(buildPresentation(credential, request.holderDid), null, 2)
      break
    case 'VC_JWT':
      payload = toJwt(credential)
      break
    case 'PDF':
      payload = toTextCertificate(credential)
      break
    case 'QR':
      payload = credential.id // verification link is minted by qrVerificationService
      break
    default:
      payload = JSON.stringify(credential, null, 2)
  }

  const extension: Record<ExportFormat, string> = {
    VC_JSON: 'json',
    VP_JSON: 'json',
    VC_JWT: 'jwt',
    QR: 'txt',
    PDF: 'txt',
  }

  return {
    credentialId: credential.id,
    format: request.format,
    filename: `${credential.id}.${extension[request.format]}`,
    mimeType: MIME[request.format],
    payload,
    createdAt: new Date().toISOString(),
  }
}
