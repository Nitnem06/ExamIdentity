// Repository selection: picks the mock or Postgres implementation based on
// config.dataSource. All feature code imports the repositories from here.

import { config } from '../config'
import {
  mockCredentialRepository,
  mockDisputeRepository,
  mockEscrowRepository,
  mockFlagRepository,
  mockSessionRepository,
  mockStudentRepository,
  mockUniversityRepository,
} from './mockStore'
import {
  pgCredentialRepository,
  pgDisputeRepository,
  pgEscrowRepository,
  pgFlagRepository,
  pgSessionRepository,
  pgStudentRepository,
  pgUniversityRepository,
} from './pgRepository'
import type {
  CredentialRepository,
  DisputeRepository,
  EscrowRepository,
  FlagRepository,
  SessionRepository,
  StudentRepository,
  UniversityRepository,
} from './types'

const usePostgres = config.dataSource === 'postgres'

export const sessionRepository: SessionRepository = usePostgres
  ? pgSessionRepository
  : mockSessionRepository

export const credentialRepository: CredentialRepository = usePostgres
  ? pgCredentialRepository
  : mockCredentialRepository

export const universityRepository: UniversityRepository = usePostgres
  ? pgUniversityRepository
  : mockUniversityRepository

export const studentRepository: StudentRepository = usePostgres
  ? pgStudentRepository
  : mockStudentRepository

export const flagRepository: FlagRepository = usePostgres
  ? pgFlagRepository
  : mockFlagRepository

export const escrowRepository: EscrowRepository = usePostgres
  ? pgEscrowRepository
  : mockEscrowRepository

export const disputeRepository: DisputeRepository = usePostgres
  ? pgDisputeRepository
  : mockDisputeRepository

export type {
  SessionRecord,
  CredentialRecord,
  StudentRecord,
  UniversityRecord,
  NewStudent,
  NewSession,
  FlagRecord,
  NewFlag,
  EscrowRecord,
  NewEscrow,
  DisputeRecord,
  NewDispute,
  DisputeResolution,
  SessionRepository,
  CredentialRepository,
  StudentRepository,
  UniversityRepository,
  FlagRepository,
  EscrowRepository,
  DisputeRepository,
} from './types'
