import { Tabs } from 'expo-router';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';

export default function TabLayout() {
  const { isAdmin } = usePlatformSubscription();

  return (
    <Tabs
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
          title: 'Products',
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: (isAdmin ? '/admin' : null) as any,
        }}
      />
    </Tabs>
  );
}
