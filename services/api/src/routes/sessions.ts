// Exam session lifecycle routes (Phase 3).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
  AuthPrincipal,
  CreateSessionRequest,
  EventIngestionRequest,
  SessionState,
  SessionStateTransitionRequest,
} from '@examidentity/shared-types'
import { sessionRepository } from '../data'
import { authenticate, authorizeRoles } from '../auth/guards'
import {
  SessionError,
  createSession,
  transitionSession,
} from '../services/session/sessionService'
import { ingestEvents } from '../services/session/eventService'
import {
  createSessionSchema,
  eventIngestionSchema,
  stateTransitionSchema,
  validate,
} from '../validation/schemas'

interface SessionParams {
  sessionId: string
}

/** Load a session and ensure the caller owns it (student) or is staff. */
async function loadOwned(
  request: FastifyRequest<{ Params: SessionParams }>,
  reply: FastifyReply,
) {
  const user = request.user as AuthPrincipal
  const session = await sessionRepository.findById(request.params.sessionId)
  if (!session) {
    reply.code(404).send({ error: 'Session not found' })
    return undefined
  }
  const isOwner = user.role === 'student' && user.sub === session.studentDid
  const isStaff = user.role === 'university' || user.role === 'reviewer'
  if (!isOwner && !isStaff) {
    reply.code(403).send({ error: 'Forbidden' })
    return undefined
  }
  return session
}

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof SessionError) {
    return reply.code(err.statusCode).send({ error: err.message })
  }
  reply.log.error(err)
  return reply.code(500).send({ error: 'Session operation failed' })
}

const sessionRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/sessions — list (staff only).
  app.get('/sessions', { preHandler: authorizeRoles('university', 'reviewer') }, async () =>
    sessionRepository.list(),
  )

  // POST /api/sessions — create a session (student for self, or university).
  app.post<{ Body: CreateSessionRequest }>(
    '/sessions',
    { preHandler: authorizeRoles('student', 'university') },
    async (request, reply) => {
      const user = request.user as AuthPrincipal
      const v = validate(createSessionSchema, request.body)
      if (!v.ok) return reply.code(400).send({ error: v.error })
      const body = v.data
      const studentDid = user.role === 'student' ? user.sub : body.studentDid
      if (!studentDid) {
        return reply.code(400).send({ error: 'studentDid is required' })
      }
      try {
        return await createSession(studentDid, body.examId, body.examName, body.accommodation)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/sessions/:sessionId — owner or staff.
  app.get<{ Params: SessionParams }>(
    '/sessions/:sessionId',
    { preHandler: authenticate },
    async (request, reply) => {
      const session = await loadOwned(request, reply)
      return session ?? reply
    },
  )

  // POST /api/sessions/:sessionId/state { toState } — guarded transition.
  app.post<{ Params: SessionParams; Body: SessionStateTransitionRequest }>(
    '/sessions/:sessionId/state',
    { preHandler: authenticate },
    async (request, reply) => {
      const session = await loadOwned(request, reply)
      if (!session) return reply
      const v = validate(stateTransitionSchema, request.body)
      if (!v.ok) return reply.code(400).send({ error: v.error })
      try {
        return await transitionSession(session.sessionId, v.data.toState)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/sessions/:sessionId/events — ingest behavioural signals.
  app.post<{ Params: SessionParams; Body: EventIngestionRequest }>(
    '/sessions/:sessionId/events',
    { preHandler: authenticate },
    async (request, reply) => {
      const session = await loadOwned(request, reply)
      if (!session) return reply
      const v = validate(eventIngestionSchema, request.body)
      if (!v.ok) return reply.code(400).send({ error: v.error })
      try {
        return await ingestEvents(session.sessionId, v.data)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // Convenience transitions.
  const convenience: Array<{ path: string; to: SessionState }> = [
    { path: 'verify-identity', to: 'IDENTITY_VERIFIED' },
    { path: 'start', to: 'IN_PROGRESS' },
    { path: 'complete', to: 'COMPLETED' },
    { path: 'abandon', to: 'INCOMPLETE' },
  ]
  for (const { path, to } of convenience) {
    app.post<{ Params: SessionParams }>(
      `/sessions/:sessionId/${path}`,
      { preHandler: authenticate },
      async (request, reply) => {
        const session = await loadOwned(request, reply)
        if (!session) return reply
        try {
          return await transitionSession(session.sessionId, to)
        } catch (err) {
          return handleError(err, reply)
        }
      },
    )
  }
}

export default sessionRoutes
