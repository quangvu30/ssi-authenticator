import { AuthenticatorAccount } from "@/components/authenticator-item";
import {
  addAccount as addAccountToStorage,
  clearAllAccounts,
  deleteAccount as deleteAccountFromStorage,
  loadAccounts,
  updateAccountCodes,
} from "@/lib/storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AccountsContextType = {
  accounts: AuthenticatorAccount[];
  loading: boolean;
  addAccount: (
    issuer: string,
    account: string,
    secretOrPublicKey?: string,
    isPublicKey?: boolean,
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  clearAllAccounts: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
};

const AccountsContext = createContext<AccountsContextType | undefined>(
  undefined,
);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AuthenticatorAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Load accounts on mount
  useEffect(() => {
    loadInitialAccounts();
  }, []);

  // Update codes every second (check for 30-second intervals)
  useEffect(() => {
    const interval = setInterval(async () => {
      const currentSecond = Math.floor(Date.now() / 1000);
      if (currentSecond % 30 === 0) {
        const updatedAccounts = await updateAccountCodes();
        setAccounts(updatedAccounts);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadInitialAccounts = async () => {
    try {
      const loadedAccounts = await loadAccounts();
      setAccounts(loadedAccounts);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = useCallback(
    async (
      issuer: string,
      account: string,
      secretOrPublicKey?: string,
      isPublicKey: boolean = false,
    ) => {
      try {
        const newAccount = await addAccountToStorage(
          issuer,
          account,
          secretOrPublicKey,
          isPublicKey,
        );
        setAccounts((prev) => [...prev, newAccount]);
      } catch (error) {
        console.error("Failed to add account:", error);
        throw error;
      }
    },
    [],
  );

  const deleteAccount = useCallback(async (id: string) => {
    try {
      await deleteAccountFromStorage(id);
      setAccounts((prev) => prev.filter((account) => account.id !== id));
    } catch (error) {
      console.error("Failed to delete account:", error);
      throw error;
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearAllAccounts();
      setAccounts([]);
    } catch (error) {
      console.error("Failed to clear accounts:", error);
      throw error;
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const updatedAccounts = await updateAccountCodes();
      setAccounts(updatedAccounts);
    } catch (error) {
      console.error("Failed to refresh accounts:", error);
    }
  }, []);

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        loading,
        addAccount,
        deleteAccount,
        clearAllAccounts: clearAll,
        refreshAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
}
