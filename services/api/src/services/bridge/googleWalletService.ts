// Google Wallet pass service (demo stub).
//
// Production would create a Generic pass class/object via the Google Wallet API
// and return a signed "save" JWT link. For the MVP we return the save URL shape
// and mark it as a stub.

import type { WalletPassLink } from '@examidentity/shared-types'

export function buildGoogleWalletLink(credentialId: string): WalletPassLink {
  // A real link is https://pay.google.com/gp/v/save/<signed-jwt>
  const placeholderJwt = `demo.${Buffer.from(credentialId).toString('base64url')}.stub`
  return {
    target: 'GOOGLE_WALLET',
    label: 'Add to Google Wallet',
    url: `https://pay.google.com/gp/v/save/${placeholderJwt}`,
    available: false,
    note: 'Demo stub — requires a Google Wallet issuer account and signed JWT.',
  }
}
