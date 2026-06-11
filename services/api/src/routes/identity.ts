// Identity & enrollment routes (Phase 1) + token issuance (Phase 2).
import type { FastifyPluginAsync } from 'fastify'
import type { AuthPrincipal, EnrollmentRequest } from '@examidentity/shared-types'
import { studentRepository, universityRepository } from '../data'
import {
  EnrollmentError,
  enrollStudent,
  toStudentProfile,
} from '../services/identity/enrollmentService'
import { authenticate } from '../auth/guards'
import { enrollSchema, validate } from '../validation/schemas'

interface DidParams {
  did: string
}

const identityRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/universities — registered institutions (for enrollment UI).
  app.get('/universities', async () => universityRepository.list())

  // POST /api/enroll — create a student identity (did:key) + profile + token.
  app.post<{ Body: EnrollmentRequest }>('/enroll', async (request, reply) => {
    const v = validate(enrollSchema, request.body)
    if (!v.ok) return reply.code(400).send({ error: v.error })
    try {
      const result = await enrollStudent(v.data)
      const token = app.jwt.sign({ sub: result.did, role: 'student' })
      return { ...result, token }
    } catch (err) {
      if (err instanceof EnrollmentError) {
        return reply.code(err.statusCode).send({ error: err.message })
      }
      request.log.error(err)
      return reply.code(500).send({ error: 'Enrollment failed' })
    }
  })

  // GET /api/students/:did/profile — the student themselves, or staff, only.
  app.get<{ Params: DidParams }>(
    '/students/:did/profile',
    { preHandler: authenticate },
    async (request, reply) => {
      const { did } = request.params
      const user = request.user as AuthPrincipal
      const isOwner = user.role === 'student' && user.sub === did
      const isStaff = user.role === 'university' || user.role === 'reviewer'
      if (!isOwner && !isStaff) {
        return reply.code(403).send({ error: 'Forbidden' })
      }
      const record = await studentRepository.findByDid(did)
      if (!record) {
        return reply.code(404).send({ error: 'Student not found' })
      }
      return toStudentProfile(record)
    },
  )
}

export default identityRoutes
