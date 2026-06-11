// Dispute pipeline routes (Phase 5).
import type { FastifyPluginAsync, FastifyReply } from 'fastify'
import type {
  AuthPrincipal,
  DisputeReview,
  DisputeSubmission,
} from '@examidentity/shared-types'
import { disputeRepository } from '../data'
import { authenticate, authorizeRoles } from '../auth/guards'
import {
  DisputeError,
  panelDispute,
  reviewDispute,
  submitDispute,
} from '../services/dispute/disputeService'

interface DisputeParams {
  disputeId: string
}

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof DisputeError) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  reply.log.error(err)
  return reply.code(500).send({ error: 'Dispute operation failed' })
}

const disputeRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/disputes — student submits a dispute (AI auto-resolve or escalate).
  app.post<{ Body: DisputeSubmission }>(
    '/disputes',
    { preHandler: authorizeRoles('student') },
    async (request, reply) => {
      const user = request.user as AuthPrincipal
      try {
        return await submitDispute(user.sub, request.body ?? ({} as DisputeSubmission))
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/disputes/:disputeId/review — tier-2 reviewer decision.
  app.post<{ Params: DisputeParams; Body: DisputeReview }>(
    '/disputes/:disputeId/review',
    { preHandler: authorizeRoles('reviewer') },
    async (request, reply) => {
      const user = request.user as AuthPrincipal
      try {
        return await reviewDispute(request.params.disputeId, user.sub, request.body ?? ({} as DisputeReview))
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/disputes/:disputeId/panel — tier-3 human panel decision.
  app.post<{ Params: DisputeParams; Body: DisputeReview }>(
    '/disputes/:disputeId/panel',
    { preHandler: authorizeRoles('reviewer') },
    async (request, reply) => {
      const user = request.user as AuthPrincipal
      try {
        return await panelDispute(request.params.disputeId, user.sub, request.body ?? ({} as DisputeReview))
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/disputes/:disputeId — owner (student) or staff.
  app.get<{ Params: DisputeParams }>(
    '/disputes/:disputeId',
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user as AuthPrincipal
      const dispute = await disputeRepository.findById(request.params.disputeId)
      if (!dispute) return reply.code(404).send({ error: 'Dispute not found' })
      const isOwner = user.role === 'student' && user.sub === dispute.studentDid
      const isStaff = user.role === 'university' || user.role === 'reviewer'
      if (!isOwner && !isStaff) return reply.code(403).send({ error: 'Forbidden' })
      return dispute
    },
  )
}

export default disputeRoutes
