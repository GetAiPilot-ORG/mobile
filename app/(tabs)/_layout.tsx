import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

export default function TabLayout() {
  const { isAdmin } = usePlatformSubscription();

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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
          title: 'Inbox',
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: null, // Hidden from bottom bar (accessible via top header avatar)
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: (isAdmin ? '/(tabs)/admin' : null) as any,
        }}
      />
      <Tabs.Screen
        name="crm"
        options={{
          href: null, // Hidden from bottom tab bar — accessed via /products/crm or Dashboard
        }}
      />
    </Tabs>
  );
}
