/**
 * 通知事件系统
 * 用于在应用中触发通知刷新
 */

type NotificationEventType = 'refresh' | 'new_notification' | 'mark_read' | 'delete'

interface NotificationEvent {
  type: NotificationEventType
  data?: any
}

type NotificationEventListener = (event: NotificationEvent) => void

class NotificationEventEmitter {
  private listeners: Map<NotificationEventType, Set<NotificationEventListener>> = new Map()

  /**
   * 添加事件监听器
   */
  on(type: NotificationEventType, listener: NotificationEventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)

    // 返回取消监听的函数
    return () => {
      this.off(type, listener)
    }
  }

  /**
   * 移除事件监听器
   */
  off(type: NotificationEventType, listener: NotificationEventListener) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(type: NotificationEventType, data?: any) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const event: NotificationEvent = { type, data }
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('通知事件监听器执行失败:', error)
        }
      })
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    this.listeners.clear()
  }
}

// 创建全局事件发射器实例
export const notificationEvents = new NotificationEventEmitter()

// 便捷方法
export const notificationEventHelpers = {
  /**
   * 触发通知刷新
   */
  refreshNotifications: () => {
    console.log('触发通知刷新事件')
    notificationEvents.emit('refresh')
  },

  /**
   * 通知有新通知
   */
  notifyNewNotification: (notification: any) => {
    console.log('触发新通知事件:', notification)
    notificationEvents.emit('new_notification', notification)
  },

  /**
   * 通知标记已读
   */
  notifyMarkRead: (notificationId: string) => {
    console.log('触发标记已读事件:', notificationId)
    notificationEvents.emit('mark_read', { notificationId })
  },

  /**
   * 通知删除
   */
  notifyDelete: (notificationId: string) => {
    console.log('触发删除通知事件:', notificationId)
    notificationEvents.emit('delete', { notificationId })
  }
}
