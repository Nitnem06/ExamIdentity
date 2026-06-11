// Centralised environment configuration for the API service.
import 'dotenv/config'

function num(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 3001),
  host: process.env.HOST ?? '0.0.0.0',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  scoringServiceUrl: process.env.SCORING_SERVICE_URL ?? 'http://localhost:8000',
  realtimeServiceUrl: process.env.REALTIME_SERVICE_URL ?? 'http://localhost:8080',
  platformDid: process.env.PLATFORM_DID ?? 'did:key:zPlatformDemo',
  /** Hex Ed25519 private key the platform uses to sign issued credentials. */
  platformPrivateKey: process.env.PLATFORM_PRIVATE_KEY ?? '',
  /** Key used to encrypt STANDARD-custody student private keys at rest. */
  platformEncryptionKey:
    process.env.PLATFORM_ENCRYPTION_KEY ?? 'dev-platform-encryption-key-change-me',
  /** Secret for signing JWTs. */
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me-min-32-characters',
  /** JWT lifetime. */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  /** Shared secret to mint university/reviewer dev tokens (MVP only). */
  devAuthSecret: process.env.DEV_AUTH_SECRET ?? 'dev-auth-secret-change-me',
  /** k-anonymity threshold for public metrics (counts/rates below this are suppressed). */
  kAnonymity: num(process.env.K_ANONYMITY, 5),
  /** Base URL used when minting QR verification links. */
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001',
  /** Postgres connection string (matches infrastructure/docker/docker-compose.yml). */
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://examidentity:localpassword@localhost:5432/examidentity_dev',
  /**
   * Which repository implementation to use: 'postgres' | 'mock'.
   * Defaults to 'postgres' (the Docker DB); set DATA_SOURCE=mock to run without a database.
   */
  dataSource: (process.env.DATA_SOURCE ?? 'postgres') as 'postgres' | 'mock',
  isProd: process.env.NODE_ENV === 'production',
} as const

export type AppConfig = typeof config
