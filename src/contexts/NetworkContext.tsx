import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { NetworkStatusScreen } from "../components/StatusScreen";
import { LayoutSkeletonScreen } from "../components/skeletonScreen";

export interface NetworkContextType {
  isOnline: boolean;
  isOffline: boolean;
  networkChecked: boolean;
  isChecking: boolean;
  isReconnected: boolean;
  connectionType: string | null;
  refresh: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isOffline: false,
  networkChecked: false,
  isChecking: false,
  isReconnected: false,
  connectionType: null,
  refresh: async () => true,
});

export const useNetwork = () => useContext(NetworkContext);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [networkChecked, setNetworkChecked] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isReconnected, setIsReconnected] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  const prevOnlineRef = useRef<boolean>(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const updateState = useCallback((state: NetInfoState) => {
    const online =
      state.isConnected === true && state.isInternetReachable !== false;

    setConnectionType(state.type);

    if (!prevOnlineRef.current && online) {
      setIsReconnected(true);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = setTimeout(() => {
        setIsReconnected(false);
      }, 3000);
    } else if (!online) {
      setIsReconnected(false);
    }

    prevOnlineRef.current = online;
    setIsOnline(online);
    setNetworkChecked(true);
  }, []);

  useEffect(() => {
    NetInfo.fetch().then(updateState).catch(() => setNetworkChecked(true));

    const unsubscribe = NetInfo.addEventListener(updateState);

    return () => {
      unsubscribe();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [updateState]);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      updateState(state);
      const online =
        state.isConnected === true && state.isInternetReachable !== false;
      return online;
    } finally {
      setIsChecking(false);
    }
  }, [updateState]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        networkChecked,
        isChecking,
        isReconnected,
        connectionType,
        refresh,
      }}
    >
      {/* 1. Initial network checking screen */}
      {!networkChecked ? (
        <LayoutSkeletonScreen />
      ) : (
        <>
          {children}

          {/* 2. Global Offline UI design displayed everywhere when offline - NO Alert */}
          {!isOnline && (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.overlay,
                { backgroundColor: isDark ? "#000000" : "#F2F2F7" },
              ]}
            >
              <NetworkStatusScreen
                onRetry={refresh}
                isChecking={isChecking}
              />
            </View>
          )}
        </>
      )}
    </NetworkContext.Provider>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99998,
  },
  overlay: {
    zIndex: 99990,
  },
});
