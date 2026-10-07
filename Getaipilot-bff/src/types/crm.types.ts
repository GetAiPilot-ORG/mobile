export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'churned';
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow_up';
export type InvoiceStatus = 'PAID' | 'PARTIALLY_PAID' | 'DUE' | 'CANCELLED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'week_off' | 'holiday' | 'wfh';
export type LeaveType = 'casual' | 'sick' | 'paid' | 'unpaid' | 'emergency' | 'half_day' | 'work_from_home';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

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

export interface CRMOrganization {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  website?: string | null;
  subscription_tier: string;
  plan_id?: string | null;
  plan_start_date?: string | null;
  plan_end_date?: string | null;
  plan_status?: string | null;
  billing_cycle?: string | null;
  auto_renew?: boolean;
  trial_ends_at?: string | null;
  max_users?: number;
  max_contacts?: number;
  google_calendar_id?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMInvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate?: number | null;
  cgst_rate?: number | null;
  cgst_amount?: number | null;
  sgst_rate?: number | null;
  sgst_amount?: number | null;
  igst_rate?: number | null;
  igst_amount?: number | null;
  total_amount: number;
  created_at: string;
}

export interface CRMInvoice {
  id: string;
  org_id: string;
  contact_id?: string | null;
  billing_profile_id?: string | null;
  quotation_id?: string | null;
  invoice_number: string;
  invoice_type: 'GST' | 'NON-GST';
  date: string;
  due_date?: string | null;
  status: InvoiceStatus;
  gst_mode: 'INCLUSIVE' | 'EXCLUSIVE';
  place_of_supply?: string | null;
  state_code?: string | null;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  tax_total: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  pdf_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: CRMInvoiceItem[];
  contact?: CRMContact | null;
}

export interface CRMQuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate?: number | null;
  gst_amount?: number | null;
  total_amount: number;
  created_at: string;
}

export interface CRMQuotation {
  id: string;
  org_id: string;
  contact_id?: string | null;
  billing_profile_id?: string | null;
  quote_number: string;
  date: string;
  valid_until?: string | null;
  status: QuotationStatus;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  currency: string;
  notes?: string | null;
  gst_mode: 'INCLUSIVE' | 'EXCLUSIVE';
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  created_at: string;
  updated_at: string;
  items?: CRMQuotationItem[];
  contact?: CRMContact | null;
}

export interface CRMBillingProfile {
  id: string;
  org_id: string;
  contact_id?: string | null;
  legal_name: string;
  gstin?: string | null;
  pan?: string | null;
  billing_address_street?: string | null;
  billing_address_city?: string | null;
  billing_address_state?: string | null;
  billing_address_pincode?: string | null;
  shipping_address_street?: string | null;
  shipping_address_city?: string | null;
  shipping_address_state?: string | null;
  shipping_address_pincode?: string | null;
  state_code?: string | null;
  place_of_supply?: string | null;
  email?: string | null;
  phone?: string | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  contact?: CRMContact | null;
}

export interface CRMPayment {
  id: string;
  org_id: string;
  invoice_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  utr_number?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  status?: string | null;
  billing_profile_id?: string | null;
  created_at: string;
  updated_at: string;
  invoice?: CRMInvoice | null;
}

// ── Team Types ─────────────────────────────────────────────────────────────

export interface CRMTeamMemberFull {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  access_token?: string | null;
  last_login_at?: string | null;
  tracker_key?: string | null;
  current_activity?: Record<string, any>;
  focus_score?: number;
  birthday?: string | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  org_id: string;
  member_id: string;
  attendance_date: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  break_in_time?: string | null;
  break_out_time?: string | null;
  total_work_hours?: number | null;
  status: AttendanceStatus;
  is_manual: boolean;
  admin_note?: string | null;
  created_at: string;
  updated_at: string;
  member?: CRMMember | null;
}

export interface LeaveRequest {
  id: string;
  org_id: string;
  member_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url?: string | null;
  status: LeaveStatus;
  admin_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  member?: CRMMember | null;
}

export interface PresenceLog {
  id: string;
  org_id: string;
  member_id: string;
  active_window?: string | null;
  is_idle: boolean;
  is_recording: boolean;
  metadata?: Record<string, any>;
  logged_at: string;
  member?: CRMMember | null;
}

export interface CompanyHoliday {
  id: string;
  org_id: string;
  title: string;
  holiday_date: string;
  description?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  org_id: string;
  member_id: string;
  casual_leave: number;
  sick_leave: number;
  paid_leave: number;
  unpaid_leave_used: number;
  created_at: string;
  updated_at: string;
}

