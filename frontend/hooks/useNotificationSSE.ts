import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context-rq'
import { useToast } from '@/components/ui/use-toast'
import { getBackendApiUrl } from '@/lib/config/api-config'

interface SSENotification {
  type: string
  notification?: {
    id: string
    title: string
    content: string
    type: string
    createdAt: string
    read: boolean
  }
  message?: string
}

interface UseNotificationSSEProps {
  onNewNotification?: (notification: any) => void
  onUnreadCountChange?: (count: number) => void
}

export function useNotificationSSE({ 
  onNewNotification, 
  onUnreadCountChange 
}: UseNotificationSSEProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!user?.id) {
      return
    }

    // 如果已有连接，先断开
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    try {
      const sseUrl = `${getBackendApiUrl()}/api/notifications/stream?user_id=${user.id}`
      const eventSource = new EventSource(sseUrl)

      eventSource.onopen = () => {
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSENotification = JSON.parse(event.data)

          switch (data.type) {
            case 'connected':
              break

            case 'heartbeat':
              // 心跳，保持连接
              break

            case 'new_notification':
              if (data.notification) {
                // 显示 toast 通知
                toast({
                  title: data.notification.title,
                  description: data.notification.content,
                  duration: 5000,
                })

                // 调用回调函数
                onNewNotification?.(data.notification)

                // 触发未读数量更新
                onUnreadCountChange?.(1)
              }
              break

            default:
              // 未知事件类型，忽略
          }
        } catch (error) {
          console.error('解析 SSE 数据失败:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE 连接错误:', error)
        eventSource.close()
        eventSourceRef.current = null

        // 尝试重连
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          toast({
            title: "连接失败",
            description: "实时通知连接失败，请刷新页面重试",
            variant: "destructive",
            duration: 10000,
          })
        }
      }

      eventSourceRef.current = eventSource
      
    } catch (error) {
      console.error('创建 SSE 连接失败:', error)
    }
  }, [user?.id, onNewNotification, onUnreadCountChange, toast])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    reconnectAttempts.current = 0
  }, [])

  useEffect(() => {
    if (user?.id) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user?.id, connect, disconnect])

  // 页面可见性变化时的处理 - 暂时禁用以调试连接问题
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时断开连接以节省资源
        disconnect()
      } else {
        // 页面显示时重新连接
        if (user?.id) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, connect, disconnect])

  return {
    connect,
    disconnect,
    isConnected: !!eventSourceRef.current
  }
}
