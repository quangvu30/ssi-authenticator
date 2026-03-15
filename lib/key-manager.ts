import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ECDH from "./ecdh";
import * as ECDSA from "./ecdsa";

const ECDH_PRIVATE_KEY = "@ssi_ecdh_private_key";
const ECDH_PUBLIC_KEY = "@ssi_ecdh_public_key";
const ECDSA_PRIVATE_KEY = "@ssi_ecdsa_private_key";
const ECDSA_PUBLIC_KEY = "@ssi_ecdsa_public_key";

export interface AppKeyPairs {
  ecdh: {
    privateKey: string;
    publicKey: string;
  };
  ecdsa: {
    privateKey: string;
    publicKey: string;
  };
}

/**
 * Initialize or load existing key pairs
 * This should be called once when the app starts
 */
export async function initializeKeyPairs(): Promise<AppKeyPairs> {
  try {
    // Check if keys already exist
    const existingECDHPrivate = await AsyncStorage.getItem(ECDH_PRIVATE_KEY);
    const existingECDHPublic = await AsyncStorage.getItem(ECDH_PUBLIC_KEY);
    const existingECDSAPrivate = await AsyncStorage.getItem(ECDSA_PRIVATE_KEY);
    const existingECDSAPublic = await AsyncStorage.getItem(ECDSA_PUBLIC_KEY);

    // If all keys exist, return them
    if (
      existingECDHPrivate &&
      existingECDHPublic &&
      existingECDSAPrivate &&
      existingECDSAPublic
    ) {
      console.log("Loading existing key pairs");
      return {
        ecdh: {
          privateKey: existingECDHPrivate,
          publicKey: existingECDHPublic,
        },
        ecdsa: {
          privateKey: existingECDSAPrivate,
          publicKey: existingECDSAPublic,
        },
      };
    }

    // Generate new key pairs if any are missing
    console.log("Generating new key pairs");

    const ecdhKeyPair = await ECDH.generateKeyPair();
    const ecdsaKeyPair = await ECDSA.generateKeyPair();

    // Store the keys
    await AsyncStorage.multiSet([
      [ECDH_PRIVATE_KEY, ecdhKeyPair.privateKey],
      [ECDH_PUBLIC_KEY, ecdhKeyPair.publicKey],
      [ECDSA_PRIVATE_KEY, ecdsaKeyPair.privateKey],
      [ECDSA_PUBLIC_KEY, ecdsaKeyPair.publicKey],
    ]);

    console.log("Key pairs generated and stored successfully");

    return {
      ecdh: ecdhKeyPair,
      ecdsa: ecdsaKeyPair,
    };
  } catch (error) {
    console.error("Error initializing key pairs:", error);
    throw error;
  }
}

/**
 * Get ECDH key pair
 */
export async function getECDHKeyPair(): Promise<ECDH.ECDHKeyPair | null> {
  try {
    const privateKey = await AsyncStorage.getItem(ECDH_PRIVATE_KEY);
    const publicKey = await AsyncStorage.getItem(ECDH_PUBLIC_KEY);

    if (!privateKey || !publicKey) {
      return null;
    }

    return { privateKey, publicKey };
  } catch (error) {
    console.error("Error getting ECDH key pair:", error);
    return null;
  }
}

/**
 * Get ECDSA key pair
 */
export async function getECDSAKeyPair(): Promise<ECDSA.ECDSAKeyPair | null> {
  try {
    const privateKey = await AsyncStorage.getItem(ECDSA_PRIVATE_KEY);
    const publicKey = await AsyncStorage.getItem(ECDSA_PUBLIC_KEY);

    if (!privateKey || !publicKey) {
      return null;
    }

    return { privateKey, publicKey };
  } catch (error) {
    console.error("Error getting ECDSA key pair:", error);
    return null;
  }
}

/**
 * Get ECDH public key only
 */
export async function getECDHPublicKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ECDH_PUBLIC_KEY);
  } catch (error) {
    console.error("Error getting ECDH public key:", error);
    return null;
  }
}

/**
 * Get ECDSA public key only
 */
export async function getECDSAPublicKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ECDSA_PUBLIC_KEY);
  } catch (error) {
    console.error("Error getting ECDSA public key:", error);
    return null;
  }
}

/**
 * Clear all stored keys (use with caution!)
 */
export async function clearAllKeys(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      ECDH_PRIVATE_KEY,
      ECDH_PUBLIC_KEY,
      ECDSA_PRIVATE_KEY,
      ECDSA_PUBLIC_KEY,
    ]);
    console.log("All keys cleared");
  } catch (error) {
    console.error("Error clearing keys:", error);
    throw error;
  }
}

/**
 * Export all public keys for sharing/display
 */
export async function exportPublicKeys(): Promise<{
  ecdh: string | null;
  ecdsa: string | null;
} | null> {
  try {
    const ecdhPublic = await getECDHPublicKey();
    const ecdsaPublic = await getECDSAPublicKey();

    return {
      ecdh: ecdhPublic,
      ecdsa: ecdsaPublic,
    };
  } catch (error) {
    console.error("Error exporting public keys:", error);
    return null;
  }
}

/**
 * Check if keys are initialized
 */
export async function areKeysInitialized(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.multiGet([
      ECDH_PRIVATE_KEY,
      ECDH_PUBLIC_KEY,
      ECDSA_PRIVATE_KEY,
      ECDSA_PUBLIC_KEY,
    ]);

    return keys.every(([, value]) => value !== null);
  } catch (error) {
    console.error("Error checking keys:", error);
    return false;
  }
}
