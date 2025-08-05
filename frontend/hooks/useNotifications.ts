import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { useNotificationSSE } from './useNotificationSSE'

export interface Notification {
  id: string
  type: 'announcement' | 'personal_data' | 'personal_business'
  category: string
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  data?: any
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
            category: item.type || 'SYSTEM',
            title: item.title,
            message: item.content, // 后端使用 content 字段
            timestamp: item.createdAt,
            read: item.isRead || false, // 后端使用 isRead 字段
            priority: (item.type === 'ANNOUNCEMENT' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
            data: item.extraData || {}
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
    const formattedNotification = {
      id: newNotification.id,
      type: mapBackendTypeToFrontend(newNotification.type),
      category: newNotification.type || 'SYSTEM',
      title: newNotification.title,
      message: newNotification.content,
      timestamp: newNotification.createdAt,
      read: false,
      priority: (newNotification.type === 'ANNOUNCEMENT' ? 'high' : 'medium') as 'low' | 'medium' | 'high',
      data: {}
    }

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
