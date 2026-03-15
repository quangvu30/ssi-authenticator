import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAccounts } from "@/contexts/accounts-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { addAccount } = useAccounts();

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ThemedText type="title" style={styles.permissionTitle}>
            Camera Permission
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            We need camera access to scan QR codes for adding authenticator
            accounts.
          </ThemedText>
          <Pressable
            style={[
              styles.permissionButton,
              {
                backgroundColor:
                  colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint,
              },
            ]}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>
              Grant Permission
            </ThemedText>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const handleBarcodeScanned = async ({
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;

    setScanned(true);

    try {
      // Parse otpauth:// URL format
      // Example: otpauth://totp/Google:user@gmail.com?secret=JBSWY3DPEHPK3PXP&issuer=Google
      const url = new URL(data);

      if (url.protocol !== "otpauth:") {
        throw new Error("Invalid QR code format");
      }

      const type = url.hostname; // totp or hotp
      const label = decodeURIComponent(url.pathname.substring(1));
      const params = new URLSearchParams(url.search);

      const secret = params.get("secret");
      const issuer = params.get("issuer") || label.split(":")[0];
      const account = label.includes(":") ? label.split(":")[1] : label;

      if (!secret) {
        throw new Error("No secret found in QR code");
      }

      // Save the account to storage
      await addAccount(issuer, account, secret);

      Alert.alert("Account Added", `${issuer}\n${account}`, [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Invalid QR Code",
        "The scanned QR code is not a valid authenticator code.",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false),
          },
          {
            text: "Cancel",
            onPress: () => router.back(),
          },
        ],
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.backButton}>Cancel</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Scan QR Code
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />

        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <ThemedText style={styles.instruction}>
              Position the QR code within the frame
            </ThemedText>
          </View>
        </View>
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
  backButton: {
    fontSize: 16,
    width: 60,
  },
  title: {
    fontSize: 20,
  },
  placeholder: {
    width: 60,
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayMiddle: {
    flexDirection: "row",
    height: 280,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scanArea: {
    width: 280,
    height: 280,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#fff",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  instruction: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
