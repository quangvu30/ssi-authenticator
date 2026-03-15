import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";

/**
 * ECDH Key Pair
 */
export interface ECDHKeyPair {
  publicKey: string; // base64 encoded
  privateKey: string; // base64 encoded
}

/**
 * ECDH Key Exchange Result
 */
export interface ECDHResult {
  sharedSecret: string; // base64 encoded
}

// Initialize P-256 (secp256r1) curve
const ec = new EC("p256");

/**
 * Convert hex string to base64
 */
function hexToBase64(hex: string): string {
  const bytes =
    hex.match(/.{2}/g)?.map((byte: string) => parseInt(byte, 16)) || [];
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

/**
 * Convert base64 string to hex
 */
function base64ToHex(base64: string): string {
  const binary = atob(base64);
  return Array.from(binary)
    .map((char: string) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate ECDH key pair (P-256 curve)
 */
export async function generateKeyPair(): Promise<ECDHKeyPair> {
  // Generate random bytes for private key using crypto-js
  const privateKeyHex = CryptoJS.lib.WordArray.random(32).toString();

  // Create key pair from private key
  const keyPair = ec.keyFromPrivate(privateKeyHex, "hex");

  // Get public key in uncompressed format
  const publicKeyHex = keyPair.getPublic("hex");
  const privateKeyBase64 = hexToBase64(privateKeyHex);
  const publicKeyBase64 = hexToBase64(publicKeyHex);

  return {
    privateKey: privateKeyBase64,
    publicKey: publicKeyBase64,
  };
}

/**
 * Generate a random private key for P-256 curve
 */
export async function generatePrivateKey(): Promise<string> {
  const privateKeyHex = CryptoJS.lib.WordArray.random(32).toString();

  return hexToBase64(privateKeyHex);
}

/**
 * Derive public key from private key using P-256 curve
 */
export function derivePublicKey(privateKeyBase64: string): string {
  const privateKeyHex = base64ToHex(privateKeyBase64);
  const keyPair = ec.keyFromPrivate(privateKeyHex, "hex");
  const publicKeyHex = keyPair.getPublic("hex");
  return hexToBase64(publicKeyHex);
}

/**
 * Compute shared secret using ECDH
 */
export function computeSharedSecret(
  privateKeyBase64: string,
  publicKeyBase64: string,
): string {
  const privateKeyHex = base64ToHex(privateKeyBase64);
  const publicKeyHex = base64ToHex(publicKeyBase64);

  // Create key pair from private key
  const keyPair = ec.keyFromPrivate(privateKeyHex, "hex");

  // Parse public key
  const publicKey = ec.keyFromPublic(publicKeyHex, "hex");

  // Compute shared secret
  const sharedSecretHex = keyPair
    .derive(publicKey.getPublic())
    .toString(16)
    .padStart(64, "0");

  return hexToBase64(sharedSecretHex);
}

/**
 * Derive key material from shared secret using HKDF-like derivation
 */
export async function deriveKey(
  sharedSecretBase64: string,
  salt: string = "",
  info: string = "",
  length: number = 32,
): Promise<string> {
  // Simple key derivation using repeated hashing
  const input = sharedSecretBase64 + salt + info;

  let derived = CryptoJS.SHA256(input).toString();

  // If we need more bytes, hash again
  while (derived.length < length * 2) {
    derived += CryptoJS.SHA256(derived + input).toString();
  }

  return hexToBase64(derived.slice(0, length * 2));
}

/**
 * Perform full ECDH key exchange
 */
export async function performKeyExchange(
  privateKeyBase64: string,
  publicKeyBase64: string,
  salt?: string,
  info?: string,
): Promise<ECDHResult> {
  const sharedSecret = computeSharedSecret(privateKeyBase64, publicKeyBase64);

  // Optionally derive a key from the shared secret
  let finalSecret = sharedSecret;
  if (salt || info) {
    finalSecret = await deriveKey(sharedSecret, salt, info);
  }

  return {
    sharedSecret: finalSecret,
  };
}

/**
 * Verify if a public key is valid on the P-256 curve
 */
export function isValidPublicKey(publicKeyBase64: string): boolean {
  try {
    const publicKeyHex = base64ToHex(publicKeyBase64);
    const publicKey = ec.keyFromPublic(publicKeyHex, "hex");
    return publicKey.validate().result;
  } catch {
    return false;
  }
}

/**
 * Convert public key to compressed format
 */
export function compressPublicKey(publicKeyBase64: string): string {
  const publicKeyHex = base64ToHex(publicKeyBase64);
  const publicKey = ec.keyFromPublic(publicKeyHex, "hex");
  const compressedHex = publicKey.getPublic(true, "hex");
  return hexToBase64(compressedHex);
}

/**
 * Decompress public key from compressed format
 */
export function decompressPublicKey(compressedKeyBase64: string): string {
  const compressedKeyHex = base64ToHex(compressedKeyBase64);
  const publicKey = ec.keyFromPublic(compressedKeyHex, "hex");
  const decompressedHex = publicKey.getPublic(false, "hex");
  return hexToBase64(decompressedHex);
}

/**
 * Export public key in PEM format (simplified)
 */
export function exportPublicKeyPEM(publicKeyBase64: string): string {
  return `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
}

/**
 * Import public key from PEM format (simplified)
 */
export function importPublicKeyPEM(pem: string): string {
  const base64 = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");
  return base64;
}

/**
 * Generate a shared secret and immediately derive an AES key
 */
export async function deriveAESKey(
  privateKeyBase64: string,
  publicKeyBase64: string,
  keyLength: 256 | 128 = 256,
): Promise<string> {
  const sharedSecret = computeSharedSecret(privateKeyBase64, publicKeyBase64);
  const byteLength = keyLength / 8;
  return deriveKey(sharedSecret, "", "AES", byteLength);
}
