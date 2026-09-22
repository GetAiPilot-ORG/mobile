/**
 * TelegramScreen.tsx  ← SHELL ONLY
 * All business logic & JSX lives in the 9 individual service screens.
 * This file only handles: tab config, routing, shared data fetching, modals.
 */
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { supabase } from '../../../lib/supabase';
import { telegramApi } from '../api/telegramApi';
import { telegramSupabase } from '../api/telegramSupabase';
import { TelegramToolKey } from '../types';
import {
  AutoforwardModal,
  SubManagerModal,
  ReportBotModal,
  BroadcastModal,
  AutoApproveModal,
  ChatBotModal,
  ReactionsModal,
  TelegramLoginModal,
} from '../components';

// ── Individual service screens ───────────────────────────────────────────────
import { OverviewScreen } from './OverviewScreen';
import { AutoForwardScreen } from './AutoForwardScreen';
import { TrackerScreen } from './TrackerScreen';
import { SubManagerScreen } from './SubManagerScreen';
import { ReportBotScreen } from './ReportBotScreen';
import { BroadcastScreen } from './BroadcastScreen';
import { AutoApproveScreen } from './AutoApproveScreen';
import { ChatBotScreen } from './ChatBotScreen';
import { ReactionsScreen } from './ReactionsScreen';

// ── Tab definitions ───────────────────────────────────────────────────────────
type TelegramTab =
  | 'hub'
  | 'automations'
  | 'bots'
  | 'sub_manager'
  | 'report_bot'
  | 'broadcast'
  | 'auto_approve'
  | 'chatbot'
  | 'reactions';

const TELEGRAM_TABS: ProductTabItem[] = [
  { key: 'hub', label: 'Overview', activeIcon: 'grid', inactiveIcon: 'grid-outline', description: 'Master KPI command center & all 8 tools' },
  { key: 'automations', label: 'Forward', activeIcon: 'git-compare', inactiveIcon: 'git-compare-outline', description: 'Channel-to-channel message routing' },
  { key: 'bots', label: 'Tracker', activeIcon: 'logo-android', inactiveIcon: 'logo-android', description: 'Channel join tracking & analytics' },
  { key: 'sub_manager', label: 'SubMgr', activeIcon: 'card', inactiveIcon: 'card-outline', description: 'VIP subscription monetization' },
  { key: 'report_bot', label: 'Report', activeIcon: 'document-text', inactiveIcon: 'document-text-outline', description: 'SEBI research PDF generator' },
  { key: 'broadcast', label: 'Broadcast', activeIcon: 'megaphone', inactiveIcon: 'megaphone-outline', description: 'Mass message delivery' },
  { key: 'auto_approve', label: 'Approve', activeIcon: 'checkmark-done-circle', inactiveIcon: 'checkmark-done-circle-outline', description: 'Auto-approval of join requests' },
  { key: 'chatbot', label: 'ChatBot', activeIcon: 'chatbubbles', inactiveIcon: 'chatbubbles-outline', description: 'AI auto-replies & flows' },
  { key: 'reactions', label: 'Reactions', activeIcon: 'sparkles', inactiveIcon: 'sparkles-outline', description: 'Automated emoji reactions' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export const TelegramScreen: React.FC = () => {
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TelegramTab>('hub');
  const [activeModal, setActiveModal] = useState<TelegramToolKey | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  // ── Shared data queries ─────────────────────────────────────────────────────
  const { data: allData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_all_data'],
    queryFn: telegramSupabase.getSummary,
  });

  const summary = allData || {};
  const trackerBots = summary.trackerBots || [];
  const trackerLinks = summary.loadedLinks || [];
  const forwardRules = summary.loadedForwards || [];
  const rawSubPages = summary.loadedPages || [];
  const chats = summary.loadedMappings || [];
  const loadedPurchases = summary.loadedPurchases || [];
  const joins = summary.loadedJoins || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaysJoins = joins.filter((j: any) => new Date(j.joined_at) >= today).length;
  const thisMonthJoins = joins.filter((j: any) => new Date(j.joined_at) >= firstDayOfMonth).length;
  const pendingJoins = joins.filter((j: any) => j.status === 'Pending' || j.status === 'Bot Start').length;
  const conversionRate = joins.length > 0 ? Math.round(((joins.length - pendingJoins) / joins.length) * 100) : 0;

  const channelMap: Record<string, any> = {};
  joins.forEach((j: any) => {
      const cname = j.channel_name || 'Unknown Channel';
      if (!channelMap[cname]) {
          channelMap[cname] = { channel_id: cname, channel_name: cname, joined: 0, period_joins: 0, left: 0, all_active: 0, links: [] };
      }
      if (j.status !== 'Leave' && j.status !== 'Pending' && j.status !== 'Bot Start') {
        channelMap[cname].all_active++;
        channelMap[cname].joined++;
      }
      if (new Date(j.joined_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          channelMap[cname].period_joins++;
      }
      if (j.status === 'Leave') {
          channelMap[cname].left++;
      }
  });

  const channelsList = Object.values(channelMap);

  const trackerDash = {
    kpis: { totalJoins: joins.length, todaysJoins, thisMonthJoins, botStarts: joins.length, pendingJoins, conversionRate },
    period: { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), endDate: new Date().toLocaleDateString(), periodJoins: 0, totalTracked: 0, allTimeActive: 0 },
    channels: channelsList,
    newUsers: joins.map((j: any) => ({
      ...j,
      name: j.name || j.first_name || 'Unknown User',
      time_ago: j.time_ago || (j.joined_at ? new Date(j.joined_at).toLocaleDateString() : 'Just now'),
      channel_name: j.channel_name || 'Tracked Link',
      status: j.status || 'Active'
    })),
  };
  const subPlans: any[] = []; // SubPlans will be extracted from pages if needed

  // Direct Supabase fetch for guaranteed real-time sub data
  const { data: supabaseSubData, refetch: refetchSupabaseSub } = useQuery({
    queryKey: ['telegram_supabase_sub_stats'],
    queryFn: async () => {
      try {
        const { data: pagesData } = await supabase
          .from('tg_landing_pages')
          .select('*')
          .order('created_at', { ascending: false });

        const pageIds = (pagesData || []).map((p: any) => p.id).filter(Boolean);
        let totalRev = 0;
        let activeSubs = 0;
        let realPayments: any[] = [];

        if (pageIds.length > 0) {
          const { data: payments } = await supabase
            .from('payments')
            .select('id, amount, currency, status, created_at, landing_page_id, razorpay_payment_id')
            .in('landing_page_id', pageIds)
            .eq('status', 'success');

          if (payments && payments.length > 0) {
            realPayments = payments;
            totalRev = payments.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);
          }

          const { count: activeCount } = await supabase
            .from('tg_channel_subscriptions')
            .select('id', { count: 'exact', head: true })
            .in('landing_page_id', pageIds)
            .eq('status', 'active')
            .not('telegram_user_id', 'is', null);

          activeSubs = activeCount || 0;
        }

        if (totalRev === 0) {
          const { data: allPmts } = await supabase
            .from('payments')
            .select('id, amount, currency, status, created_at, landing_page_id, razorpay_payment_id')
            .eq('status', 'success');
          if (allPmts && allPmts.length > 0) {
            realPayments = allPmts;
            totalRev = allPmts.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);
          }
        }

        return { totalRevenue: totalRev > 0 ? totalRev : 0, activeSubscribers: activeSubs, pages: pagesData || [], payments: realPayments };
      } catch (e) {
        return { totalRevenue: 0, activeSubscribers: 0, pages: [], payments: [] };
      }
    },
    staleTime: 30000,
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const { mutateAsync: sendBroadcast, isPending: isBroadcasting } = useMutation({
    mutationFn: telegramApi.sendBroadcast,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['telegram_summary'] }),
  });

  // ── Computed data ───────────────────────────────────────────────────────────
  const botsList = trackerBots;

  const subManagerPages = rawSubPages.map((p: any) => ({
    id: p.id || p.slug || String(Math.random()),
    title: p.title || 'Untitled Page',
    slug: p.slug || '',
    url: p.url || `https://tg.getaipilot.in/p/${p.slug || ''}`,
    displayUrl: p.displayUrl || `getaipilot.in/p/${p.slug || ''}`,
    members: p.memberCount ?? p.members ?? 0,
    statusText: p.isActive !== false ? 'Accepting Subscriptions' : 'Paused',
    isActive: p.isActive !== false,
  }));

  const realRevenue =
    typeof supabaseSubData?.totalRevenue === 'number' && supabaseSubData.totalRevenue > 0
      ? supabaseSubData.totalRevenue
      : summary.revenue || 0;

  const TELESUB_STATS = {
    totalRevenue: realRevenue,
    activeSubscribers: supabaseSubData?.activeSubscribers ?? 0,
    subscriptionPages: subManagerPages.length || supabaseSubData?.pages?.length || 0,
    botAutomatedAccess: 'Automated',
    grossSales: realRevenue,
    netCreatorShare: Math.round(realRevenue * 0.9 * 100) / 100,
    availableToWithdraw: Math.round(realRevenue * 0.9 * 100) / 100,
    rollingHold: Math.round(realRevenue * 0.1 * 100) / 100,
    successfulPaymentsCount: supabaseSubData?.payments?.length || summary.loadedPurchases?.length || 0,
    clearedBatchesCount: 0,
    connectedBank: {
      accountHolder: summary.brandProfile?.analyst_name || 'Connected Bank',
      status: 'Active',
      details: 'Direct Bank Settlement (IMPS)',
    },
    botStatus: { botUsername: summary.botUsername || 'Gapsubmanagerbot', isOnline: true, verifiedChannels: summary.loadedMappings?.length || 0 },
    linkedTelegram: { phone: '', isLinked: true },
    monetizedChannels: summary.loadedMappings || [],
    discoveredChannels: summary.loadedMappings || [],
    transactions: supabaseSubData?.payments || summary.loadedPurchases || [],
    pages: subManagerPages,
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchSupabaseSub()]);
  };

  const handleTabChange = (key: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(key as TelegramTab);
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openModal = (key: TelegramToolKey) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModal(key);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AppScreen safeArea={false} backgroundColor={isDark ? '#000000' : '#F8FAFC'}>
      <AppTopBar title="Telegram Dashboard" subtitle="Bots, routing, monetization & automations" />

      <ScrollView
        ref={mainScrollRef}
        style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F8FAFC' }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefreshAll} tintColor="#0284C7" />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'hub' && (
              <OverviewScreen
                summary={summary}
                realRevenue={realRevenue}
                deepLinksCount={trackerLinks.length}
                botsList={botsList}
                chats={chats || []}
                forwardRules={forwardRules || []}
                subManagerPages={subManagerPages}
                subPlans={subPlans || []}
                isRefetching={isRefetching}
                onRefresh={handleRefreshAll}
                onNavigate={handleTabChange}
                onOpenModal={openModal}
              />
            )}

            {activeTab === 'automations' && (
              <AutoForwardScreen
                forwardRules={forwardRules || []}
                summary={summary}
                onOpenModal={openModal}
              />
            )}

            {activeTab === 'bots' && (
              <TrackerScreen
                botsList={botsList}
                trackerDash={trackerDash}
                trackerLinks={trackerLinks || []}
                onOpenModal={openModal}
              />
            )}

            {activeTab === 'sub_manager' && (
              <SubManagerScreen
                stats={TELESUB_STATS}
                onOpenModal={openModal}
                onRefresh={handleRefreshAll}
              />
            )}

            {activeTab === 'report_bot' && (
              <ReportBotScreen summary={summary} onOpenModal={openModal} />
            )}

            {activeTab === 'broadcast' && (
              <BroadcastScreen
                chats={chats || []}
                isBroadcasting={isBroadcasting}
                onOpenModal={openModal}
              />
            )}

            {activeTab === 'auto_approve' && (
              <AutoApproveScreen
                chats={chats || []}
                summary={summary}
                onOpenModal={openModal}
              />
            )}

            {activeTab === 'chatbot' && (
              <ChatBotScreen onOpenModal={openModal} />
            )}

            {activeTab === 'reactions' && (
              <ReactionsScreen
                chats={chats || []}
                onOpenModal={openModal}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <ProductFloatingBottomBar
        items={TELEGRAM_TABS}
        activeKey={activeTab}
        onChangeTab={handleTabChange}
        accentColor="#0284C7"
      />

      {/* Modals */}
      {activeModal === 'autoforward' && <AutoforwardModal visible={true} onClose={() => setActiveModal(null)} onSubmit={async (data: any) => { return {}; }} isLoading={false} />}
      {activeModal === 'sub_manager' && <SubManagerModal visible={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'report_bot' && <ReportBotModal visible={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'broadcast' && <BroadcastModal visible={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'auto_approve' && <AutoApproveModal visible={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'chatbot' && <ChatBotModal visible={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'reactions' && <ReactionsModal visible={true} onClose={() => setActiveModal(null)} />}
      {isLoginModalOpen && <TelegramLoginModal visible={true} onClose={() => setIsLoginModalOpen(false)} onStartLogin={async () => ({ success: true, message: '' })} onVerifyOtp={async () => ({ success: true, message: '' })} onSubmitPassword={async () => ({ success: true, message: '' })} onSuccess={() => {}} />}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110, gap: 0 },
});
