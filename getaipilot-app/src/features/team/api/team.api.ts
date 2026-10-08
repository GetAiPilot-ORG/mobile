import { apiClient } from '../../../core/api/client';
import {
  AttendanceRecord,
  BirthdayEntry,
  CompanyHoliday,
  CRMMember,
  LeaveRequest,
  PresenceLog,
  TeamActivitySummary,
} from '../../crm/types';

export const teamApi = {
  getMembers: async (): Promise<{ members: CRMMember[]; total_count: number }> => {
    try {
      const res = await apiClient.get<any>('/mobile/v1/team/members');
      if (res) {
        if (Array.isArray(res)) {
          return { members: res, total_count: res.length };
        }
        if (Array.isArray(res.members)) {
          return { members: res.members, total_count: res.total_count ?? res.members.length };
        }
      }
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[teamApi.getMembers] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    try {
      const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_members?select=*&order=created_at.desc', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'content-type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return { members: Array.isArray(data) ? data : [], total_count: Array.isArray(data) ? data.length : 0 };
      }
    } catch (e) {
      if (__DEV__) console.warn('[teamApi.getMembers] Supabase fetch error:', e);
    }

    return { members: [], total_count: 0 };
  },
  getMember: async (id: string): Promise<CRMMember> => {
    return await apiClient.get(`/mobile/v1/team/members/${id}`);
  },
  createMember: async (data: Partial<CRMMember>): Promise<CRMMember> => {
    try {
      const res = await apiClient.post<CRMMember>('/mobile/v1/team/members', data);
      if (res && res.id) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[teamApi.createMember] BFF error, trying direct CRM Supabase REST API:', bffErr?.message);
      }
    }

    const payload: any = {
      name: data.name?.trim() || '',
      email: data.email?.trim() || '',
      role: data.role || 'Sales Representative',
      birthday: data.birthday || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      org_id: data.org_id || '7eb7dd38-00bc-49b8-a87f-96c27cac7866',
    };
    if (data.access_token) {
      payload.access_token = data.access_token;
    }

    const res = await fetch('https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_members?select=*', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'content-type': 'application/json',
        'accept': 'application/vnd.pgrst.object+json',
        'prefer': 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to add member (HTTP ${res.status})`);
    }

    return (await res.json()) as CRMMember;
  },
  updateMember: async (id: string, patch: Partial<CRMMember>): Promise<CRMMember> => {
    return await apiClient.patch(`/mobile/v1/team/members/${id}`, patch);
  },
  deleteMember: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete(`/mobile/v1/team/members/${id}`);
  },
  getAttendance: async (params?: { member_id?: string; date_from?: string; date_to?: string; status?: string; limit?: number }): Promise<{ records: AttendanceRecord[]; total_count: number }> => {
    return await apiClient.get('/mobile/v1/team/attendance', { params });
  },
  createAttendance: async (data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    return await apiClient.post('/mobile/v1/team/attendance', data);
  },
  updateAttendance: async (id: string, patch: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    return await apiClient.patch(`/mobile/v1/team/attendance/${id}`, patch);
  },
  deleteAttendance: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete(`/mobile/v1/team/attendance/${id}`);
  },
  getLeaveRequests: async (params?: { member_id?: string; status?: string; leave_type?: string; limit?: number }): Promise<{ requests: LeaveRequest[]; total_count: number }> => {
    try {
      const res = await apiClient.get<any>('/mobile/v1/team/leave', { params });
      if (res) {
        if (Array.isArray(res)) {
          return { requests: res, total_count: res.length };
        }
        if (Array.isArray(res.requests)) {
          return { requests: res.requests, total_count: res.total_count ?? res.requests.length };
        }
      }
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[teamApi.getLeaveRequests] BFF error, trying direct Supabase REST API:', bffErr?.message);
      }
    }

    try {
      let url = 'https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/leave_requests?select=*%2Cmember%3Acrm_members%21member_id%28id%2Cname%2Cemail%29%2Creviewer%3Acrm_members%21reviewed_by%28id%2Cname%2Cemail%29&org_id=eq.7eb7dd38-00bc-49b8-a87f-96c27cac7866&order=created_at.desc';
      if (params?.member_id) url += `&member_id=eq.${params.member_id}`;
      if (params?.status) url += `&status=eq.${params.status}`;
      if (params?.leave_type) url += `&leave_type=eq.${params.leave_type}`;
      if (params?.limit) url += `&limit=${params.limit}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'content-type': 'application/json',
          'accept': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          requests: Array.isArray(data) ? data : [],
          total_count: Array.isArray(data) ? data.length : 0,
        };
      }
    } catch (e: any) {
      if (__DEV__) console.warn('[teamApi.getLeaveRequests] Supabase fetch error:', e);
    }

    return { requests: [], total_count: 0 };
  },
  createLeaveRequest: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    return await apiClient.post('/mobile/v1/team/leave', data);
  },
  updateLeaveRequest: async (id: string, patch: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    return await apiClient.patch(`/mobile/v1/team/leave/${id}`, patch);
  },
  deleteLeaveRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    try {
      const res = await apiClient.delete<{ success: boolean; id: string }>(`/mobile/v1/team/leave/${id}`);
      if (res && res.success !== false) return res;
    } catch (bffErr: any) {
      if (__DEV__) {
        console.warn('[teamApi.deleteLeaveRequest] BFF error, trying direct Supabase REST API:', bffErr?.message);
      }
    }

    const res = await fetch(`https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/leave_requests?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Failed to delete leave request (HTTP ${res.status})`);
    }

    return { success: true, id };
  },
  getPresence: async (params?: { member_id?: string; limit?: number }): Promise<{ members: CRMMember[]; total_count: number }> => {
    try {
      const url = 'https://hhieilvvechtdhhfjomn.supabase.co/rest/v1/crm_members?select=*&org_id=eq.7eb7dd38-00bc-49b8-a87f-96c27cac7866&order=created_at.desc';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9',
          'accept-profile': 'public',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaWVpbHZ2ZWNodGRoaGZqb21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MDYzNzEsImV4cCI6MjA4OTk4MjM3MX0.jrDgt81FFK5owy3OPIp9RlaaYJddlaZ87Iz2Uz8rXTE',
          'origin': 'https://getaipilot.online',
          'referer': 'https://getaipilot.online/',
          'x-client-info': 'supabase-js-web/2.100.1',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          members: Array.isArray(data) ? data : [],
          total_count: Array.isArray(data) ? data.length : 0,
        };
      }
    } catch (e: any) {
      if (__DEV__) console.warn('[teamApi.getPresence] Supabase cURL error:', e);
    }

    try {
      const res = await apiClient.get<any>('/mobile/v1/team/presence', { params });
      if (res) {
        if (Array.isArray(res)) return { members: res, total_count: res.length };
        if (Array.isArray(res.members)) return { members: res.members, total_count: res.total_count ?? res.members.length };
        if (Array.isArray(res.logs)) return { members: res.logs, total_count: res.total_count ?? res.logs.length };
      }
    } catch {}

    return { members: [], total_count: 0 };
  },
  getBirthdays: async (): Promise<{ birthdays: BirthdayEntry[] }> => {
    return await apiClient.get('/mobile/v1/team/birthdays');
  },
  getHolidays: async (): Promise<{ holidays: CompanyHoliday[] }> => {
    return await apiClient.get('/mobile/v1/team/holidays');
  },
  getWFH: async (): Promise<{ wfh: LeaveRequest[]; total_count: number }> => {
    return await apiClient.get('/mobile/v1/team/wfh');
  },
  getActivity: async (): Promise<TeamActivitySummary> => {
    return await apiClient.get('/mobile/v1/team/activity');
  },
};
