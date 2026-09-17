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
  useColorScheme,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { AppScreen } from '../../../components/AppScreen';
import { AppTopBar } from '../../../components/AppTopBar';
import {
  ProductFloatingBottomBar,
  ProductTabItem,
} from '../../../components/ProductFloatingBottomBar';
import { supabase } from '../../../lib/supabase';
import { telegramApi } from '../api/telegramApi';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TelegramTab>('hub');
  const [activeModal, setActiveModal] = useState<TelegramToolKey | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const mainScrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  // ── Shared data queries ─────────────────────────────────────────────────────
  const { data: summary, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['telegram_summary'],
    queryFn: telegramApi.getSummary,
  });

  const { data: trackerBots, refetch: refetchBots } = useQuery({
    queryKey: ['telegram_tracker_bots'],
    queryFn: telegramApi.getTrackerBots,
  });

  const { data: trackerDashboard, refetch: refetchTrackerDash } = useQuery({
    queryKey: ['telegram_tracker_dashboard'],
    queryFn: telegramApi.getTrackerDashboard,
  });

  const { data: trackerLinks, refetch: refetchTrackerLinks } = useQuery({
    queryKey: ['telegram_tracker_links'],
    queryFn: telegramApi.getTrackerLinks,
  });

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ['telegram_chats'],
    queryFn: telegramApi.getChats,
  });

  const { data: forwardRules, refetch: refetchRules } = useQuery({
    queryKey: ['telegram_forward_rules'],
    queryFn: telegramApi.getForwardRules,
  });

  const { data: subPlans, refetch: refetchPlans } = useQuery({
    queryKey: ['telegram_sub_plans'],
    queryFn: telegramApi.getSubPlans,
  });

  const { data: subManagerDashboard, refetch: refetchSubManagerDashboard } = useQuery({
    queryKey: ['telegram_sub_manager_dashboard'],
    queryFn: telegramApi.getSubManagerDashboard,
  });

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
  const botsList = trackerBots || summary?.trackerBots || [];

  const trackerDash = trackerDashboard?.kpis ? trackerDashboard : {
    kpis: { totalJoins: 0, todaysJoins: 0, thisMonthJoins: 0, botStarts: 0, pendingJoins: 0, conversionRate: 0 },
    period: { startDate: '', endDate: '', periodJoins: 0, totalTracked: 0, allTimeActive: 0 },
    channels: [],
    newUsers: [],
  };

  const rawSubPages: any[] =
    Array.isArray(subManagerDashboard?.pages) && subManagerDashboard.pages.length > 0
      ? subManagerDashboard.pages
      : Array.isArray(supabaseSubData?.pages) && supabaseSubData.pages.length > 0
      ? supabaseSubData.pages
      : [];

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
    (typeof subManagerDashboard?.kpis?.totalRevenueRaw === 'number' && subManagerDashboard.kpis.totalRevenueRaw > 0)
      ? subManagerDashboard.kpis.totalRevenueRaw
      : (typeof supabaseSubData?.totalRevenue === 'number' && supabaseSubData.totalRevenue > 0
          ? supabaseSubData.totalRevenue
          : 0);

  const TELESUB_STATS = {
    totalRevenue: realRevenue,
    activeSubscribers: subManagerDashboard?.kpis?.activeSubscribers ?? supabaseSubData?.activeSubscribers ?? 0,
    subscriptionPages: subManagerPages.length || subManagerDashboard?.kpis?.subscriptionPages || supabaseSubData?.pages?.length || 0,
    botAutomatedAccess: '100%',
    grossSales: realRevenue,
    netCreatorShare: Math.round(realRevenue * 0.9 * 100) / 100,
    availableToWithdraw: Math.round(realRevenue * 0.9 * 100) / 100,
    rollingHold: 0,
    successfulPaymentsCount: supabaseSubData?.payments?.length || subManagerDashboard?.transactions?.length || 0,
    clearedBatchesCount: 0,
    connectedBank: {
      accountHolder: subManagerDashboard?.financialHub?.bankAccount?.accountName || 'Shwet Chourey',
      status: subManagerDashboard?.financialHub?.bankAccount?.accountName ? 'Connected' : 'Not Connected',
      details: 'Direct Bank Settlement (IMPS)',
    },
    botStatus: { botUsername: subManagerDashboard?.financialHub?.botUsername || '', isOnline: false, verifiedChannels: 0 },
    linkedTelegram: { phone: '', isLinked: false },
    monetizedChannels: subManagerDashboard?.monetizedChannels || [],
    discoveredChannels: subManagerDashboard?.discoveredChannels || [],
    transactions: supabaseSubData?.payments || subManagerDashboard?.transactions || [],
    pages: subManagerPages,
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    await Promise.all([refetch(), refetchBots(), refetchTrackerDash(), refetchTrackerLinks(), refetchChats(), refetchRules(), refetchPlans(), refetchSubManagerDashboard(), refetchSupabaseSub()]);
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
    <AppScreen safeArea={false}>
      <AppTopBar title="Telegram Dashboard" subtitle="Bots, routing, monetization & automations" />

      <ScrollView
        ref={mainScrollRef}
        style={styles.container}
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
              <ReportBotScreen onOpenModal={openModal} />
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
