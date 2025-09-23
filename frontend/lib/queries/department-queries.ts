/**
 * 部门相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface Department {
  id: string
  name: string
  description?: string
  company_id: string
  manager_id?: string
  parent_id?: string
  level: number
  path: string
  created_at: string
  updated_at: string
  member_count?: number
  children?: Department[]
  manager?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface DepartmentCreate {
  name: string
  description?: string
  company_id: string
  manager_id?: string
  parent_id?: string
}

export interface DepartmentUpdate {
  name?: string
  description?: string
  manager_id?: string
  parent_id?: string
}

export interface DepartmentMember {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  joined_at: string
}

// ==================== 查询 Hooks ====================

/**
 * 获取部门列表
 */
export function useDepartments() {
  const { user } = useAuth()
  
  return useApiQuery<Department[]>({
    queryKey: queryKeys.department.list(user?.id || ''),
    url: '/api/departments',
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取部门详情
 */
export function useDepartment(departmentId: string) {
  return useApiQuery<Department>({
    queryKey: queryKeys.department.detail(departmentId),
    url: `/api/departments/${departmentId}`,
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取公司的部门列表
 */
export function useCompanyDepartments(companyId: string) {
  return useApiQuery<Department[]>({
    queryKey: ['departments', 'company', companyId],
    url: `/api/companies/${companyId}/departments`,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取当前用户公司的部门列表
 */
export function useCurrentCompanyDepartments() {
  const { user } = useAuth()
  return useCompanyDepartments(user?.companyId || '')
}

/**
 * 获取部门成员列表
 */
export function useDepartmentMembers(departmentId: string, params?: {
  search?: string
  role?: string
  page?: number
  limit?: number
}) {
  return useApiQuery<DepartmentMember[]>({
    queryKey: ['departments', 'members', departmentId, params],
    url: `/api/departments/${departmentId}/members`,
    params,
    enabled: !!departmentId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取部门层级结构
 */
export function useDepartmentHierarchy(companyId: string) {
  return useApiQuery<Department[]>({
    queryKey: ['departments', 'hierarchy', companyId],
    url: `/api/companies/${companyId}/departments/hierarchy`,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取部门统计信息
 */
export function useDepartmentStats(departmentId: string) {
  return useApiQuery({
    queryKey: ['departments', 'stats', departmentId],
    url: `/api/departments/${departmentId}/stats`,
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 搜索部门
 */
export function useSearchDepartments(query: string, companyId?: string) {
  return useApiQuery<Department[]>({
    queryKey: ['departments', 'search', query, companyId],
    url: '/api/departments/search',
    params: { q: query, company_id: companyId },
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 创建部门
 */
export function useCreateDepartment() {
  return useApiMutation<Department, DepartmentCreate>({
    url: '/api/departments',
    method: 'POST',
    successMessage: '部门创建成功',
    invalidateQueries: [
      queryKeys.department.all,
      ['departments', 'company'],
      ['departments', 'hierarchy'],
    ],
  })
}

/**
 * 更新部门信息
 */
export function useUpdateDepartment() {
  return useApiMutation<Department, { id: string } & DepartmentUpdate>({
    url: '/api/departments',
    method: 'PUT',
    successMessage: '部门信息更新成功',
    invalidateQueries: [
      queryKeys.department.all,
      ['departments', 'company'],
      ['departments', 'hierarchy'],
    ],
  })
}

/**
 * 删除部门
 */
export function useDeleteDepartment() {
  return useApiMutation<void, string>({
    url: '/api/departments',
    method: 'DELETE',
    successMessage: '部门删除成功',
    invalidateQueries: [
      queryKeys.department.all,
      ['departments', 'company'],
      ['departments', 'hierarchy'],
    ],
  })
}

/**
 * 移动部门
 */
export function useMoveDepartment() {
  return useApiMutation<Department, { departmentId: string; newParentId?: string }>({
    url: '/api/departments/move',
    method: 'POST',
    successMessage: '部门移动成功',
    invalidateQueries: [
      queryKeys.department.all,
      ['departments', 'hierarchy'],
    ],
  })
}

/**
 * 添加部门成员
 */
export function useAddDepartmentMember() {
  return useApiMutation<any, { departmentId: string; userId: string; role?: string }>({
    url: '/api/departments/add-member',
    method: 'POST',
    successMessage: '成员添加成功',
    invalidateQueries: [
      ['departments', 'members'],
    ],
  })
}

/**
 * 移除部门成员
 */
export function useRemoveDepartmentMember() {
  return useApiMutation<void, { departmentId: string; userId: string }>({
    url: '/api/departments/remove-member',
    method: 'POST',
    successMessage: '成员移除成功',
    invalidateQueries: [
      ['departments', 'members'],
    ],
  })
}

/**
 * 更新部门成员角色
 */
export function useUpdateDepartmentMemberRole() {
  return useApiMutation<any, { departmentId: string; userId: string; role: string }>({
    url: '/api/departments/update-member-role',
    method: 'POST',
    successMessage: '角色更新成功',
    invalidateQueries: [
      ['departments', 'members'],
    ],
  })
}

/**
 * 设置部门经理
 */
export function useSetDepartmentManager() {
  return useApiMutation<Department, { departmentId: string; managerId: string }>({
    url: '/api/departments/set-manager',
    method: 'POST',
    successMessage: '部门经理设置成功',
    invalidateQueries: [
      queryKeys.department.all,
    ],
  })
}

/**
 * 批量关联部门到公司
 */
export function useBatchAssociateDepartments() {
  return useApiMutation<any, { companyId: string; departmentIds: string[] }>({
    url: '/api/departments/batch-associate',
    method: 'POST',
    successMessage: '批量关联成功',
    invalidateQueries: [
      queryKeys.department.all,
      ['departments', 'company'],
    ],
  })
}
