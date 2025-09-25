/**
 * 角色权限相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface Role {
  id: number
  name: string
  description?: string
  companyId: number
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export interface RoleMember {
  id: number
  name: string
  email: string
  avatar?: string
}

export interface UserRole {
  userId: number
  roleIds: number[]
}

export interface AdminMenuPermission {
  canOrg: boolean
  canMall: boolean
  canRedemption: boolean
}

// ==================== 查询 Hooks ====================

/**
 * 获取公司角色列表
 */
export function useRoles(companyId?: string) {
  return useApiQuery<Role[]>({
    queryKey: queryKeys.role.list(companyId || ''),
    url: '/api/roles',
    params: companyId ? { companyId } : undefined,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取角色成员列表
 */
export function useRoleMembers(roleId: number) {
  return useApiQuery<{ items: RoleMember[] }>({
    queryKey: queryKeys.role.members(roleId),
    url: `/api/roles/${roleId}/members`,
    enabled: !!roleId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取用户角色列表
 */
export function useUserRoles(userId: number) {
  return useApiQuery<number[]>({
    queryKey: queryKeys.role.userRoles(userId),
    url: `/api/roles/users/${userId}/roles`,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取管理员菜单权限
 */
export function useAdminMenuPermission(companyId?: string) {
  return useApiQuery<AdminMenuPermission>({
    queryKey: queryKeys.role.adminMenuPermission(companyId || ''),
    url: '/api/roles/permissions/can_view_admin_menus',
    params: companyId ? { companyId } : undefined,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 创建角色
 */
export function useCreateRole() {
  return useApiMutation<Role, { companyId: number; name: string; description?: string }>({
    url: '/api/roles',
    method: 'POST',
    invalidateKeys: [queryKeys.role.all],
  })
}

/**
 * 更新角色
 */
export function useUpdateRole() {
  return useApiMutation<Role, { id: number; name: string; description?: string }>({
    url: (data) => `/api/roles/${data.id}`,
    method: 'PUT',
    invalidateKeys: [queryKeys.role.all],
  })
}

/**
 * 删除角色
 */
export function useDeleteRole() {
  return useApiMutation<void, { id: number }>({
    url: (data) => `/api/roles/${data.id}`,
    method: 'DELETE',
    invalidateKeys: [queryKeys.role.all],
  })
}

/**
 * 更新用户角色
 */
export function useUpdateUserRoles() {
  return useApiMutation<void, { userId: number; roleIds: number[] }>({
    url: (data) => `/api/roles/users/${data.userId}/roles`,
    method: 'PUT',
    invalidateKeys: (data) => [
      queryKeys.role.userRoles(data.userId),
      queryKeys.role.all
    ],
  })
}

/**
 * 授予部门管理员权限
 */
export function useGrantDepartmentAdmin() {
  return useApiMutation<void, { departmentId: number; userId: number }>({
    url: (data) => `/api/departments/${data.departmentId}/admins`,
    method: 'POST',
    body: (data) => ({ userId: data.userId }),
    invalidateKeys: (data) => [
      queryKeys.department.admins(data.departmentId),
      queryKeys.department.all
    ],
  })
}

/**
 * 撤销部门管理员权限
 */
export function useRevokeDepartmentAdmin() {
  return useApiMutation<void, { departmentId: number; userId: number }>({
    url: (data) => `/api/departments/${data.departmentId}/admins/${data.userId}`,
    method: 'DELETE',
    invalidateKeys: (data) => [
      queryKeys.department.admins(data.departmentId),
      queryKeys.department.all
    ],
  })
}

// ==================== 部门管理相关 ====================

/**
 * 获取部门管理员列表
 */
export function useDepartmentAdmins(departmentId: number) {
  return useApiQuery<RoleMember[]>({
    queryKey: queryKeys.department.admins(departmentId),
    url: `/api/departments/${departmentId}/admins`,
    enabled: !!departmentId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}
