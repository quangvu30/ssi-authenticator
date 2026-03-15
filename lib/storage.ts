import { AuthenticatorAccount } from "@/components/authenticator-item";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ECDH from "./ecdh";
import { getECDHKeyPair } from "./key-manager";
import * as OTP from "./otp";

const STORAGE_KEY = "@ssi_authenticator_accounts";

/**
 * Generate TOTP code from ECDH shared secret
 */
async function generateTOTPFromECDH(
  remotePublicKey: string,
  timestamp: number = Date.now(),
): Promise<string> {
  try {
    // Get our ECDH key pair
    const keyPair = await getECDHKeyPair();
    if (!keyPair) {
      throw new Error("ECDH key pair not initialized");
    }

    // Compute shared secret
    const sharedSecret = ECDH.computeSharedSecret(
      keyPair.privateKey,
      remotePublicKey,
    );

    // Use shared secret as TOTP secret (convert base64 to base32 format)
    // For simplicity, we'll use the shared secret directly with OTP generation
    return await OTP.generateTOTP(sharedSecret, {
      algorithm: "SHA256",
      digits: 6,
      period: 30,
      timestamp,
    });
  } catch (error) {
    console.error("Error generating TOTP from ECDH:", error);
    // Fallback to simple generation
    return generateTOTPCode(remotePublicKey.slice(0, 16), timestamp);
  }
}

// Generate a 6-digit code based on secret and timestamp
// This is a simplified version - in production, use proper TOTP algorithm
export function generateTOTPCode(
  secret: string,
  timestamp: number = Date.now(),
): string {
  // Simple hash-based generation for demo purposes
  const timeStep = Math.floor(timestamp / 30000); // 30-second intervals
  const hash = (secret + timeStep).split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, "0");
}

// Load all accounts from storage
export async function loadAccounts(): Promise<AuthenticatorAccount[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const accounts = JSON.parse(data);
    // Generate current codes for each account
    const accountsWithCodes = await Promise.all(
      accounts.map(async (account: any) => {
        let code: string;

        if (account.publicKey) {
          // New format: use ECDH key exchange
          code = await generateTOTPFromECDH(account.publicKey);
        } else {
          // Legacy format: use direct secret
          code = generateTOTPCode(account.secret || account.id);
        }

        return {
          ...account,
          code,
        };
      }),
    );

    return accountsWithCodes;
  } catch (error) {
    console.error("Error loading accounts:", error);
    return [];
  }
}

// Save all accounts to storage
export async function saveAccounts(
  accounts: AuthenticatorAccount[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("Error saving accounts:", error);
    throw error;
  }
}

// Add a new account
export async function addAccount(
  issuer: string,
  account: string,
  secretOrPublicKey?: string,
  isPublicKey: boolean = false,
): Promise<AuthenticatorAccount> {
  try {
    const accounts = await loadAccounts();

    let code: string;
    let accountData: any = {
      id: Date.now().toString(),
      issuer,
      account,
    };

    if (isPublicKey && secretOrPublicKey) {
      // New format: ECDH public key
      code = await generateTOTPFromECDH(secretOrPublicKey);
      accountData.publicKey = secretOrPublicKey;
    } else {
      // Legacy format: direct secret
      const secret = secretOrPublicKey || Date.now().toString();
      code = generateTOTPCode(secret);
      accountData.secret = secret;
    }

    const newAccount: AuthenticatorAccount = {
      ...accountData,
      code,
    };

    accounts.push(newAccount);
    await saveAccounts(accounts);

    return newAccount;
  } catch (error) {
    console.error("Error adding account:", error);
    throw error;
  }
}

// Delete an account
export async function deleteAccount(id: string): Promise<void> {
  try {
    const accounts = await loadAccounts();
    const filteredAccounts = accounts.filter((account) => account.id !== id);
    await saveAccounts(filteredAccounts);
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}

// Clear all accounts
export async function clearAllAccounts(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing accounts:", error);
    throw error;
  }
}

// Update account codes (call this every 30 seconds)
export async function updateAccountCodes(): Promise<AuthenticatorAccount[]> {
  const accounts = await loadAccounts();
  const accountsWithUpdatedCodes = await Promise.all(
    accounts.map(async (account: any) => {
      let code: string;

      if (account.publicKey) {
        // New format: use ECDH key exchange
        code = await generateTOTPFromECDH(account.publicKey);
      } else {
        // Legacy format: use direct secret
        code = generateTOTPCode(account.secret || account.id);
      }

      return {
        ...account,
        code,
      };
    }),
  );

  return accountsWithUpdatedCodes;
}
