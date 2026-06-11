// Enrollment service.
//
// Creates a student identity (did:key) and persists the public profile.
// Key custody:
//   - SELF_CUSTODY: private key is returned to the student ONCE and never stored.
//   - STANDARD: private key is encrypted under the platform key and stored at rest.

import { encrypt } from '@examidentity/crypto-utils'
import type {
  CustodyTier,
  EnrollmentRequest,
  EnrollmentResult,
  StudentProfile,
} from '@examidentity/shared-types'
import { config } from '../../config'
import { studentRepository, universityRepository } from '../../data'
import type { StudentRecord } from '../../data'
import { createDidKey } from './didService'

/** Map an internal student record to the public (secret-free) profile. */
export function toStudentProfile(record: StudentRecord): StudentProfile {
  return {
    did: record.did,
    universityId: record.universityId,
    universityDid: record.universityDid,
    publicKey: record.publicKey,
    custodyTier: record.custodyTier,
    accommodation: record.accommodation as StudentProfile['accommodation'],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export class EnrollmentError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'EnrollmentError'
  }
}

export async function enrollStudent(
  request: EnrollmentRequest,
): Promise<EnrollmentResult> {
  const university = await universityRepository.findById(request.universityId)
  if (!university) {
    throw new EnrollmentError(`Unknown university: ${request.universityId}`, 400)
  }

  const custodyTier: CustodyTier = request.custodyTier ?? 'STANDARD'
  const accommodation = request.accommodation ?? 'NONE'

  const { did, publicKeyHex, privateKeyHex } = createDidKey()

  // STANDARD: store the private key encrypted under the platform key.
  // SELF_CUSTODY: never persist the private key.
  const encryptedKey =
    custodyTier === 'STANDARD'
      ? JSON.stringify(encrypt(privateKeyHex, config.platformEncryptionKey))
      : null

  const record = await studentRepository.create({
    did,
    universityId: university.universityId,
    universityDid: university.did,
    publicKey: publicKeyHex,
    encryptedKey,
    custodyTier,
    accommodation,
  })

  return {
    profile: toStudentProfile(record),
    did,
    // Returned exactly once, only for self-custody enrollments.
    privateKey: custodyTier === 'SELF_CUSTODY' ? privateKeyHex : undefined,
  }
}
