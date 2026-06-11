# Cross-Platform Credential Bridge

Proves that ExamIdentity credentials are **portable**. A student can export or
share their integrity credential outside the platform — as W3C Verifiable
Credential JSON, a signed Verifiable Presentation, a QR verification link, or a
wallet/social pass.

## MVP scope

| Capability | Status |
| --- | --- |
| VC JSON export | ✅ implemented |
| Verifiable Presentation (Ed25519-signed) | ✅ implemented |
| JWT export | ✅ implemented (compact, signed) |
| Text certificate (PDF stub) | ✅ implemented (plain text) |
| QR verification link + verifier result | ✅ implemented |
| LinkedIn "Add to Profile" | ✅ pre-filled share link |
| Apple Wallet / Google Wallet / OID4VCI | 🟡 polished demo stubs |

Apple Wallet, Google Wallet and OID4VCI require issuer certificates / accounts
to produce real, signed passes; they are exposed as clearly-labelled stubs.

## Data contract

Shared types in `packages/shared-types/src/credentialBridge.ts`:

- `ExportFormat` — `VC_JSON | VC_JWT | VP_JSON | QR | PDF`
- `CredentialExportResult` — `{ filename, mimeType, payload, ... }`
- `QrVerificationLink` — verification URL + QR payload + expiry
- `QrVerificationResult` — `{ verified, status, subjectSummary,
  privacyProofVerified }` (the last is a **mock zero-knowledge** indicator for
  the MVP)
- `WalletPassLink` — `{ target, label, url, available, note }`
- `CredentialBridgeOptions` — everything the export page needs in one call

## Services (API · TypeScript / Fastify)

- `src/services/bridge/vcExportService.ts` — serializes the credential to each
  format; `buildPresentation` wraps it in a VP and signs with Ed25519 via
  `@examidentity/crypto-utils`.
- `src/services/bridge/qrVerificationService.ts` — mints short-lived (15 min)
  verification links with a tamper-evident token, and resolves them to a
  non-identifying `QrVerificationResult`.
- `linkedinShareService.ts`, `applePassService.ts`, `googleWalletService.ts`,
  `oid4vciService.ts` — build the `WalletPassLink`s.
- `src/routes/credentialBridge.ts`
  - `GET /api/credential-bridge/:credentialId/options`
  - `GET /api/credential-bridge/:credentialId/export?format=VC_JSON`
  - `POST /api/credential-bridge/export`
  - `GET /api/credential-bridge/:credentialId/qr`
  - `GET /api/credential-bridge/verify/:credentialId`

## Web (Next.js)

- Page: `src/app/wallet/export/[credentialId]/page.tsx`
- `src/components/wallet/CredentialBridgePanel.tsx` — orchestrates everything.
- `WalletExportOptions.tsx` + `CredentialExportPreview.tsx` — format picker and
  payload preview with a **Download** action.
- `QRCodeVerifier.tsx` — generates the verification link and simulates a
  verifier scan, surfacing the `privacyProofVerified` badge.
- `LinkedInShareButton.tsx`, `AppleWalletPassButton.tsx`,
  `GoogleWalletPassButton.tsx` — share/pass buttons (disabled for stubs).
- Libs: `src/lib/api/credentialBridge.ts`,
  `src/lib/wallet/{credentialExport,presentationBuilder,walletPassLinks}.ts`.

> Note: no QR-image library is bundled in the MVP, so the QR is rendered as a
> placeholder with the encoded URL shown and copyable. Add `qrcode` (or render
> `qrImageDataUrl` from the API) to produce a scannable image.

## Try it

```bash
pnpm --filter @examidentity/api dev   # port 3001
pnpm --filter web dev                 # port 3000
# open http://localhost:3000/wallet/export/cred-001
```

## Privacy note

Verification returns only a non-identifying summary (exam name, integrity band,
flag count) plus a validity status. The `privacyProofVerified` flag stands in
for a future zero-knowledge proof that will let a verifier confirm validity
(and threshold/accommodation/no-unresolved-misconduct claims) without the holder
revealing the underlying evidence.
