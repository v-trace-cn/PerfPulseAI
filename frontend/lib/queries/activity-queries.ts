/**
 * 活动相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface Activity {
  id: string
  show_id: string
  title: string
  description: string
  points: number
  user_id: string
  status: string
  created_at: string
  completed_at: string | null
  user: {
    name: string
    avatar: string
    initials: string
  }
  type: string
}

export interface ActivityCreate {
  title: string
  description?: string
  points?: number
  user_id: string
}

export interface ActivityUpdate {
  title?: string
  description?: string
  points?: number
  status?: string
}

// ==================== 查询 Hooks ====================

/**
 * 获取最近活动
 */
export function useRecentActivities(page: number = 1, perPage: number = 10) {
  const { user } = useAuth()

  return useApiQuery({
    queryKey: queryKeys.activity.recent(user?.id || '', page, perPage),
    url: '/api/activities/recent',
    params: {
      user_id: user?.id?.toString(), // 确保传递字符串类型
      page,
      per_page: perPage,
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

/**
 * 获取活动详情
 */
export function useActivity(activityId: string) {
  return useApiQuery({
    queryKey: queryKeys.activity.detail(activityId),
    url: `/api/activities/${activityId}`,
    enabled: !!activityId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 根据show_id获取活动详情
 */
export function useActivityByShowId(showId: string) {
  return useApiQuery({
    queryKey: queryKeys.activity.byShowId(showId),
    url: `/api/activities/show/${showId}`,
    enabled: !!showId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取所有活动
 */
export function useActivities(params?: {
  search?: string
  user_id?: string
  page?: number
  per_page?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: queryKeys.activity.all,
    url: '/api/activities',
    params: {
      user_id: user?.id,
      ...params,
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 创建活动
 */
export function useCreateActivity() {
  return useApiMutation<Activity, ActivityCreate>({
    url: '/api/activities',
    method: 'POST',
    successMessage: '活动创建成功',
    invalidateQueries: [
      queryKeys.activity.all,
    ],
  })
}

/**
 * 更新活动
 */
export function useUpdateActivity() {
  return useApiMutation<Activity, { id: string } & ActivityUpdate>({
    url: '/api/activities',
    method: 'PUT',
    successMessage: '活动更新成功',
    invalidateQueries: [
      queryKeys.activity.all,
    ],
  })
}

/**
 * 删除活动
 */
export function useDeleteActivity() {
  return useApiMutation<void, string>({
    url: '/api/activities',
    method: 'DELETE',
    successMessage: '活动删除成功',
    invalidateQueries: [
      queryKeys.activity.all,
    ],
  })
}

/**
 * 更新活动状态
 */
export function useUpdateActivityStatus() {
  return useApiMutation<Activity, { activityId: string; status: string }>({
    url: '/api/activities/status',
    method: 'PUT',
    successMessage: '活动状态更新成功',
    invalidateQueries: [
      queryKeys.activity.all,
    ],
  })
}

// ==================== PR 相关 ====================

/**
 * 获取PR详情
 */
export function usePrDetails(activityId: string) {
  return useApiQuery({
    queryKey: queryKeys.pr.details(activityId),
    url: `/api/pr/details/${activityId}`,
    enabled: !!activityId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 分析PR
 */
export function useAnalyzePr() {
  return useApiMutation<any, string>({
    url: '/api/pr/analyze',
    method: 'POST',
    successMessage: 'PR分析已开始',
    invalidateQueries: [
      queryKeys.pr.all,
      queryKeys.activity.all,
    ],
  })
}

/**
 * 计算PR积分
 */
export function useCalculatePrPoints() {
  return useApiMutation<any, string>({
    url: '/api/pr/calculate-points',
    method: 'POST',
    successMessage: '积分计算完成',
    invalidateQueries: [
      queryKeys.pr.all,
      queryKeys.activity.all,
      queryKeys.points.all,
    ],
  })
}

/**
 * 重置活动积分
 */
export function useResetActivityPoints() {
  return useApiMutation<any, string>({
    url: '/api/activities/reset-points',
    method: 'POST',
    successMessage: '积分重置成功',
    invalidateQueries: [
      queryKeys.activity.all,
      queryKeys.points.all,
    ],
  })
}

// ==================== 评分相关 ====================

/**
 * 获取评分维度
 */
export function useScoringDimensions() {
  return useApiQuery({
    queryKey: queryKeys.scoring.dimensions(),
    url: '/api/scoring/dimensions',
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}
