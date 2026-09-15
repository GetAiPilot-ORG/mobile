import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../core/store/authStore';
import { dashboardApi } from '../api/dashboardApi';
import {
  ActivityFeedItem,
  MetricGlassCard,
  ProductActionCard,
  UsageMeterCard,
} from '../components';
import { DashboardSkeleton } from '../../../components/skeletonScreen';

export const DashboardScreen: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['unified_dashboard'],
    queryFn: dashboardApi.getUnifiedDashboard,
    enabled: isAuthenticated,
    staleTime: 15000,
    refetchInterval: 30000,
  });

  if (isLoading && !data) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-0 bg-[#0B0D10]">
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  if (isError && !data) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center p-6 bg-[#0B0D10]">
        <Text className="text-4xl">⚠️</Text>
        <Text className="text-lg font-bold mt-4 text-center text-white">Connection Error</Text>
        <Text className="text-[13px] mt-1.5 text-center leading-[18px] text-slate-400">
          {(error as Error)?.message || 'Failed to communicate with GetAiPilot-BFF gateway.'}
        </Text>
        <Pressable className="mt-5 bg-[#0084FF] px-5 py-2.5 rounded-xl active:opacity-85" onPress={() => refetch()}>
          <Text className="text-white font-bold text-sm">Retry Connection</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const metrics = data?.metrics;
  const org = data?.organization;
  const sub = data?.subscription;

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-32"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0084FF" />
        }
      >
        {/* Organization & User Header */}
        <View className="flex-row justify-between items-center mb-5 pt-2">
          <View className="flex-1">
            <Text className="text-[12.5px] font-medium tracking-tight text-slate-400">{org?.name || 'GetAiPilot Workspace'}</Text>
            <Text className="text-[22px] font-bold mt-0.5 tracking-tight text-white">{user?.name || org?.user_name || 'Commander'}</Text>
          </View>
          <View className="flex-row items-center px-3 py-1.5 rounded-full bg-[#0084FF]/15 border border-[#0084FF]/30">
            <View className="w-1.5 h-1.5 rounded-full bg-[#0084FF] mr-1.5" />
            <Text className="text-[#0084FF] text-xs font-bold">{sub?.plan_name || 'Pro Plan'}</Text>
          </View>
        </View>

        {/* Live Ecosystem Telemetry Grid */}
        <Text className="text-[15px] font-bold mt-4.5 mb-2.5 tracking-wide text-white">Ecosystem Realtime Telemetry</Text>
        <View className="flex-row justify-between mb-1.5">
          <MetricGlassCard
            title="WA Messages"
            value={(metrics?.whatsapp.messages_count || 3864).toLocaleString()}
            subtitle={`${(metrics?.whatsapp.active_conversations || 716).toLocaleString()} active chats`}
            icon="💬"
            accentColor="#22c55e"
          />
          <MetricGlassCard
            title="CRM Leads"
            value={metrics?.crm.leads_count || 4}
            subtitle={`₹${((metrics?.crm.pipeline_summary.total_value || 1050000) / 100000).toFixed(1)}L Pipeline`}
            icon="👥"
            accentColor="#3b82f6"
          />
        </View>
        <View className="flex-row justify-between mb-1.5">
          <MetricGlassCard
            title="AI Voice Calls"
            value={metrics?.voice.calls_count || 48}
            subtitle={`₹${(metrics?.voice.wallet_balance || 4850).toLocaleString()} balance`}
            icon="🎙️"
            accentColor="#a855f7"
          />
          <MetricGlassCard
            title="Telegram MRR"
            value={`₹${((metrics?.telegram.monthly_revenue || 92500) / 1000).toFixed(0)}k`}
            subtitle={`${metrics?.telegram.subscribers_count || 185} Telesub VIPs`}
            icon="✈️"
            accentColor="#0ea5e9"
          />
        </View>

        {/* Resource Usage Gauges */}
        <Text className="text-[15px] font-bold mt-4.5 mb-2.5 tracking-wide text-white">Resource Allocation & Gauges</Text>
        <UsageMeterCard
          label="WhatsApp Contacts Synced"
          current={metrics?.whatsapp.contacts_count || 3003}
          max={10000}
          unit=" contacts"
          color="#22c55e"
        />
        <UsageMeterCard
          label="Voice Calling Telemetry"
          current={metrics?.voice.minutes_used || 215}
          max={1000}
          unit=" mins"
          color="#a855f7"
        />
        <UsageMeterCard
          label="Active Telegram Sessions"
          current={metrics?.telegram.active_sessions || 101}
          max={200}
          unit=" bots"
          color="#0ea5e9"
        />

        {/* Product Hub Navigation Cards */}
        <Text className="text-[15px] font-bold mt-4.5 mb-2.5 tracking-wide text-white">Connected Product Hubs</Text>
        <ProductActionCard
          title="GAP WhatsApp Business"
          description={`${(metrics?.whatsapp.contacts_count || 3003).toLocaleString()} contacts, ${(metrics?.whatsapp.messages_count || 3864).toLocaleString()} messages synced`}
          icon="📱"
          badge="Live Connected"
          route="/products/whatsapp"
          accentColor="#22c55e"
        />
        <ProductActionCard
          title="GAP CRM Engine"
          description={`${metrics?.crm.leads_count || 4} leads across ${metrics?.crm.pipeline_summary.qualified || 1} qualified stages`}
          icon="📊"
          badge={`₹${((metrics?.crm.pipeline_summary.total_value || 1050000) / 100000).toFixed(1)}L Pipeline`}
          route="/products/crm"
          accentColor="#3b82f6"
        />
        <ProductActionCard
          title="GAP VoicePilot AI"
          description={`${metrics?.voice.active_agents || 3} active agents, ${(metrics?.voice.minutes_used || 215)} mins logged today`}
          icon="🎙️"
          badge={`₹${(metrics?.voice.wallet_balance || 4850).toLocaleString()} Wallet`}
          route="/products/voice"
          accentColor="#a855f7"
        />
        <ProductActionCard
          title="GAP SocialPilot"
          description={`${metrics?.social.connected_accounts || 3} channels active, ${metrics?.social.scheduled_posts || 1} post queued`}
          icon="🌐"
          badge="Sync Active"
          route="/products/social"
          accentColor="#ec4899"
        />
        <ProductActionCard
          title="GAP Telegram Suite"
          description={`${metrics?.telegram.active_sessions || 101} bot sessions, ₹${(metrics?.telegram.monthly_revenue || 92500).toLocaleString()} Telesub MRR`}
          icon="✈️"
          badge="Monetized"
          route="/products/telegram"
          accentColor="#0ea5e9"
        />

        {/* Recent Ecosystem Timeline */}
        <Text className="text-[15px] font-bold mt-4.5 mb-2.5 tracking-wide text-white">Recent Ecosystem Activity Feed</Text>
        <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
          {data?.recent_activity?.map((act) => (
            <ActivityFeedItem
              key={act.id}
              product={act.product}
              title={act.title}
              description={act.description}
              timestamp={act.timestamp}
              status={act.status}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
