import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

export type AuthenticatorAccount = {
  id: string;
  issuer: string;
  account: string;
  code: string;
};

type Props = {
  account: AuthenticatorAccount;
  onPress?: () => void;
  onDelete?: (id: string) => void;
};

export function AuthenticatorItem({ account, onPress, onDelete }: Props) {
  const colorScheme = useColorScheme();
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [progress, setProgress] = useState(1);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTimeRemaining(seconds);
      setProgress(seconds / 30);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleLongPress = () => {
    Alert.alert(account.issuer, account.account, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Account",
            `Are you sure you want to delete ${account.issuer}?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => onDelete?.(account.id),
              },
            ],
          );
        },
      },
    ]);
  };

  const progressColor =
    timeRemaining <= 5
      ? "#ef4444"
      : colorScheme === "dark"
        ? Colors.dark.tint
        : Colors.light.tint;

  const borderColor =
    colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <ThemedView style={[styles.container, { borderColor, borderWidth: 1 }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.issuerContainer}>
              <View
                style={[
                  styles.issuierBadge,
                  { backgroundColor: progressColor },
                ]}
              />
              <ThemedText type="defaultSemiBold" style={styles.issuer}>
                {account.issuer}
              </ThemedText>
            </View>
            <View
              style={[
                styles.timerBadge,
                timeRemaining <= 5 && styles.timerBadgeUrgent,
              ]}
            >
              <ThemedText style={styles.timer}>{timeRemaining}s</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.account}>{account.account}</ThemedText>
          <View style={styles.codeContainer}>
            <ThemedText type="title" style={styles.code}>
              {account.code.slice(0, 3)} {account.code.slice(3)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress * 100}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    transform: [{ scale: 1 }],
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  container: {
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  content: {
    padding: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  issuerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  issuierBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  issuer: {
    fontSize: 18,
    fontWeight: "700",
  },
  timerBadge: {
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerBadgeUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  timer: {
    fontSize: 13,
    fontWeight: "600",
  },
  account: {
    fontSize: 14,
    opacity: 0.65,
    marginBottom: 16,
    marginLeft: 18,
  },
  codeContainer: {
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  code: {
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: 6,
    fontVariant: ["tabular-nums"],
  },
  progressContainer: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  progressBar: {
    height: "100%",
  },
});
