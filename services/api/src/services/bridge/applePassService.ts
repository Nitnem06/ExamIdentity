// Apple Wallet pass service (demo stub).
//
// Production would generate and sign a .pkpass bundle (requires an Apple
// developer Pass Type ID + certificate). For the MVP we expose the endpoint
// that would stream the pass and mark the integration as a stub.

import type { WalletPassLink } from '@examidentity/shared-types'
import { config } from '../../config'

export function buildApplePassLink(credentialId: string): WalletPassLink {
  return {
    target: 'APPLE_WALLET',
    label: 'Add to Apple Wallet',
    url: `${config.publicBaseUrl}/api/credential-bridge/${credentialId}/apple.pkpass`,
    available: false,
    note: 'Demo stub — requires an Apple Pass Type ID certificate to sign the .pkpass.',
  }
}
