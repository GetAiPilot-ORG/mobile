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
    return await apiClient.get('/mobile/v1/team/members');
  },
  getMember: async (id: string): Promise<CRMMember> => {
    return await apiClient.get(`/mobile/v1/team/members/${id}`);
  },
  createMember: async (data: Partial<CRMMember>): Promise<CRMMember> => {
    return await apiClient.post('/mobile/v1/team/members', data);
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
    return await apiClient.get('/mobile/v1/team/leave', { params });
  },
  createLeaveRequest: async (data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    return await apiClient.post('/mobile/v1/team/leave', data);
  },
  updateLeaveRequest: async (id: string, patch: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    return await apiClient.patch(`/mobile/v1/team/leave/${id}`, patch);
  },
  deleteLeaveRequest: async (id: string): Promise<{ success: boolean; id: string }> => {
    return await apiClient.delete(`/mobile/v1/team/leave/${id}`);
  },
  getPresence: async (params?: { member_id?: string; limit?: number }): Promise<{ logs: PresenceLog[]; total_count: number }> => {
    return await apiClient.get('/mobile/v1/team/presence', { params });
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
