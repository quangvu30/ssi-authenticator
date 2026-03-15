import { areKeysInitialized, exportPublicKeys } from "@/lib/key-manager";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export function KeyInfoDisplay() {
  const [keys, setKeys] = useState<{
    ecdh: string | null;
    ecdsa: string | null;
  } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const isInit = await areKeysInitialized();
    setInitialized(isInit);

    if (isInit) {
      const publicKeys = await exportPublicKeys();
      setKeys(publicKeys);
    }
  };

  if (!initialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>🔒 Initializing keys...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setShowKeys(!showKeys)}>
        <Text style={styles.status}>
          ✅ Keys initialized • {showKeys ? "Hide" : "Show"} Public Keys
        </Text>
      </Pressable>

      {showKeys && keys && (
        <ScrollView style={styles.keysContainer}>
          <View style={styles.keySection}>
            <Text style={styles.keyLabel}>ECDH Public Key:</Text>
            <Text style={styles.keyValue} selectable>
              {keys.ecdh}
            </Text>
          </View>

          <View style={styles.keySection}>
            <Text style={styles.keyLabel}>ECDSA Public Key:</Text>
            <Text style={styles.keyValue} selectable>
              {keys.ecdsa}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  keysContainer: {
    marginTop: 12,
    maxHeight: 300,
  },
  keySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  keyValue: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#333",
    lineHeight: 16,
  },
});
