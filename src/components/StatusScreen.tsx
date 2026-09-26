import {
  Ionicons } from "@expo/vector-icons";
import { useEffect,
  useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme, getColors } from '@/theme';

interface NetworkStatusScreenProps {
  onRetry?: () => void;
  isChecking?: boolean;
}

export function NetworkStatusScreen({ onRetry, isChecking = false }: NetworkStatusScreenProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 120,
        useNativeDriver: Platform.OS !== "web",
      }),

      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#000000" : "#F2F2F7",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconOuter,
            {
              transform: [{ scale: pulse }],
              backgroundColor: isDark
                ? "rgba(255,69,58,0.12)"
                : "rgba(255,69,58,0.10)",
            },
          ]}
        >
          <View style={styles.iconInner}>
            <Ionicons name="cloud-offline-outline" size={52} color="#FF453A" />
          </View>
        </Animated.View>

        <Text
          style={[
            styles.title,
            {
              color: isDark ? "#FFFFFF" : "#111111",
            },
          ]}
        >
          You're Offline
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: isDark ? "#98989D" : "#6B7280",
            },
          ]}
        >
          No internet connection detected. Check your Wi-Fi or mobile data and
          try again.
        </Text>

        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "#2C2C2E" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.statusIcon}>
            <Ionicons name="wifi-outline" size={20} color="#FF453A" />
          </View>

          <View style={styles.statusText}>
            <Text
              style={[
                styles.statusTitle,
                {
                  color: isDark ? "#FFFFFF" : "#111111",
                },
              ]}
            >
              No Internet
            </Text>

            <Text
              style={[
                styles.statusSubtitle,
                {
                  color: isDark ? "#98989D" : "#6B7280",
                },
              ]}
            >
              Waiting for connection...
            </Text>
          </View>

          <View style={styles.dot} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
            isChecking && { opacity: 0.75 },
          ]}
          onPress={onRetry}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
          )}

          <Text style={styles.retryText}>
            {isChecking ? "Checking Connection..." : "Try Again"}
          </Text>
        </Pressable>

        <Text
          style={[
            styles.footer,
            {
              color: isDark ? "#636366" : "#8E8E93",
            },
          ]}
        >
          GetAiPilot will reconnect automatically
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },

  iconOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  iconInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,69,58,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 330,
    marginBottom: 28,
  },

  statusCard: {
    width: "100%",
    minHeight: 70,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,69,58,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  statusText: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },

  statusSubtitle: {
    fontSize: 12,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FF453A",
  },

  retryButton: {
    width: "100%",
    height: 50,
    borderRadius: 15,
    backgroundColor: "#0A84FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  retryButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    fontSize: 11.5,
    marginTop: 18,
  },
});
