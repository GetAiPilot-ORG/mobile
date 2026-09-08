export interface Lead {
  id: string;
  organization_id: string;
  contact_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  avatar_url?: string | null;
  pipeline_id: string;
  stage_id: string;
  stage_name: string;
  owner?: {
    id: string;
    name: string;
  } | null;
  value?: number | null;
  currency?: string | null;
  source?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CRMLead = Lead;

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  lead_count: number;
  total_value: number;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface CRMActivity {
  id: string;
  lead_id: string;
  type: 'message' | 'call' | 'note' | 'stage_change' | 'assignment' | 'form_submission';
  title: string;
  description?: string;
  product?: string;
  created_at: string;
}

export interface PaginatedLeadsResponse {
  leads: Lead[];
  next_cursor?: string | null;
  total_count: number;
}
