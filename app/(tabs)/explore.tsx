import { KeyInfoDisplay } from "@/components/key-info-display";
import { SharePublicKeyButton } from "@/components/share-public-key";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAccounts } from "@/contexts/accounts-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

type SettingItemProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};

function SettingItem({
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron,
}: SettingItemProps) {
  const colorScheme = useColorScheme();

  return (
    <Pressable style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingContent}>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
          )}
        </View>
        {rightElement && (
          <View style={styles.settingRight}>{rightElement}</View>
        )}
        {showChevron && <ThemedText style={styles.chevron}>›</ThemedText>}
      </View>
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ThemedView style={styles.sectionContent}>{children}</ThemedView>
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const { clearAllAccounts } = useAccounts();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleExportAccounts = () => {
    Alert.alert(
      "Export Accounts",
      "Export your accounts as an encrypted backup file?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => Alert.alert("Success", "Accounts exported!"),
        },
      ],
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your accounts. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllAccounts();
              Alert.alert("Cleared", "All data has been cleared");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>
      </View>

      <ScrollView style={styles.scrollView}>
        <SettingSection title="SECURITY">
          <SettingItem
            title="Biometric Authentication"
            subtitle="Use fingerprint or face recognition"
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{
                  false: "#767577",
                  true:
                    colorScheme === "dark"
                      ? Colors.dark.tint
                      : Colors.light.tint,
                }}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            title="Auto-Lock"
            subtitle="Lock app when inactive"
            rightElement={
              <Switch
                value={autoLockEnabled}
                onValueChange={setAutoLockEnabled}
                trackColor={{
                  false: "#767577",
                  true:
                    colorScheme === "dark"
                      ? Colors.dark.tint
                      : Colors.light.tint,
                }}
              />
            }
          />
          <View style={styles.divider} />
          <SettingItem
            title="Auto-Lock Timeout"
            subtitle="Immediately"
            onPress={() =>
              Alert.alert("Auto-Lock Timeout", "Choose timeout duration")
            }
            showChevron
          />
        </SettingSection>

        <SettingSection title="CRYPTOGRAPHIC KEYS">
          <KeyInfoDisplay />
          <View style={styles.divider} />
          <SharePublicKeyButton />
        </SettingSection>

        <SettingSection title="DATA">
          <SettingItem
            title="Export Accounts"
            subtitle="Backup your accounts"
            onPress={handleExportAccounts}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            title="Import Accounts"
            subtitle="Restore from backup"
            onPress={() =>
              Alert.alert("Import", "Select backup file to import")
            }
            showChevron
          />
        </SettingSection>

        <SettingSection title="NOTIFICATIONS">
          <SettingItem
            title="Push Notifications"
            subtitle="Receive security alerts"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{
                  false: "#767577",
                  true:
                    colorScheme === "dark"
                      ? Colors.dark.tint
                      : Colors.light.tint,
                }}
              />
            }
          />
        </SettingSection>

        <SettingSection title="ABOUT">
          <SettingItem title="Version" subtitle="1.0.0" />
          <View style={styles.divider} />
          <SettingItem
            title="Privacy Policy"
            onPress={() => Alert.alert("Privacy Policy", "View privacy policy")}
            showChevron
          />
          <View style={styles.divider} />
          <SettingItem
            title="Terms of Service"
            onPress={() => Alert.alert("Terms", "View terms of service")}
            showChevron
          />
        </SettingSection>

        <SettingSection title="DANGER ZONE">
          <Pressable style={styles.dangerButton} onPress={handleClearData}>
            <ThemedText style={styles.dangerButtonText}>
              Clear All Data
            </ThemedText>
          </Pressable>
        </SettingSection>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            SSI Authenticator © 2026
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  settingRight: {
    marginLeft: 12,
  },
  chevron: {
    fontSize: 24,
    opacity: 0.3,
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(128, 128, 128, 0.3)",
    marginLeft: 16,
  },
  dangerButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    opacity: 0.4,
  },
});
