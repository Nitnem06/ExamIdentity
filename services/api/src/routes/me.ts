// Student self-service routes (the logged-in student's own data).
import type { FastifyPluginAsync } from 'fastify'
import type { AuthPrincipal } from '@examidentity/shared-types'
import { credentialRepository, sessionRepository } from '../data'
import { authorizeRoles } from '../auth/guards'

const meRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/me/sessions — the caller's own exam sessions.
  app.get('/me/sessions', { preHandler: authorizeRoles('student') }, async (request) => {
    const user = request.user as AuthPrincipal
    const all = await sessionRepository.list()
    return all.filter((s) => s.studentDid === user.sub)
  })

  // GET /api/me/credentials — the caller's own credentials (wallet).
  app.get('/me/credentials', { preHandler: authorizeRoles('student') }, async (request) => {
    const user = request.user as AuthPrincipal
    const creds = await credentialRepository.findByStudent(user.sub)
    return creds.map((c) => ({
      id: c.credential.id,
      examName: c.credential.credentialSubject.examName,
      issuingInstitution: c.credential.credentialSubject.issuingInstitution,
      integrityScoreBand: c.credential.credentialSubject.integrityScoreBand,
      flagCount: c.credential.credentialSubject.flagCount,
      issuanceDate: c.credential.issuanceDate,
      status: c.status,
    }))
  })
}

export default meRoutes
