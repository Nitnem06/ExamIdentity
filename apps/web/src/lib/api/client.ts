import axios from 'axios'

/**
 * Shared axios instance for the ExamIdentity API.
 * Base URL comes from NEXT_PUBLIC_API_URL (defaults to the local API service).
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})
