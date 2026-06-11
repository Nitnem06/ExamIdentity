import axios from 'axios'
import { getToken } from '../auth/session'

/**
 * Shared axios instance for the ExamIdentity API.
 * Base URL comes from NEXT_PUBLIC_API_URL (defaults to the local API service).
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT (if present) to every request.
apiClient.interceptors.request.use((cfg) => {
  const token = getToken()
  if (token) {
    cfg.headers = cfg.headers ?? {}
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})
