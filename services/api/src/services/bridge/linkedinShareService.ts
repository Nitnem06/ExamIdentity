// LinkedIn share service (demo stub).
//
// Builds a LinkedIn "Add to Profile" / share URL for an exam credential.
// Production would use LinkedIn's certifications API with the org id; the MVP
// returns a pre-filled share link.

import type { WalletPassLink } from '@examidentity/shared-types'
import { config } from '../../config'

export function buildLinkedInShareLink(
  credentialId: string,
  examName = 'ExamIdentity Credential',
): WalletPassLink {
  const verifyUrl = `${config.publicBaseUrl}/wallet/export/${credentialId}`

  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${examName} — Integrity Verified`,
    organizationName: 'ExamIdentity',
    certUrl: verifyUrl,
    certId: credentialId,
  })

  return {
    target: 'LINKEDIN',
    label: 'Add to LinkedIn',
    url: `https://www.linkedin.com/profile/add?${params.toString()}`,
    available: true,
    note: 'Opens LinkedIn with the certification pre-filled.',
  }
}
