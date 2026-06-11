// @examidentity/crypto-utils
// Ed25519 signing, SHA-256 Merkle proofs, and AES-256-GCM evidence encryption.

export {
  generateKeyPair,
  sign,
  verify,
  toHex,
  fromHex,
  publicKeyToDidKey,
  type KeyPair,
} from './signing'

export {
  computeMerkleRoot,
  getMerkleProof,
  verifyMerkleProof,
  hashLeaf,
  hashNodes,
  chainEntryHash,
  type MerkleProofStep,
} from './merkle'

export {
  encrypt,
  decrypt,
  deriveEscrowKey,
  sha256Hex,
  type EncryptedPayload,
} from './encryption'
