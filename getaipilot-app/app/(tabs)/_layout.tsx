import { Tabs } from "expo-router";
import { FloatingTabBar } from "../../src/components/FloatingTabBar";
import { useAuth } from "../../src/contexts/AuthContext";
import { useTheme, getColors } from "@/theme";

export default function TabLayout() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { user, profile } = useAuth();
  const userRole = (user?.role || profile?.role || "").toLowerCase();
  const isAdmin = Boolean(
    userRole === "admin" ||
    (user as any)?.is_admin === true ||
    profile?.is_admin === true,
  );

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
