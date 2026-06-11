// apps/web/src/lib/api/me.ts
// The logged-in student's own data (requires a valid token).
import { apiClient } from './client'

export interface MySession {
  sessionId: string
  examId: string
  examName: string
  state: string
  accommodation: string
  integrityScoreBand?: 'HIGH' | 'MEDIUM' | 'LOW'
  startedAt?: string
  completedAt?: string
}

export interface MyCredential {
  id: string
  examName: string
  issuingInstitution: string
  integrityScoreBand: 'HIGH' | 'MEDIUM' | 'LOW'
  flagCount: number
  issuanceDate: string
  status: string
}

export async function getMySessions(): Promise<MySession[]> {
  const { data } = await apiClient.get<MySession[]>('/api/me/sessions')
  return data
}

export async function getMyCredentials(): Promise<MyCredential[]> {
  const { data } = await apiClient.get<MyCredential[]>('/api/me/credentials')
  return data
}
