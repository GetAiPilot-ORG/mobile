import React from 'react';
import { View, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { ProductCard } from '../../src/components/ProductCard';
import { colors } from '../../src/theme/colors';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';
import { ProductsSkeleton } from '../../src/components/skeletonScreen';

export default function ProductsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { refresh } = usePlatformSubscription();
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
    const item = systemProducts?.find((p: any) => p.product_key === key);
    if (item?.maintenance_enabled) return 'maintenance';
    return item?.status || 'operational';
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    await refetchProducts();
    setIsRefreshing(false);
  };

  return (
    <AppScreen safeArea={false}>
      <AppTopBar title="Product Suite" subtitle="Connected AI Automation Engines" />

      {isLoading && !systemProducts ? (
        <ProductsSkeleton />
      ) : (
        <ScrollView
          className={`flex-1 ${isDark ? "bg-[#0B0D10]" : "bg-[#F2F2F7]"}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#FFFFFF' : colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ProductCard
            name="GAP WhatsApp Hub"
            category="Messaging Automation"
            description="Send broadcasts, automate customer triggers, and manage campaign webhooks with Meta Cloud API."
            logoImage={require('../../assets/images/products/whatsapp.png')}
            themeColor={colors.products.whatsapp}
            status={getStatus('whatsapp')}
            onPress={() => router.push('/products/whatsapp' as any)}
          />

          <ProductCard
            name="GAP Telegram Auto-Forwarder"
            category="Channel Routing"
            description="Auto-forward messages across channels with real-time word filters, text replacements, and join bot."
            logoImage={require('../../assets/images/products/telegram.png')}
            themeColor={colors.products.telegram}
            status={getStatus('telegram')}
            onPress={() => router.push('/products/telegram' as any)}
          />

          <ProductCard
            name="GAP AI Voice Pilot"
            category="Telecalling Automation"
            description="Ultra-low latency conversational AI telecallers for lead qualification, inbound support, and bookings."
            logoImage={require('../../assets/images/products/voice.png')}
            themeColor={colors.products.voice}
            status={getStatus('voice_ai')}
            onPress={() => router.push('/products/voice' as any)}
          />

          <ProductCard
            name="GAP Social Pilot"
            category="Multi-Channel Sync"
            description="Schedule and cross-publish content across Instagram, YouTube, X, LinkedIn, Facebook, and Bluesky."
            logoImage={require('../../assets/images/products/social.png')}
            themeColor={colors.products.social}
            status={getStatus('social')}
            onPress={() => router.push('/products/social' as any)}
          />

          <ProductCard
            name="GAP Smart CRM"
            category="Pipeline & Leads"
            description="Track prospects, deal values, conversion stages, and automated client follow-ups across channels."
            logoImage={require('../../assets/images/products/crm.png')}
            themeColor={colors.products.crm}
            status={getStatus('crm')}
            onPress={() => router.push('/products/crm' as any)}
          />
        </ScrollView>
      )}
    </AppScreen>
  );
}
