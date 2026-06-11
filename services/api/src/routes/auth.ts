// Auth routes (Phase 2): DID challenge/response login + dev token issuance.
import type { FastifyPluginAsync } from 'fastify'
import type { AuthPrincipal, LoginRequest } from '@examidentity/shared-types'
import { config } from '../config'
import { studentRepository } from '../data'
import { toStudentProfile } from '../services/identity/enrollmentService'
import { createChallenge, verifyLogin } from '../auth/authService'
import { authenticate } from '../auth/guards'

const authRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/auth/me — validate the token and return the current principal.
  app.get('/auth/me', { preHandler: authenticate }, async (request) => {
    const user = request.user as AuthPrincipal
    if (user.role === 'student') {
      const record = await studentRepository.findByDid(user.sub)
      return {
        role: user.role,
        subject: user.sub,
        profile: record ? toStudentProfile(record) : undefined,
      }
    }
    return { role: user.role, subject: user.sub }
  })

  // POST /api/auth/challenge { did } -> nonce to sign
  app.post<{ Body: { did?: string } }>('/auth/challenge', async (request, reply) => {
    const did = request.body?.did
    if (!did) return reply.code(400).send({ error: 'did is required' })
    const student = await studentRepository.findByDid(did)
    if (!student) return reply.code(404).send({ error: 'Student not found' })
    return createChallenge(did)
  })

  // POST /api/auth/login { did, signature } -> JWT
  app.post<{ Body: LoginRequest }>('/auth/login', async (request, reply) => {
    const { did, signature } = request.body ?? ({} as LoginRequest)
    if (!did || !signature) {
      return reply.code(400).send({ error: 'did and signature are required' })
    }
    const ok = await verifyLogin(did, signature)
    if (!ok) {
      return reply.code(401).send({ error: 'Invalid signature or expired challenge' })
    }
    const student = await studentRepository.findByDid(did)
    const token = app.jwt.sign({ sub: did, role: 'student' })
    return {
      token,
      role: 'student',
      subject: did,
      profile: student ? toStudentProfile(student) : undefined,
    }
  })

  // POST /api/auth/dev-token { role, subject, secret } -> JWT (NON-PROD ONLY)
  // Issues university/reviewer tokens for testing until real SSO lands.
  // Disabled in production to remove the shared-secret backdoor.
  app.post<{ Body: { role?: string; subject?: string; secret?: string } }>(
    '/auth/dev-token',
    async (request, reply) => {
      if (config.isProd) {
        return reply.code(404).send({ error: 'Not found' })
      }
      const { role, subject, secret } = request.body ?? {}
      if (secret !== config.devAuthSecret) {
        return reply.code(403).send({ error: 'Forbidden' })
      }
      if (role !== 'university' && role !== 'reviewer') {
        return reply.code(400).send({ error: 'role must be "university" or "reviewer"' })
      }
      const sub = subject ?? role
      const token = app.jwt.sign({ sub, role })
      return { token, role, subject: sub }
    },
  )
}

export default authRoutes
