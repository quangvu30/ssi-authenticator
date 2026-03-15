import { Buffer } from "buffer";
import CryptoJS from "crypto-js";
import { ec as EC } from "elliptic";

/**
 * ECDSA Key Pair
 */
export interface ECDSAKeyPair {
  publicKey: string; // base64 encoded
  privateKey: string; // base64 encoded
}

/**
 * ECDSA Signature
 */
export interface ECDSASignature {
  r: string; // base64 encoded
  s: string; // base64 encoded
  der?: string; // DER encoded signature (base64)
}

/**
 * Supported hash algorithms for ECDSA
 */
export type HashAlgorithm = "SHA256" | "SHA384" | "SHA512";

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
 * Get hash function for crypto-js
 */
function getHashFunction(
  algorithm: HashAlgorithm,
): (message: string) => CryptoJS.lib.WordArray {
  switch (algorithm) {
    case "SHA256":
      return CryptoJS.SHA256;
    case "SHA384":
      return CryptoJS.SHA384;
    case "SHA512":
      return CryptoJS.SHA512;
    default:
      return CryptoJS.SHA256;
  }
}

/**
 * Hash message with specified algorithm
 */
function hashMessage(
  message: string,
  algorithm: HashAlgorithm = "SHA256",
): string {
  const hashFunc = getHashFunction(algorithm);
  return hashFunc(message).toString();
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
 * Generate ECDSA key pair (P-256 curve)
 */
export async function generateKeyPair(): Promise<ECDSAKeyPair> {
  const privateKey = await generatePrivateKey();
  const publicKey = derivePublicKey(privateKey);

  return {
    privateKey,
    publicKey,
  };
}

/**
 * Sign a message using ECDSA
 */
export async function sign(
  message: string,
  privateKeyBase64: string,
  hashAlgorithm: HashAlgorithm = "SHA256",
): Promise<ECDSASignature> {
  const privateKeyHex = base64ToHex(privateKeyBase64);
  const keyPair = ec.keyFromPrivate(privateKeyHex, "hex");

  // Hash the message
  const messageHash = hashMessage(message, hashAlgorithm);

  // Sign the hash
  const signature = keyPair.sign(messageHash, { canonical: true });

  // Get r and s as hex strings
  const rHex = signature.r.toString(16).padStart(64, "0");
  const sHex = signature.s.toString(16).padStart(64, "0");

  // Get DER encoded signature
  const derHex = signature.toDER("hex");

  return {
    r: hexToBase64(rHex),
    s: hexToBase64(sHex),
    der: hexToBase64(derHex),
  };
}

/**
 * Verify an ECDSA signature
 */
export async function verify(
  message: string,
  signature: ECDSASignature | string,
  publicKeyBase64: string,
  hashAlgorithm: HashAlgorithm = "SHA256",
): Promise<boolean> {
  try {
    const publicKeyHex = base64ToHex(publicKeyBase64);
    const keyPair = ec.keyFromPublic(publicKeyHex, "hex");

    // Hash the message
    const messageHash = hashMessage(message, hashAlgorithm);

    // Parse signature
    if (typeof signature === "string") {
      // Assume DER format
      const derHex = base64ToHex(signature);
      return keyPair.verify(messageHash, derHex);
    } else {
      const rHex = base64ToHex(signature.r);
      const sHex = base64ToHex(signature.s);
      const sigObj = { r: rHex, s: sHex };
      return keyPair.verify(messageHash, sigObj);
    }
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Sign raw hash (useful when hash is already computed)
 */
export async function signHash(
  hashHex: string,
  privateKeyBase64: string,
): Promise<ECDSASignature> {
  const privateKeyHex = base64ToHex(privateKeyBase64);
  const keyPair = ec.keyFromPrivate(privateKeyHex, "hex");

  // Sign the hash
  const signature = keyPair.sign(hashHex, { canonical: true });

  // Get r and s as hex strings
  const rHex = signature.r.toString(16).padStart(64, "0");
  const sHex = signature.s.toString(16).padStart(64, "0");

  // Get DER encoded signature
  const derHex = signature.toDER("hex");

  return {
    r: hexToBase64(rHex),
    s: hexToBase64(sHex),
    der: hexToBase64(derHex),
  };
}

/**
 * Verify signature with raw hash
 */
export async function verifyHash(
  hashHex: string,
  signature: ECDSASignature | string,
  publicKeyBase64: string,
): Promise<boolean> {
  try {
    const publicKeyHex = base64ToHex(publicKeyBase64);
    const keyPair = ec.keyFromPublic(publicKeyHex, "hex");

    // Parse signature
    if (typeof signature === "string") {
      const derHex = base64ToHex(signature);
      return keyPair.verify(hashHex, derHex);
    } else {
      const rHex = base64ToHex(signature.r);
      const sHex = base64ToHex(signature.s);
      const sigObj = { r: rHex, s: sHex };
      return keyPair.verify(hashHex, sigObj);
    }
  } catch (error) {
    console.error("Hash verification error:", error);
    return false;
  }
}

/**
 * Create a compact signature (64 bytes for P-256)
 */
export function toCompactSignature(signature: ECDSASignature): string {
  const rHex = base64ToHex(signature.r);
  const sHex = base64ToHex(signature.s);
  return hexToBase64(rHex + sHex);
}

/**
 * Parse compact signature (64 bytes)
 */
export function fromCompactSignature(compactBase64: string): ECDSASignature {
  const compactHex = base64ToHex(compactBase64);
  if (compactHex.length !== 128) {
    throw new Error("Invalid compact signature length");
  }

  const rHex = compactHex.slice(0, 64);
  const sHex = compactHex.slice(64, 128);

  // Create DER signature
  const r = rHex;
  const s = sHex;

  // Simple DER encoding (not full implementation)
  const derHex = "30" + "44" + "02" + "20" + r + "02" + "20" + s;

  return {
    r: hexToBase64(rHex),
    s: hexToBase64(sHex),
    der: hexToBase64(derHex),
  };
}

/**
 * Recover public key from signature and message
 */
export async function recoverPublicKey(
  message: string,
  signature: ECDSASignature,
  recoveryId: 0 | 1 | 2 | 3 = 0,
  hashAlgorithm: HashAlgorithm = "SHA256",
): Promise<string | null> {
  try {
    // Hash the message
    const messageHash = hashMessage(message, hashAlgorithm);

    const rHex = base64ToHex(signature.r);
    const sHex = base64ToHex(signature.s);

    const sigObj = {
      r: rHex,
      s: sHex,
      recoveryParam: recoveryId,
    };

    // Recover public key
    const recoveredKey = ec.recoverPubKey(
      Buffer.from(messageHash, "hex"),
      sigObj,
      recoveryId,
    );

    const publicKeyHex = recoveredKey.encode("hex", false);
    return hexToBase64(publicKeyHex);
  } catch (error) {
    console.error("Public key recovery error:", error);
    return null;
  }
}
