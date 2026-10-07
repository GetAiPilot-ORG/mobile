export interface UnifiedDashboardData {
  organization: {
    id: string;
    name: string;
    role: string;
    user_name: string;
    user_email: string;
  };
  subscription: {
    plan_name: string;
    status: string;
    renews_at: string;
    amount: number;
    currency: string;
  };
  metrics: {
    whatsapp: {
      messages_count: number;
      contacts_count: number;
      active_conversations: number;
      connected: boolean;
    };
    crm: {
      leads_count: number;
      pipeline_summary: {
        new: number;
        contacted: number;
        qualified: number;
        proposal: number;
        won: number;
        total_value: number;
      };
    };
    voice: {
      calls_count: number;
      minutes_used: number;
      active_agents: number;
      wallet_balance: number;
      currency: string;
    };
    social: {
      scheduled_posts: number;
      connected_accounts: number;
    };
    telegram: {
      bot_status: 'connected' | 'disconnected';
      active_sessions: number;
      landing_pages: number;
      subscribers_count: number;
      monthly_revenue: number;
    };
  };
  recent_activity: Array<{
    id: string;
    product: 'whatsapp' | 'crm' | 'voice' | 'social' | 'telegram' | 'billing';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'info' | 'error';
  }>;
}
