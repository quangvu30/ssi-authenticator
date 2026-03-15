import { AuthenticatorAccount } from "@/components/authenticator-item";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ssi_authenticator_accounts";

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
    return accounts.map((account: any) => ({
      ...account,
      code: generateTOTPCode(account.secret || account.id),
    }));
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
  secret?: string,
): Promise<AuthenticatorAccount> {
  try {
    const accounts = await loadAccounts();

    const newAccount: AuthenticatorAccount = {
      id: Date.now().toString(),
      issuer,
      account,
      code: generateTOTPCode(secret || Date.now().toString()),
    };

    // Store with secret for regeneration
    const accountWithSecret = {
      ...newAccount,
      secret: secret || newAccount.id,
    };

    accounts.push(accountWithSecret);
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
  return accounts.map((account) => ({
    ...account,
    code: generateTOTPCode((account as any).secret || account.id),
  }));
}
