export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow_up';

export interface CRMMember {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  birthday?: string | null;
  created_at: string;
}

export interface CRMContact {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  name?: string; // computed first_name + last_name
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  status: ContactStatus;
  assigned_to?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Joins
  assignee?: { id: string; name: string; email: string } | null;
}

export interface CRMDeal {
  id: string;
  org_id: string;
  title: string;
  contact_id?: string | null;
  value: number;
  currency: string;
  stage: DealStage;
  expected_close_date?: string | null;
  assigned_to?: string | null;
  probability?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  contact?: CRMContact | null;
  assignee?: { id: string; name: string; email: string } | null;
}

export interface CRMTask {
  id: string;
  org_id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  assigned_to?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  contact?: { id: string; first_name: string; last_name: string; email?: string | null; phone?: string | null } | null;
  deal?: { id: string; title: string; value: number } | null;
  assignee?: { id: string; name: string; email: string } | null;
}

export interface CRMActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: { id: string; name: string; email: string };
}

export interface CRMActivity {
  id: string;
  org_id: string;
  type: ActivityType;
  subject: string;
  description?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  priority?: TaskPriority | null;
  status?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  contact?: { id: string; first_name: string; last_name: string } | null;
  deal?: { id: string; title: string } | null;
  user?: { id: string; name: string; email: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
  comments?: CRMActivityComment[];
}

export interface CRMDashboardSummary {
  stats: {
    totalContacts: number;
    totalLeads: number;
    newContactsThisMonth: number;
    openDeals: number;
    totalDealValue: number;
    wonDealsThisMonth: number;
    wonDealValueThisMonth: number;
    tasksDueToday: number;
    overdueTasks: number;
    activitiesThisWeek: number;
    teamCount: number;
  };
  recentLeads: CRMContact[];
  upcomingTasks: CRMTask[];
  recentActivities: CRMActivity[];
  pipelineSummary: Array<{
    stage: DealStage;
    label: string;
    count: number;
    totalValue: number;
    color: string;
  }>;
}

export interface CRMContext {
  hubUserId: string;
  hubOrgId: string;
  crmOrgId: string;
  crmMemberId: string;
  crmRole: string;
  permissions: Record<string, boolean>;
}
