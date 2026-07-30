import apiClient from '@/lib/axios';
import type {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  AuditLog,
  UserSession,
} from '@/types/auth.types';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/api.types';

export const adminService = {
  // ── USERS ──────────────────────────────────────────────────
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return data;
  },

  createUser: async (payload: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.post<ApiResponse<User>>('/admin/users', payload);
    return data;
  },

  updateUser: async (id: number, payload: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, payload);
    return data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`);
    return data;
  },

  toggleUserActive: async (id: number, isActive: boolean): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/admin/users/${id}/status`, { is_active: isActive });
    return data;
  },

  // ── ROLES ──────────────────────────────────────────────────
  getRoles: async (params?: PaginationParams): Promise<PaginatedResponse<Role>> => {
    const { data } = await apiClient.get<PaginatedResponse<Role>>('/admin/roles', { params });
    return data;
  },

  createRole: async (payload: Partial<Role>): Promise<ApiResponse<Role>> => {
    const { data } = await apiClient.post<ApiResponse<Role>>('/admin/roles', payload);
    return data;
  },

  updateRole: async (id: number, payload: Partial<Role>): Promise<ApiResponse<Role>> => {
    const { data } = await apiClient.put<ApiResponse<Role>>(`/admin/roles/${id}`, payload);
    return data;
  },

  deleteRole: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/roles/${id}`);
    return data;
  },

  // ── PERMISSIONS ───────────────────────────────────────────
  getPermissions: async (params?: PaginationParams): Promise<PaginatedResponse<Permission>> => {
    const { data } = await apiClient.get<PaginatedResponse<Permission>>('/admin/permissions', { params });
    return data;
  },

  createPermission: async (payload: Partial<Permission>): Promise<ApiResponse<Permission>> => {
    const { data } = await apiClient.post<ApiResponse<Permission>>('/admin/permissions', payload);
    return data;
  },

  updatePermission: async (id: number, payload: Partial<Permission>): Promise<ApiResponse<Permission>> => {
    const { data } = await apiClient.put<ApiResponse<Permission>>(`/admin/permissions/${id}`, payload);
    return data;
  },

  deletePermission: async (id: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/permissions/${id}`);
    return data;
  },

  // ── ROLE-PERMISSIONS MAPPING ──────────────────────────────
  getRolePermissions: async (): Promise<ApiResponse<RolePermission[]>> => {
    const { data } = await apiClient.get<ApiResponse<RolePermission[]>>('/admin/role-permissions');
    return data;
  },

  assignPermissionsToRole: async (roleId: number, permissionIds: number[]): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/admin/roles/${roleId}/permissions`, { permissions: permissionIds });
    return data;
  },

  // ── USER-ROLES MAPPING ────────────────────────────────────
  getUserRoles: async (): Promise<ApiResponse<UserRole[]>> => {
    const { data } = await apiClient.get<ApiResponse<UserRole[]>>('/admin/user-roles');
    return data;
  },

  assignRolesToUser: async (userId: number, roleIds: number[]): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>(`/admin/users/${userId}/roles`, { roles: roleIds });
    return data;
  },

  // ── SESSIONS ──────────────────────────────────────────────
  getAllSessions: async (): Promise<ApiResponse<UserSession[]>> => {
    const { data } = await apiClient.get<ApiResponse<UserSession[]>>('/admin/sessions');
    return data;
  },

  forceLogoutSession: async (sessionId: number): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/sessions/${sessionId}`);
    return data;
  },

  // ── AUDIT LOGS ────────────────────────────────────────────
  getAuditLogs: async (params?: PaginationParams): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params });
    return data;
  },
};
