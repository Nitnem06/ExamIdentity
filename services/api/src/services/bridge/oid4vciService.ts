// OID4VCI (OpenID for Verifiable Credential Issuance) service (demo stub).
//
// Production would expose a credential offer + issuer metadata so a compliant
// wallet can pull the credential. For the MVP we return a credential-offer
// deep link in the openid-credential-offer:// scheme.

import type { WalletPassLink } from '@examidentity/shared-types'
import { config } from '../../config'

export function buildOid4vciOfferLink(credentialId: string): WalletPassLink {
  const offer = {
    credential_issuer: config.publicBaseUrl,
    credential_configuration_ids: ['ExamIntegrityCredential'],
    grants: {
      'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
        'pre-authorized_code': `demo-${credentialId}`,
      },
    },
  }
  const encoded = encodeURIComponent(JSON.stringify(offer))
  return {
    target: 'OID4VCI',
    label: 'Import via OID4VCI wallet',
    url: `openid-credential-offer://?credential_offer=${encoded}`,
    available: false,
    note: 'Demo stub — credential offer is illustrative and not yet signed/registered.',
  }
}
