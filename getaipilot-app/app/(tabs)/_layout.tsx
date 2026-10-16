import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../src/components/FloatingTabBar";
import { useTheme, getColors } from "@/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const reducedMotion = useReducedMotion();

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? "none" : "shift",
        transitionSpec: {
          animation: "timing",
          config: { duration: 220 },
        },
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
    </Tabs>
  );
}
