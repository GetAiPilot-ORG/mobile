import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TelegramApi } from '../api/telegram.api';

export function useTelegram() {
  const queryClient = useQueryClient();

  // Queries
  const statusQuery = useQuery({
    queryKey: ['telegram', 'status'],
    queryFn: () => TelegramApi.getStatus(),
    staleTime: 30000,
  });

  const dashboardQuery = useQuery({
    queryKey: ['telegram', 'dashboard'],
    queryFn: () => TelegramApi.getDashboard(),
    staleTime: 30000,
  });

  const setupHubQuery = useQuery({
    queryKey: ['telegram', 'setup-hub'],
    queryFn: () => TelegramApi.getSetupHub(),
    staleTime: 30000,
  });

  const chatsQuery = useQuery({
    queryKey: ['telegram', 'chats'],
    queryFn: () => TelegramApi.getChats(),
    staleTime: 60000,
    enabled: Boolean(statusQuery.data?.connected),
  });

  const autoforwardQuery = useQuery({
    queryKey: ['telegram', 'autoforward'],
    queryFn: () => TelegramApi.getAutoforwardOverview(),
    staleTime: 30000,
  });

  const subManagerQuery = useQuery({
    queryKey: ['telegram', 'sub-manager'],
    queryFn: () => TelegramApi.getSubManagerOverview(),
    staleTime: 30000,
  });

  const trackerQuery = useQuery({
    queryKey: ['telegram', 'tracker'],
    queryFn: () => TelegramApi.getTrackerOverview(),
    staleTime: 30000,
  });

  const reportBotQuery = useQuery({
    queryKey: ['telegram', 'report-bot'],
    queryFn: () => TelegramApi.getReportBotConfig(),
    staleTime: 30000,
  });

  const broadcastsQuery = useQuery({
    queryKey: ['telegram', 'broadcasts'],
    queryFn: () => TelegramApi.getBroadcasts(),
    staleTime: 30000,
  });

  const autoApproveQuery = useQuery({
    queryKey: ['telegram', 'auto-approve'],
    queryFn: () => TelegramApi.getAutoApproveStatus(),
    staleTime: 30000,
  });

  const chatbotsQuery = useQuery({
    queryKey: ['telegram', 'chatbots'],
    queryFn: () => TelegramApi.getChatbotConfigs(),
    staleTime: 30000,
  });

  const reactionsQuery = useQuery({
    queryKey: ['telegram', 'reactions'],
    queryFn: () => TelegramApi.getReactionsOverview(),
    staleTime: 30000,
  });

  // Mutations
  const syncChatsMutation = useMutation({
    mutationFn: () => TelegramApi.syncChats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'dashboard'] });
    },
  });

  const createMappingMutation = useMutation({
    mutationFn: (data: { source_channel_id: string; destination_channel_id: string; is_active?: boolean }) =>
      TelegramApi.createForwardMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'autoforward'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'setup-hub'] });
    },
  });

  const toggleMappingMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string | number; is_active: boolean }) =>
      TelegramApi.updateForwardMapping(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'autoforward'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'dashboard'] });
    },
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (id: string | number) => TelegramApi.deleteForwardMapping(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'autoforward'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'dashboard'] });
    },
  });

  const saveTrackerBotMutation = useMutation({
    mutationFn: (bot_token: string) => TelegramApi.saveTrackerBot(bot_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'tracker'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'setup-hub'] });
    },
  });

  const createJoinLinkMutation = useMutation({
    mutationFn: (data: { link_name: string; channel_id: string; campaign_name?: string }) =>
      TelegramApi.createJoinLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'tracker'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'setup-hub'] });
    },
  });

  const updateReportBotMutation = useMutation({
    mutationFn: (data: any) => TelegramApi.updateReportBotConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'report-bot'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'setup-hub'] });
    },
  });

  const createBroadcastMutation = useMutation({
    mutationFn: (data: { message: string; target_audience?: string; scheduled_at?: string }) =>
      TelegramApi.createBroadcast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'setup-hub'] });
    },
  });

  const createReactionOrderMutation = useMutation({
    mutationFn: (data: { post_link: string; reactions: string[]; quantity: number }) =>
      TelegramApi.createReactionOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'reactions'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => TelegramApi.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram'] });
    },
  });

  return {
    statusQuery,
    dashboardQuery,
    setupHubQuery,
    chatsQuery,
    autoforwardQuery,
    subManagerQuery,
    trackerQuery,
    reportBotQuery,
    broadcastsQuery,
    autoApproveQuery,
    chatbotsQuery,
    reactionsQuery,
    syncChatsMutation,
    createMappingMutation,
    toggleMappingMutation,
    deleteMappingMutation,
    saveTrackerBotMutation,
    createJoinLinkMutation,
    updateReportBotMutation,
    createBroadcastMutation,
    createReactionOrderMutation,
    logoutMutation,
  };
}
