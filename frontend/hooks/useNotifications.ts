import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context-rq'
import { useToast } from '@/components/ui/use-toast'
import { useNotificationSSE } from './useNotificationSSE'
import { notificationEvents } from '@/lib/notification-events'

export interface Notification {
  id: string
  type: 'announcement' | 'personal_data' | 'personal_business'
  category: string
  title: string
  message: string
  summary?: string  // 新增摘要字段
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'  // 支持新的优先级
  data?: any
  // 新增字段
  actionUrl?: string
  actionLabel?: string
  expiresAt?: string
  source?: string
  tags?: string[]
}

// 映射后端通知类型到前端类型
function mapBackendTypeToFrontend(backendType: string): 'announcement' | 'personal_data' | 'personal_business' {
  switch (backendType) {
    case 'ANNOUNCEMENT':
      return 'announcement'
    case 'POINTS_EARNED':
    case 'LEVEL_UP':
      return 'personal_data'
    case 'REDEMPTION':
    case 'VERIFICATION':
      return 'personal_business'
    default:
      return 'personal_business'
  }
}

export function useNotifications(category?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchNotifications = async () => {
    if (!user?.id) {
      console.log('useNotifications: 用户未登录')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category && category !== 'all') {
        params.append('category', category)
      }
      params.append('limit', '50')

      const url = `/api/notifications?${params}`
      const response = await fetch(url, {
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        const data = await response.json()
        const formattedNotifications = (Array.isArray(data) ? data : []).map((item: any) => {
          // 根据后端通知类型映射到前端类型
          let frontendType: 'announcement' | 'personal_data' | 'personal_business' = 'personal_business'
          if (item.type === 'ANNOUNCEMENT') {
            frontendType = 'announcement'
          } else if (item.type === 'PERSONAL_DATA' || item.type === 'POINTS') {
            frontendType = 'personal_data'
          } else if (item.type === 'PERSONAL_BUSINESS' || item.type === 'REDEMPTION') {
            frontendType = 'personal_business'
          }

          return {
            id: String(item.id),
            type: frontendType,
            category: item.category || item.type || 'SYSTEM',  // 优先使用新的 category 字段
            title: item.title,
            message: item.content, // 后端使用 content 字段
            summary: item.summary, // 新增摘要字段
            timestamp: item.createdAt,
            read: item.status === 'READ' || item.isRead || false, // 支持新的状态字段
            priority: item.priority || (item.type === 'ANNOUNCEMENT' ? 'high' : 'medium'), // 支持新的优先级
            data: item.payload || item.extraData || {}, // 优先使用新的 payload 字段
            actionUrl: item.actionUrl,
            actionLabel: item.actionLabel,
            expiresAt: item.expiresAt,
            source: item.source,
            tags: item.tags
          }
        })
        setNotifications(formattedNotifications)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '获取通知失败')
      }
    } catch (err) {
      console.error('useNotifications: 获取通知失败:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        )
      } else {
        console.error('标记已读失败')
      }
    } catch (err) {
      console.error('标记通知为已读失败:', err)
      toast({
        title: "操作失败",
        description: "标记通知为已读失败",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, read: true }))
        )
        toast({
          title: "操作成功",
          description: "所有通知已标记为已读",
        })
      } else {
        console.error('批量标记已读失败')
        toast({
          title: "操作失败",
          description: "批量标记通知为已读失败",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('批量标记通知为已读失败:', err)
      toast({
        title: "操作失败",
        description: "批量标记通知为已读失败",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        )
        toast({
          title: "删除成功",
          description: "通知已删除",
        })
      } else {
        console.error('删除通知失败')
        toast({
          title: "删除失败",
          description: "删除通知失败",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error('删除通知失败:', err)
      toast({
        title: "删除失败",
        description: "删除通知失败",
        variant: "destructive",
      })
    }
  }

  // 处理新通知的回调
  const handleNewNotification = useCallback((newNotification: any) => {
    console.log('收到新通知:', newNotification)

    // 使用与 fetchNotifications 相同的数据映射逻辑
    const frontendType = mapBackendTypeToFrontend(newNotification.type || newNotification.category)

    const formattedNotification = {
      id: String(newNotification.id),
      type: frontendType,
      category: newNotification.category || newNotification.type || 'SYSTEM',
      title: newNotification.title,
      message: newNotification.content || newNotification.summary || '',
      summary: newNotification.summary,
      timestamp: newNotification.createdAt,
      read: newNotification.status === 'READ' || newNotification.isRead || false,
      priority: newNotification.priority || (newNotification.type === 'ANNOUNCEMENT' ? 'high' : 'medium'),
      data: newNotification.payload || newNotification.extraData || {},
      actionUrl: newNotification.actionUrl,
      actionLabel: newNotification.actionLabel,
      expiresAt: newNotification.expiresAt,
      source: newNotification.source,
      tags: newNotification.tags
    }

    console.log('格式化后的通知:', formattedNotification)
    setNotifications(prev => [formattedNotification, ...prev])
  }, [])

  // 处理未读数量变化的回调
  const handleUnreadCountChange = useCallback((_count: number) => {
    // 这里不需要做任何事情，因为新通知已经通过 handleNewNotification 添加到列表中了
  }, [])

  // 初始化 SSE 连接
  useNotificationSSE({
    onNewNotification: handleNewNotification,
    onUnreadCountChange: handleUnreadCountChange
  })

  useEffect(() => {
    fetchNotifications()
  }, [user?.id, category])

  // 监听通知刷新事件
  useEffect(() => {
    const unsubscribe = notificationEvents.on('refresh', () => {
      console.log('收到通知刷新事件，重新获取通知')
      fetchNotifications()
    })

    return unsubscribe
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
