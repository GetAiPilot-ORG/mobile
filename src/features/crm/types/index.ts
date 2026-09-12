export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned' | 'open' | 'active' | 'archived';
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow_up' | 'message' | 'stage_change' | 'assignment' | 'form_submission';

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
  name: string;
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
  assignee?: CRMMember | null;
  // Compatibility fields
  pipeline_id?: string;
  stage_id?: string;
  stage_name?: string;
  value?: number | null;
  currency?: string | null;
  source?: string | null;
  avatar_url?: string | null;
  owner?: { id: string; name: string } | null;
}

export type Lead = CRMContact;
export type CRMLead = CRMContact;

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
  contact?: CRMContact | null;
  assignee?: CRMMember | null;
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
  contact?: { id: string; first_name: string; last_name: string; email?: string | null; phone?: string | null } | null;
  deal?: { id: string; title: string; value: number } | null;
  assignee?: CRMMember | null;
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
  org_id?: string;
  lead_id?: string;
  type: ActivityType;
  subject?: string;
  title?: string;
  description?: string | null;
  product?: string;
  contact_id?: string | null;
  deal_id?: string | null;
  created_by?: string | null;
  assigned_to?: string | null;
  priority?: TaskPriority | null;
  status?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;
  contact?: { id: string; first_name: string; last_name: string } | null;
  deal?: { id: string; title: string } | null;
  user?: { id: string; name: string; email: string } | null;
  assignee?: CRMMember | null;
  comments?: CRMActivityComment[];
}

export interface PipelineStage {
  id?: string;
  name?: string;
  order?: number;
  stage: DealStage;
  label: string;
  color: string;
  count: number;
  lead_count?: number;
  totalValue: number;
  total_value?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
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
  pipelineSummary: PipelineStage[];
}

export interface PaginatedLeadsResponse {
  leads: CRMContact[];
  total_count: number;
  next_cursor?: string | null;
}

export interface PaginatedContactsResponse {
  contacts: CRMContact[];
  total_count: number;
}
