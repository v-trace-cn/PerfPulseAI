/**
 * 通知相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface Notification {
  id: string
  userId: string
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'announcement' | 'personal_data' | 'personal_business'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  isArchived: boolean
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
  createdAt: string
  readAt?: string
  expiresAt?: string
}

export interface NotificationCreate {
  title: string
  content: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'announcement' | 'personal_data' | 'personal_business'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
  expiresAt?: string
  targetUsers?: string[]
  targetCompanies?: string[]
  targetDepartments?: string[]
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<string, number>
  byType: Record<string, number>
  byPriority: Record<string, number>
}

// ==================== 查询 Hooks ====================

/**
 * 获取通知列表
 */
export function useNotifications(category?: string, params?: {
  limit?: number
  offset?: number
  isRead?: boolean
  priority?: string
  type?: string
}) {
  const { user } = useAuth()
  
  return useApiQuery<{
    notifications: Notification[]
    total: number
    unread: number
  }>({
    queryKey: queryKeys.notification.list(category),
    url: '/api/notifications',
    params: {
      category,
      ...params,
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

/**
 * 获取未读通知数量
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth()
  
  return useApiQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count', user?.id],
    url: '/api/notifications/unread-count',
    enabled: !!user?.id,
    staleTime: 10 * 1000, // 10秒缓存
    refetchInterval: 30 * 1000, // 30秒自动刷新
  })
}

/**
 * 获取通知详情
 */
export function useNotification(notificationId: string) {
  return useApiQuery<Notification>({
    queryKey: ['notifications', 'detail', notificationId],
    url: `/api/notifications/${notificationId}`,
    enabled: !!notificationId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取通知统计
 */
export function useNotificationStats() {
  const { user } = useAuth()
  
  return useApiQuery<NotificationStats>({
    queryKey: ['notifications', 'stats', user?.id],
    url: '/api/notifications/stats',
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取系统公告
 */
export function useSystemAnnouncements(params?: {
  limit?: number
  active?: boolean
}) {
  return useApiQuery<Notification[]>({
    queryKey: ['notifications', 'announcements', params],
    url: '/api/notifications/announcements',
    params,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 标记通知为已读
 */
export function useMarkNotificationAsRead() {
  const { user } = useAuth()
  
  return useApiMutation<void, string>({
    url: '/api/notifications/mark-read',
    method: 'POST',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'unread-count', user?.id],
      ['notifications', 'stats', user?.id],
    ],
  })
}

/**
 * 标记所有通知为已读
 */
export function useMarkAllNotificationsAsRead() {
  const { user } = useAuth()
  
  return useApiMutation<void, { category?: string }>({
    url: '/api/notifications/mark-all-read',
    method: 'POST',
    successMessage: '所有通知已标记为已读',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'unread-count', user?.id],
      ['notifications', 'stats', user?.id],
    ],
  })
}

/**
 * 删除通知
 */
export function useDeleteNotification() {
  const { user } = useAuth()
  
  return useApiMutation<void, string>({
    url: '/api/notifications',
    method: 'DELETE',
    successMessage: '通知删除成功',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'unread-count', user?.id],
      ['notifications', 'stats', user?.id],
    ],
  })
}

/**
 * 批量删除通知
 */
export function useBatchDeleteNotifications() {
  const { user } = useAuth()
  
  return useApiMutation<void, { notificationIds: string[] }>({
    url: '/api/notifications/batch-delete',
    method: 'POST',
    successMessage: '通知批量删除成功',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'unread-count', user?.id],
      ['notifications', 'stats', user?.id],
    ],
  })
}

/**
 * 归档通知
 */
export function useArchiveNotification() {
  const { user } = useAuth()
  
  return useApiMutation<void, string>({
    url: '/api/notifications/archive',
    method: 'POST',
    successMessage: '通知归档成功',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'stats', user?.id],
    ],
  })
}

/**
 * 创建通知（管理员功能）
 */
export function useCreateNotification() {
  return useApiMutation<Notification, NotificationCreate>({
    url: '/api/notifications',
    method: 'POST',
    successMessage: '通知创建成功',
    invalidateQueries: [
      queryKeys.notification.all,
    ],
  })
}

/**
 * 发送系统公告（管理员功能）
 */
export function useSendSystemAnnouncement() {
  return useApiMutation<Notification, {
    title: string
    content: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    expiresAt?: string
    targetScope: 'all' | 'company' | 'department'
    targetIds?: string[]
  }>({
    url: '/api/notifications/system-announcement',
    method: 'POST',
    successMessage: '系统公告发送成功',
    invalidateQueries: [
      queryKeys.notification.all,
      ['notifications', 'announcements'],
    ],
  })
}

/**
 * 更新通知设置
 */
export function useUpdateNotificationSettings() {
  const { user } = useAuth()
  
  return useApiMutation<any, {
    emailNotifications: boolean
    pushNotifications: boolean
    categories: Record<string, boolean>
    quietHours?: {
      enabled: boolean
      start: string
      end: string
    }
  }>({
    url: '/api/notifications/settings',
    method: 'PUT',
    successMessage: '通知设置更新成功',
  })
}

/**
 * 获取通知设置
 */
export function useNotificationSettings() {
  const { user } = useAuth()
  
  return useApiQuery({
    queryKey: ['notifications', 'settings', user?.id],
    url: '/api/notifications/settings',
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}
