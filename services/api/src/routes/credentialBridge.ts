// Cross-Platform Credential Bridge routes.
import type { FastifyPluginAsync } from 'fastify'
import type {
  CredentialBridgeOptions,
  CredentialExportRequest,
  ExportFormat,
  WalletPassLink,
} from '@examidentity/shared-types'
import { credentialRepository } from '../data'
import { exportCredential } from '../services/bridge/vcExportService'
import {
  createVerificationLink,
  verifyCredential,
} from '../services/bridge/qrVerificationService'
import { buildLinkedInShareLink } from '../services/bridge/linkedinShareService'
import { buildApplePassLink } from '../services/bridge/applePassService'
import { buildGoogleWalletLink } from '../services/bridge/googleWalletService'
import { buildOid4vciOfferLink } from '../services/bridge/oid4vciService'
import { config } from '../config'

const SUPPORTED_FORMATS: ExportFormat[] = ['VC_JSON', 'VP_JSON', 'VC_JWT', 'QR', 'PDF']

interface CredentialParams {
  credentialId: string
}

function buildPassLinks(credentialId: string, examName?: string): WalletPassLink[] {
  return [
    {
      target: 'DOWNLOAD_JSON',
      label: 'Download VC JSON',
      url: `${config.publicBaseUrl}/api/credential-bridge/${credentialId}/export?format=VC_JSON`,
      available: true,
    },
    {
      target: 'QR_LINK',
      label: 'Generate QR verification link',
      url: `${config.publicBaseUrl}/api/credential-bridge/${credentialId}/qr`,
      available: true,
    },
    buildLinkedInShareLink(credentialId, examName),
    buildApplePassLink(credentialId),
    buildGoogleWalletLink(credentialId),
    buildOid4vciOfferLink(credentialId),
  ]
}

const credentialBridgeRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/credential-bridge/:credentialId/options
  app.get<{ Params: CredentialParams }>(
    '/credential-bridge/:credentialId/options',
    async (request, reply) => {
      const { credentialId } = request.params
      const record = await credentialRepository.findById(credentialId)
      if (!record) {
        return reply.code(404).send({ error: 'Credential not found' })
      }
      const s = record.credential.credentialSubject
      const options: CredentialBridgeOptions = {
        credentialId,
        credentialType: record.credential.type.join(', '),
        examName: s.examName,
        issuingInstitution: s.issuingInstitution,
        supportedFormats: SUPPORTED_FORMATS,
        passLinks: buildPassLinks(credentialId, s.examName),
        qr: await createVerificationLink(credentialId),
      }
      return options
    },
  )

  // GET /api/credential-bridge/:credentialId/export?format=VC_JSON
  app.get<{ Params: CredentialParams; Querystring: { format?: ExportFormat } }>(
    '/credential-bridge/:credentialId/export',
    async (request, reply) => {
      const { credentialId } = request.params
      const format = request.query.format ?? 'VC_JSON'
      try {
        const result = await exportCredential({ credentialId, format } as CredentialExportRequest)
        return result
      } catch {
        return reply.code(404).send({ error: 'Credential not found' })
      }
    },
  )

  // POST /api/credential-bridge/export  { credentialId, format, holderDid?, audience? }
  app.post<{ Body: CredentialExportRequest }>(
    '/credential-bridge/export',
    async (request, reply) => {
      try {
        return await exportCredential(request.body)
      } catch {
        return reply.code(404).send({ error: 'Credential not found' })
      }
    },
  )

  // GET /api/credential-bridge/:credentialId/qr — mint a verification link
  app.get<{ Params: CredentialParams }>(
    '/credential-bridge/:credentialId/qr',
    async (request, reply) => {
      const { credentialId } = request.params
      try {
        return await createVerificationLink(credentialId)
      } catch {
        return reply.code(404).send({ error: 'Credential not found' })
      }
    },
  )

  // GET /api/credential-bridge/verify/:credentialId — verifier resolves a link
  app.get<{ Params: CredentialParams }>(
    '/credential-bridge/verify/:credentialId',
    async (request) => verifyCredential(request.params.credentialId),
  )
}

export default credentialBridgeRoutes
