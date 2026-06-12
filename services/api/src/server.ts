// ExamIdentity API — Fastify server.
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { config } from './config'
import { closePool } from './data/db'
import { credentialRepository } from './data'
import explanationsRoutes from './routes/explanations'
import transparencyRoutes from './routes/transparency'
import credentialBridgeRoutes from './routes/credentialBridge'
import identityRoutes from './routes/identity'
import authRoutes from './routes/auth'
import sessionRoutes from './routes/sessions'
import disputeRoutes from './routes/disputes'
import reportRoutes from './routes/reports'
import meRoutes from './routes/me'
import { deleteExpiredEvidence } from './services/escrow/escrowService'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: config.isProd ? 'info' : 'debug',
    },
  })

  // Rate limiting: 120 requests/minute per IP by default.
  app.register(rateLimit, {
    max: config.isProd ? 120 : 1000,
    timeWindow: '1 minute',
  })

  // CORS for the Next.js web client.
  app.register(cors, {
    origin: [config.frontendUrl],
    credentials: true,
  })

  // JWT auth (request.jwtVerify(), app.jwt.sign()).
  app.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  })

  // Catch-all body parser: tolerate action POSTs that arrive with no body or a
  // non-JSON content type (e.g. state-transition endpoints). The built-in
  // application/json parser still handles JSON requests.
  app.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => {
    const buf = body as Buffer
    if (!buf || buf.length === 0) return done(null, undefined)
    try {
      done(null, JSON.parse(buf.toString()))
    } catch {
      done(null, buf.toString())
    }
  })

  // Liveness probe.
  app.get('/health', async () => ({ status: 'ok', service: 'api' }))

  // Lightweight catalog endpoint used by the web demo to list credentials.
  app.get('/api/credentials', async () => {
    const creds = await credentialRepository.list()
    return creds.map((c) => ({
      id: c.credential.id,
      examName: c.credential.credentialSubject.examName,
      integrityScoreBand: c.credential.credentialSubject.integrityScoreBand,
      issuingInstitution: c.credential.credentialSubject.issuingInstitution,
      status: c.status,
    }))
  })

  // Feature routes, all under /api.
  app.register(explanationsRoutes, { prefix: '/api' })
  app.register(transparencyRoutes, { prefix: '/api' })
  app.register(credentialBridgeRoutes, { prefix: '/api' })
  app.register(identityRoutes, { prefix: '/api' })
  app.register(authRoutes, { prefix: '/api' })
  app.register(sessionRoutes, { prefix: '/api' })
  app.register(disputeRoutes, { prefix: '/api' })
  app.register(reportRoutes, { prefix: '/api' })
  app.register(meRoutes, { prefix: '/api' })

  return app
}

async function start() {
  const app = buildServer()

  // Category B retention: scrub evidence past its 90-day window daily.
  const retentionTimer = setInterval(
    () => {
      void deleteExpiredEvidence()
        .then((ids) => {
          if (ids.length > 0) app.log.info(`Deleted ${ids.length} expired evidence record(s)`)
        })
        .catch((err) => app.log.error(err))
    },
    24 * 60 * 60 * 1000,
  )
  retentionTimer.unref?.()

  const shutdown = async () => {
    clearInterval(retentionTimer)
    await app.close()
    await closePool()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  try {
    await app.listen({ port: config.port, host: config.host })
    app.log.info(`Provora API running on http://${config.host}:${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Only auto-start when run directly (not when imported by tests).
if (require.main === module) {
  void start()
}
