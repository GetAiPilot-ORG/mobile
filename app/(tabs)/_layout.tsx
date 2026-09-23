import { Tabs } from 'expo-router';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useAuth } from '../../src/contexts/AuthContext';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

export default function TabLayout() {
  const { user, profile } = useAuth();
  const userRole = (user?.role || profile?.role || '').toLowerCase();
  const isAdmin = Boolean(
    userRole === 'admin' ||
    (user as any)?.is_admin === true ||
    profile?.is_admin === true
  );

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
