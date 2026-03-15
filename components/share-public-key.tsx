import { getECDHPublicKey } from "@/lib/key-manager";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export function SharePublicKeyButton() {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    loadPublicKey();
  }, []);

  const loadPublicKey = async () => {
    const key = await getECDHPublicKey();
    setPublicKey(key);
  };

  const handleShare = async () => {
    if (!publicKey) {
      Alert.alert("Error", "Public key not available");
      return;
    }

    // Convert to URL-safe base64 (replace + with -, / with _, remove =)
    const urlSafePublicKey = publicKey
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Format: ecdh://[publicKey]?issuer=MyApp&account=user@device
    const qrData = `ecdh://${urlSafePublicKey}?issuer=MyAuthApp&account=ThisDevice`;

    // For now, just copy to clipboard
    // In a real app, you'd generate a QR code to display
    await Clipboard.setStringAsync(qrData);

    Alert.alert(
      "Public Key Copied",
      "Your ECDH public key URL has been copied to clipboard. Share this with services to establish secure TOTP.",
      [
        {
          text: "OK",
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleShare}>
        <Text style={styles.buttonText}>📤 Share My ECDH Public Key</Text>
      </Pressable>
      <Text style={styles.description}>
        Share this key with services to set up secure TOTP without transmitting
        secrets
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 11,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 16,
  },
});
