import CryptoJS from "crypto-js";

/**
 * TOTP Algorithm types
 */
export type Algorithm = "SHA1" | "SHA256" | "SHA512";

/**
 * TOTP Account configuration
 */
export interface TOTPAccount {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm?: Algorithm;
  digits?: number;
  period?: number;
}

/**
 * Parse result for otpauth:// URI
 */
export interface ParsedOTPAuth {
  type: "totp" | "hotp";
  issuer?: string;
  label: string;
  secret: string;
  algorithm?: Algorithm;
  digits?: number;
  period?: number;
  counter?: number;
}

/**
 * Decode base32 string to Uint8Array
 * Used for decoding TOTP secrets
 */
export function base32Decode(base32: string): Uint8Array {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanedInput = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");

  let bits = "";
  for (let i = 0; i < cleanedInput.length; i++) {
    const val = base32Chars.indexOf(cleanedInput[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }

  return bytes;
}

/**
 * Encode Uint8Array to base32 string
 */
export function base32Encode(data: Uint8Array): string {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";

  for (let i = 0; i < data.length; i++) {
    bits += data[i].toString(2).padStart(8, "0");
  }

  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, "0");
    result += base32Chars[parseInt(chunk, 2)];
  }

  return result;
}

/**
 * Generate HMAC-based hash using CryptoJS
 */
function hmac(
  key: Uint8Array,
  message: Uint8Array,
  algorithm: Algorithm = "SHA1",
): Uint8Array {
  // Convert Uint8Array to WordArray
  const keyWords = CryptoJS.lib.WordArray.create(Array.from(key) as any);
  const messageWords = CryptoJS.lib.WordArray.create(
    Array.from(message) as any,
  );

  let hmacResult;
  switch (algorithm) {
    case "SHA256":
      hmacResult = CryptoJS.HmacSHA256(messageWords, keyWords);
      break;
    case "SHA512":
      hmacResult = CryptoJS.HmacSHA512(messageWords, keyWords);
      break;
    case "SHA1":
    default:
      hmacResult = CryptoJS.HmacSHA1(messageWords, keyWords);
      break;
  }

  // Convert WordArray back to Uint8Array
  const hexStr = hmacResult.toString(CryptoJS.enc.Hex);
  const bytes = new Uint8Array(hexStr.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
  }

  return bytes;
}

/**
 * Generate HOTP code (counter-based OTP)
 */
function generateHOTP(
  secret: Uint8Array,
  counter: number,
  digits: number = 6,
  algorithm: Algorithm = "SHA1",
): string {
  // Convert counter to 8-byte array (big-endian)
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter = counter >> 8;
  }

  // Generate HMAC
  const hash = hmac(secret, counterBytes, algorithm);

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const truncatedHash =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  // Generate OTP
  const otp = truncatedHash % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Generate TOTP code (time-based OTP)
 */
export async function generateTOTP(
  secret: string,
  options: {
    algorithm?: Algorithm;
    digits?: number;
    period?: number;
    timestamp?: number;
  } = {},
): Promise<string> {
  const {
    algorithm = "SHA1",
    digits = 6,
    period = 30,
    timestamp = Date.now(),
  } = options;

  const secretBytes = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / period);

  return generateHOTP(secretBytes, counter, digits, algorithm);
}

/**
 * Get the time remaining (in seconds) for the current TOTP code
 */
export function getTimeRemaining(
  period: number = 30,
  timestamp: number = Date.now(),
): number {
  const elapsed = Math.floor(timestamp / 1000) % period;
  return period - elapsed;
}

/**
 * Get progress percentage for current TOTP code (0-1)
 */
export function getProgress(
  period: number = 30,
  timestamp: number = Date.now(),
): number {
  const elapsed = Math.floor(timestamp / 1000) % period;
  return elapsed / period;
}

/**
 * Parse otpauth:// URI
 * Format: otpauth://totp/ISSUER:LABEL?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
 */
export function parseOTPAuthUri(uri: string): ParsedOTPAuth | null {
  try {
    const url = new URL(uri);

    if (url.protocol !== "otpauth:") {
      return null;
    }

    const type = url.hostname as "totp" | "hotp";
    if (type !== "totp" && type !== "hotp") {
      return null;
    }

    // Parse label (format: issuer:accountname or just accountname)
    const pathParts = decodeURIComponent(url.pathname.substring(1)).split(":");
    const label = pathParts.length > 1 ? pathParts[1] : pathParts[0];
    const pathIssuer = pathParts.length > 1 ? pathParts[0] : undefined;

    // Parse query parameters
    const secret = url.searchParams.get("secret");
    if (!secret) {
      return null;
    }

    const issuer = url.searchParams.get("issuer") || pathIssuer;
    const algorithm =
      (url.searchParams.get("algorithm") as Algorithm) || "SHA1";
    const digits = parseInt(url.searchParams.get("digits") || "6", 10);
    const period = parseInt(url.searchParams.get("period") || "30", 10);
    const counter = url.searchParams.get("counter")
      ? parseInt(url.searchParams.get("counter")!, 10)
      : undefined;

    return {
      type,
      issuer,
      label,
      secret: secret.toUpperCase(),
      algorithm,
      digits,
      period,
      counter,
    };
  } catch (error) {
    console.error("Failed to parse otpauth URI:", error);
    return null;
  }
}

/**
 * Generate otpauth:// URI from account details
 */
export function generateOTPAuthUri(account: {
  type?: "totp" | "hotp";
  issuer?: string;
  label: string;
  secret: string;
  algorithm?: Algorithm;
  digits?: number;
  period?: number;
  counter?: number;
}): string {
  const {
    type = "totp",
    issuer,
    label,
    secret,
    algorithm = "SHA1",
    digits = 6,
    period = 30,
    counter,
  } = account;

  const encodedLabel = issuer
    ? `${encodeURIComponent(issuer)}:${encodeURIComponent(label)}`
    : encodeURIComponent(label);

  const params = new URLSearchParams({
    secret: secret.toUpperCase(),
    algorithm,
    digits: digits.toString(),
  });

  if (issuer) {
    params.append("issuer", issuer);
  }

  if (type === "totp") {
    params.append("period", period.toString());
  } else if (type === "hotp" && counter !== undefined) {
    params.append("counter", counter.toString());
  }

  return `otpauth://${type}/${encodedLabel}?${params.toString()}`;
}

/**
 * Validate if a string is a valid base32 secret
 */
export function isValidBase32(secret: string): boolean {
  const base32Regex = /^[A-Z2-7]+=*$/;
  return base32Regex.test(secret.toUpperCase().replace(/\s/g, ""));
}

/**
 * Generate a random base32 secret
 */
export function generateSecret(length: number = 32): string {
  const bytes = CryptoJS.lib.WordArray.random(length);
  const uint8Array = new Uint8Array(length);
  const words = bytes.words;

  for (let i = 0; i < length; i++) {
    const wordIndex = Math.floor(i / 4);
    const byteIndex = 3 - (i % 4);
    uint8Array[i] = (words[wordIndex] >>> (byteIndex * 8)) & 0xff;
  }

  return base32Encode(uint8Array);
}

/**
 * Format secret with spaces for better readability
 * Example: ABCDEFGH12345678 => ABCD EFGH 1234 5678
 */
export function formatSecret(secret: string, groupSize: number = 4): string {
  const cleaned = secret.replace(/\s/g, "");
  const groups = cleaned.match(new RegExp(`.{1,${groupSize}}`, "g")) || [];
  return groups.join(" ");
}
