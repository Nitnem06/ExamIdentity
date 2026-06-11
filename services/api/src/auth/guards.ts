// Authentication / authorization guards (preHandlers) built on @fastify/jwt.
import type { preHandlerHookHandler } from 'fastify'
import type { AuthPrincipal, Role } from '@examidentity/shared-types'

// Tell @fastify/jwt the shape of our token payload / request.user.
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthPrincipal
    user: AuthPrincipal
  }
}

/** Require a valid JWT; 401 otherwise. */
export const authenticate: preHandlerHookHandler = async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}

/** Require a valid JWT whose role is one of `roles`; 401/403 otherwise. */
export function authorizeRoles(...roles: Role[]): preHandlerHookHandler {
  return async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const user = request.user as AuthPrincipal
    if (!roles.includes(user.role)) {
      return reply.code(403).send({ error: 'Forbidden: requires role ' + roles.join(' or ') })
    }
  }
}
