/**
 * 公司相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface Company {
  id: string
  name: string
  description?: string
  domain?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  industry?: string
  size?: string
  founded?: string
  creator_user_id: string
  created_at: string
  updated_at: string
  member_count?: number
  department_count?: number
}

export interface CompanyCreate {
  name: string
  description?: string
  domain?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  industry?: string
  size?: string
  founded?: string
}

export interface CompanyUpdate {
  name?: string
  description?: string
  domain?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  industry?: string
  size?: string
  founded?: string
}

export interface CompanyMember {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  role?: string
  joined_at: string
}

// ==================== 查询 Hooks ====================

/**
 * 获取公司列表
 */
export function useCompanies() {
  const { user } = useAuth()
  
  return useApiQuery<Company[]>({
    queryKey: queryKeys.company.list(user?.id || ''),
    url: '/api/companies',
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取公司详情
 */
export function useCompany(companyId: string) {
  return useApiQuery<Company>({
    queryKey: queryKeys.company.detail(companyId),
    url: `/api/companies/${companyId}`,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取当前用户的公司
 */
export function useCurrentCompany() {
  const { user } = useAuth()
  return useCompany(user?.companyId || '')
}

/**
 * 获取公司成员列表
 */
export function useCompanyMembers(companyId: string, params?: {
  search?: string
  department?: string
  role?: string
  page?: number
  limit?: number
}) {
  return useApiQuery<CompanyMember[]>({
    queryKey: ['companies', 'members', companyId, params],
    url: `/api/companies/${companyId}/members`,
    params,
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取公司统计信息
 */
export function useCompanyStats(companyId: string) {
  return useApiQuery({
    queryKey: ['companies', 'stats', companyId],
    url: `/api/companies/${companyId}/stats`,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 搜索公司
 */
export function useSearchCompanies(query: string) {
  return useApiQuery<Company[]>({
    queryKey: ['companies', 'search', query],
    url: '/api/companies/search',
    params: { q: query },
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取可用的公司列表（用于加入）
 */
export function useAvailableCompanies() {
  return useApiQuery<Company[]>({
    queryKey: ['companies', 'available'],
    url: '/api/companies/available',
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取用户的公司列表
 */
export function useUserCompanies() {
  const { user } = useAuth()

  return useApiQuery<Company[]>({
    queryKey: ['companies', 'user', user?.id],
    url: '/api/companies/user',
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 通过邀请码获取公司信息
 */
export function useCompanyByInviteCode(inviteCode: string) {
  return useApiQuery<Company>({
    queryKey: ['companies', 'invite-code', inviteCode],
    url: `/api/companies/by-invite-code/${inviteCode}`,
    enabled: !!inviteCode,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 创建公司
 */
export function useCreateCompany() {
  return useApiMutation<Company, CompanyCreate>({
    url: '/api/companies',
    method: 'POST',
    successMessage: '公司创建成功',
    invalidateQueries: [
      queryKeys.company.all,
    ],
  })
}

/**
 * 更新公司信息
 */
export function useUpdateCompany() {
  return useApiMutation<Company, { id: string } & CompanyUpdate>({
    url: '/api/companies',
    method: 'PUT',
    successMessage: '公司信息更新成功',
    invalidateQueries: [
      queryKeys.company.all,
    ],
  })
}

/**
 * 删除公司
 */
export function useDeleteCompany() {
  return useApiMutation<void, string>({
    url: '/api/companies',
    method: 'DELETE',
    successMessage: '公司删除成功',
    invalidateQueries: [
      queryKeys.company.all,
    ],
  })
}

/**
 * 加入公司
 */
export function useJoinCompany() {
  return useApiMutation<any, { companyId: string; inviteCode?: string }>({
    url: '/api/companies/join',
    method: 'POST',
    successMessage: '成功加入公司',
    invalidateQueries: [
      queryKeys.company.all,
      ['user']
    ]
  })
}

/**
 * 离开公司
 */
export function useLeaveCompany() {
  return useApiMutation<void, { companyId: string }>({
    url: '/api/companies/leave',
    method: 'POST',
    successMessage: '成功离开公司',
    invalidateQueries: [
      queryKeys.company.all,
      ['user']
    ]
  })
}

/**
 * 验证邀请码
 */
export function useVerifyInviteCode() {
  return useApiMutation<{ valid: boolean; company?: Company }, { inviteCode: string }>({
    url: '/api/companies/verify-invite-code',
    method: 'POST',
    successMessage: '邀请码验证成功',
  })
}

/**
 * 上传公司Logo
 */
export function useUploadCompanyLogo() {
  return useApiMutation<{ logo: string }, { companyId: string; file: FormData }>({
    url: '/api/companies/logo',
    method: 'POST',
    successMessage: 'Logo上传成功',
    invalidateQueries: [
      queryKeys.company.all,
    ],
  })
}

/**
 * 邀请用户加入公司
 */
export function useInviteToCompany() {
  return useApiMutation<any, { companyId: string; email: string; role?: string }>({
    url: '/api/companies/invite',
    method: 'POST',
    successMessage: '邀请发送成功',
  })
}

/**
 * 移除公司成员
 */
export function useRemoveCompanyMember() {
  return useApiMutation<void, { companyId: string; userId: string }>({
    url: '/api/companies/remove-member',
    method: 'POST',
    successMessage: '成员移除成功',
    invalidateQueries: [
      ['companies', 'members'],
    ],
  })
}

/**
 * 更新成员角色
 */
export function useUpdateMemberRole() {
  return useApiMutation<any, { companyId: string; userId: string; role: string }>({
    url: '/api/companies/update-member-role',
    method: 'POST',
    successMessage: '角色更新成功',
    invalidateQueries: [
      ['companies', 'members'],
    ],
  })
}

/**
 * 批量关联公司
 */
export function useBatchAssociateCompany() {
  return useApiMutation<any, { targetCompanyId: string; entityIds: string[]; entityType: string }>({
    url: '/api/companies/batch-associate',
    method: 'POST',
    successMessage: '批量关联成功',
    invalidateQueries: [
      queryKeys.company.all,
      queryKeys.department.all,
    ],
  })
}

/**
 * 公司设置更新
 */
export function useUpdateCompanySettings() {
  return useApiMutation<any, { companyId: string; settings: Record<string, any> }>({
    url: '/api/companies/settings',
    method: 'PUT',
    successMessage: '设置更新成功',
    invalidateQueries: [
      queryKeys.company.all,
    ],
  })
}
