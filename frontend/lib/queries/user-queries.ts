/**
 * 用户相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  companyId?: string
  role?: string
  points?: number
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  companyId?: string
  role?: string
  points?: number
  achievements?: Achievement[]
  stats?: UserStats
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  date: string
}

export interface UserStats {
  totalPoints: number
  totalActivities: number
  completedTasks: number
  rank: number
}

export interface UserUpdate {
  name?: string
  email?: string
  avatar?: string
  department?: string
}

// ==================== 查询 Hooks ====================

/**
 * 获取用户资料
 */
export function useUserProfile(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useApiQuery<UserProfile>({
    queryKey: queryKeys.user.profile(targetUserId || ''),
    url: `/api/users/${targetUserId}`,
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取当前用户资料
 */
export function useCurrentUserProfile() {
  const { user } = useAuth()
  return useUserProfile(user?.id)
}

/**
 * 获取用户活动历史
 */
export function useUserActivities(userId?: string, page: number = 1, limit: number = 10) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  
  return useApiQuery({
    queryKey: queryKeys.user.activities(targetUserId || '', page),
    url: `/api/users/${targetUserId}/activities`,
    params: { page, limit },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取用户列表
 */
export function useUsers(params?: {
  search?: string
  department?: string
  role?: string
  page?: number
  limit?: number
}) {
  return useApiQuery({
    queryKey: queryKeys.user.all,
    url: '/api/users',
    params,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取用户排行榜
 */
export function useUserLeaderboard(
  type: 'points' | 'activities' | 'contributions' = 'points',
  limit: number = 10
) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: ['leaderboard', type, limit, user?.companyId],
    url: '/api/users/leaderboard',
    params: { type, limit, companyId: user?.companyId },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 更新用户资料
 */
export function useUpdateUserProfile() {
  const { user } = useAuth()
  
  return useApiMutation<UserProfile, UserUpdate>({
    url: `/api/users/${user?.id}`,
    method: 'PUT',
    successMessage: '资料更新成功',
    invalidateQueries: [
      queryKeys.user.profile(user?.id || ''),
      queryKeys.user.all,
    ],
  })
}

/**
 * 上传用户头像
 */
export function useUploadAvatar() {
  const { user } = useAuth()
  
  return useApiMutation<{ avatar: string }, FormData>({
    url: `/api/users/${user?.id}/avatar`,
    method: 'POST',
    successMessage: '头像上传成功',
    invalidateQueries: [
      queryKeys.user.profile(user?.id || ''),
    ],
  })
}

/**
 * 删除用户
 */
export function useDeleteUser() {
  return useApiMutation<void, string>({
    url: '/api/users',
    method: 'DELETE',
    successMessage: '用户删除成功',
    invalidateQueries: [
      queryKeys.user.all,
    ],
  })
}

/**
 * 重置用户密码
 */
export function useResetUserPassword() {
  return useApiMutation<void, { userId: string; newPassword: string }>({
    url: '/api/users/reset-password',
    method: 'POST',
    successMessage: '密码重置成功',
  })
}

/**
 * 批量导入用户
 */
export function useBatchImportUsers() {
  return useApiMutation<any, FormData>({
    url: '/api/users/batch-import',
    method: 'POST',
    successMessage: '用户导入成功',
    invalidateQueries: [
      queryKeys.user.all,
    ],
  })
}

/**
 * 用户加入公司
 */
export function useJoinCompany() {
  const { user } = useAuth()
  
  return useApiMutation<any, { companyId: string }>({
    url: '/api/users/join-company',
    method: 'POST',
    successMessage: '加入公司成功',
    invalidateQueries: [
      queryKeys.user.profile(user?.id || ''),
      queryKeys.company.all,
    ],
  })
}

/**
 * 用户退出公司
 */
export function useLeaveCompany() {
  const { user } = useAuth()
  
  return useApiMutation<any, void>({
    url: '/api/users/leave-company',
    method: 'POST',
    successMessage: '退出公司成功',
    invalidateQueries: [
      queryKeys.user.profile(user?.id || ''),
      queryKeys.company.all,
    ],
  })
}

/**
 * 用户加入部门
 */
export function useJoinDepartment() {
  const { user } = useAuth()
  
  return useApiMutation<any, { departmentId: string }>({
    url: '/api/users/join-department',
    method: 'POST',
    successMessage: '加入部门成功',
    invalidateQueries: [
      queryKeys.user.profile(user?.id || ''),
      queryKeys.department.all,
    ],
  })
}
