import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { View, Text } from 'react-native';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';

export default function TabLayout() {
  const { isAdmin } = usePlatformSubscription();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.mutedForeground }}>
              🏠
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.mutedForeground }}>
              ⚡
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.mutedForeground }}>
              🛠️
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.mutedForeground }}>
              👤
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null, // Hidden from bottom bar to keep clean 4-tab standard structure
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: (isAdmin ? '/admin' : null) as any,
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 18, color: focused ? colors.primary : colors.mutedForeground }}>
              🛡️
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
