// University integrity report routes (Phase 6).
import type { FastifyPluginAsync } from 'fastify'
import type { AuthPrincipal } from '@examidentity/shared-types'
import { authorizeRoles } from '../auth/guards'
import { getStudentReport } from '../services/report/reportService'

interface DidParams {
  did: string
}

const reportRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/reports/students/:did — institutional report (staff only).
  app.get<{ Params: DidParams; Querystring: { universityId?: string } }>(
    '/reports/students/:did',
    { preHandler: authorizeRoles('university', 'reviewer') },
    async (request) => {
      const user = request.user as AuthPrincipal
      // A university token is scoped to its own institution (sub = universityId).
      const universityId =
        user.role === 'university' ? user.sub : request.query.universityId
      return getStudentReport(request.params.did, universityId)
    },
  )
}

export default reportRoutes
