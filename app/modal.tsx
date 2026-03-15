import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAccounts } from "@/contexts/accounts-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

export default function ModalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { addAccount } = useAccounts();
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!issuer.trim() || !account.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await addAccount(
        issuer.trim(),
        account.trim(),
        secret.trim() || undefined,
      );
      Alert.alert("Success", "Account added successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to add account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    router.push("/qr-scanner");
  };

  const inputBackgroundColor =
    colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

  const buttonColor =
    colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Add Account
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.form}>
        {/* QR Scanner Button */}
        <Pressable
          style={[
            styles.scanButton,
            {
              backgroundColor: inputBackgroundColor,
              borderColor:
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.1)",
            },
          ]}
          onPress={handleScanQR}
        >
          <View style={styles.scanButtonContent}>
            <View style={styles.qrIcon}>
              <View style={[styles.qrCorner, styles.qrCornerTL]} />
              <View style={[styles.qrCorner, styles.qrCornerTR]} />
              <View style={[styles.qrCorner, styles.qrCornerBL]} />
              <View style={[styles.qrCorner, styles.qrCornerBR]} />
            </View>
            <View style={styles.scanButtonText}>
              <ThemedText style={styles.scanButtonTitle}>
                Scan QR Code
              </ThemedText>
              <ThemedText style={styles.scanButtonSubtitle}>
                Quick and easy setup
              </ThemedText>
            </View>
            <ThemedText style={styles.chevron}>›</ThemedText>
          </View>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>or enter manually</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Issuer *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackgroundColor,
                color:
                  colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
              },
            ]}
            placeholder="e.g., Google, GitHub"
            placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
            value={issuer}
            onChangeText={setIssuer}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Account *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackgroundColor,
                color:
                  colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
              },
            ]}
            placeholder="e.g., user@example.com"
            placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
            value={account}
            onChangeText={setAccount}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Secret Key (Optional)</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBackgroundColor,
                color:
                  colorScheme === "dark" ? Colors.dark.text : Colors.light.text,
              },
            ]}
            placeholder="Enter secret key"
            placeholderTextColor={colorScheme === "dark" ? "#666" : "#999"}
            value={secret}
            onChangeText={setSecret}
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: buttonColor },
            loading && styles.addButtonDisabled,
          ]}
          onPress={handleAdd}
          disabled={loading}
        >
          <ThemedText style={styles.addButtonText}>
            {loading ? "Adding..." : "Add Account"}
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.note}>* Required fields</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    width: 60,
  },
  title: {
    fontSize: 20,
  },
  placeholder: {
    width: 60,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 12,
    textAlign: "center",
  },
  scanButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  scanButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrIcon: {
    width: 48,
    height: 48,
    position: "relative",
    marginRight: 16,
  },
  qrCorner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: "#0a7ea4",
    borderWidth: 2,
  },
  qrCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  qrCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  qrCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanButtonText: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  scanButtonSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 24,
    opacity: 0.3,
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
  },
  dividerText: {
    fontSize: 13,
    opacity: 0.5,
    marginHorizontal: 12,
  },
});
