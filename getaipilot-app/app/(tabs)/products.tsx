import React from 'react';
import { ScrollView, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, getColors } from '@/theme';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { ProductCard } from '../../src/components/ProductCard';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { ProductsSkeleton } from '../../src/components/skeletonScreen';

export default function ProductsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { hasWhatsApp, hasTelegram, hasVoice, hasSocial, hasCRM, refresh } =
    usePlatformSubscription();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch real system product statuses
  const { data: systemProducts, isLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products-system-status'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_products').select('*');
      if (error || !data) return [];
      return data;
    },
  });

  const getStatus = (key: string) => {
    const item = systemProducts?.find((p) => p.product_key === key);
    if (item?.maintenance_enabled) return 'maintenance';
    return item?.status || 'operational';
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    await refetchProducts();
    setIsRefreshing(false);
  };

  const products = [
    {
      key: 'whatsapp', name: 'WhatsApp Hub', category: 'Messaging automation',
      description: 'Broadcasts, customer triggers, and Meta Cloud API workflows.',
      logoImage: require('../../assets/images/products/whatsapp.png'),
      themeColor: colors.products.whatsapp, isEnabled: hasWhatsApp, route: '/products/whatsapp',
    },
    {
      key: 'telegram', name: 'Telegram', category: 'Channel automation',
      description: 'Forward messages, apply filters, and manage channel workflows.',
      logoImage: require('../../assets/images/products/telegram.png'),
      themeColor: colors.products.telegram, isEnabled: hasTelegram, route: '/products/telegram',
    },
    {
      key: 'voice_ai', name: 'Voice AI', category: 'AI calling',
      description: 'Run conversational calls for leads, support, and bookings.',
      logoImage: require('../../assets/images/products/voice.png'),
      themeColor: colors.products.voice, isEnabled: hasVoice, route: '/products/voice',
    },
    {
      key: 'social', name: 'Social Pilot', category: 'Social publishing',
      description: 'Schedule and publish content across your connected channels.',
      logoImage: require('../../assets/images/products/social.png'),
      themeColor: colors.products.social, isEnabled: hasSocial, route: '/products/social',
    },
    {
      key: 'crm', name: 'Smart CRM', category: 'Sales workspace',
      description: 'Track leads, deals, pipeline stages, and client follow-ups.',
      logoImage: require('../../assets/images/products/crm.png'),
      themeColor: colors.products.crm, isEnabled: hasCRM, route: '/products/crm',
    },
  ];

  return (
    <AppScreen safeArea={false}>
      <AppTopBar
        title="Product Suite"
        showPlanBadge={true}
      />

      {isLoading && !systemProducts ? (
        <ProductsSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#FFFFFF' : colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -0.75, color: colors.text }}>
              Your products
            </Text>
            <Text style={{ marginTop: 7, fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
              Open a workspace or explore another product.
            </Text>
          </View>

          {products.map((product) => (
            <ProductCard
              key={product.key}
              name={product.name}
              category={product.category}
              description={product.description}
              logoImage={product.logoImage}
              themeColor={product.themeColor}
              status={getStatus(product.key)}
              isEnabled={product.isEnabled}
              onPress={() => router.push(product.route as any)}
            />
          ))}
        </ScrollView>
      )}
    </AppScreen>
  );
}
