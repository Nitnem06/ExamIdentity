// Public Transparency Dashboard routes.
import type { FastifyPluginAsync } from 'fastify'
import { getTransparencyMetrics } from '../services/transparency/publicMetricsService'
import {
  captureSnapshot,
  getMetricTimeseries,
} from '../services/transparency/metricSnapshotService'
import { getTransparencyLogHealth } from '../services/transparency/transparencyHealthService'

const transparencyRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/transparency/metrics — full anonymized metrics payload
  app.get('/transparency/metrics', async () => getTransparencyMetrics())

  // GET /api/transparency/timeseries — trend history for charts
  app.get('/transparency/timeseries', async () => getMetricTimeseries())

  // GET /api/transparency/log-health — hash-chain integrity status
  app.get('/transparency/log-health', async () => getTransparencyLogHealth())

  // GET /api/transparency/snapshot — current tamper-evident snapshot
  app.get('/transparency/snapshot', async () => captureSnapshot())
}

export default transparencyRoutes
