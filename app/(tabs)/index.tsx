import { AuthenticatorItem } from "@/components/authenticator-item";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAccounts } from "@/contexts/accounts-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { accounts, loading, deleteAccount } = useAccounts();

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
    } catch (error) {
      Alert.alert("Error", "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Authenticator
        </ThemedText>
        <Link href="/modal" asChild>
          <Pressable
            style={[
              styles.addButton,
              {
                backgroundColor:
                  colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint,
              },
            ]}
          >
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </Pressable>
        </Link>
      </View>

      <ScrollView style={styles.scrollView}>
        {accounts.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No accounts yet</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Tap + to add your first account
            </ThemedText>
          </ThemedView>
        ) : (
          accounts.map((account) => (
            <AuthenticatorItem
              key={account.id}
              account={account}
              onPress={() => {
                // Copy code to clipboard functionality can be added here
              }}
              onDelete={handleDeleteAccount}
            />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
  },
});
