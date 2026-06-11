// Explainable Flag Cards routes.
import type { FastifyPluginAsync } from 'fastify'
import { getSessionExplanations } from '../services/session/flagExplanationService'
import type { AccommodationType } from '@examidentity/shared-types'

interface SessionParams {
  sessionId: string
}

interface ExplanationsQuery {
  accommodation?: AccommodationType
}

const explanationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/sessions/:sessionId/explanations?accommodation=SCREEN_READER
  app.get<{ Params: SessionParams; Querystring: ExplanationsQuery }>(
    '/sessions/:sessionId/explanations',
    async (request) => {
      const { sessionId } = request.params
      const { accommodation } = request.query
      return getSessionExplanations(sessionId, accommodation)
    },
  )
}

export default explanationsRoutes
