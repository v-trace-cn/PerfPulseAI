"use client"

import React, { useState } from "react"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useNotifications, type Notification } from "@/hooks/useNotifications"
import { formatRelativeTime } from "@/lib/timezone-utils"





// 获取通知图标
const getNotificationIcon = (category: string) => {
  switch (category) {
    case 'pr_score':
      return <TrendingUp className="h-4 w-4" />
    case 'points_earned':
      return <Gift className="h-4 w-4" />
    case 'system_announcement':
      return <Megaphone className="h-4 w-4" />
    case 'mall_exchange':
    case 'mall_verification':
      return <Gift className="h-4 w-4" />
    case 'verification_staff':
      return <Briefcase className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

// 获取通知颜色
const getNotificationColor = (type: string, priority: string) => {
  if (priority === 'high') return 'text-red-500'
  switch (type) {
    case 'announcement':
      return 'text-blue-500'
    case 'personal':
      return 'text-green-500'
    case 'business':
      return 'text-orange-500'
    default:
      return 'text-gray-500'
  }
}

// 格式化时间 - 使用中国时区
const formatTime = (timestamp: string) => {
  return formatRelativeTime(timestamp)
}

// 转换后端通知类型为前端类型


export default function NotificationCenter() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [isOpen, setIsOpen] = useState(false)

  // 使用统一的通知数据 hook（现在包含 SSE 支持）
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()





  // 计算未读通知数量
  const unreadCount = notifications.filter(n => !n.read).length

  // 处理通知点击，跳转到通知中心页面
  const handleNotificationClick = (notification: Notification) => {
    // 关闭下拉菜单
    setIsOpen(false)

    // 如果未读，先标记为已读
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // 跳转到通知中心页面，并通过 URL 参数传递通知 ID
    router.push(`/notifications?highlight=${notification.id}`)
  }

  // 如果用户未登录，不显示通知中心
  if (!user?.id) {
    return null
  }

  // 按类型过滤通知
  const getFilteredNotifications = (type: string) => {
    if (type === 'all') return notifications
    if (type === 'unread') return notifications.filter(n => !n.read)
    if (type === 'announcement') return notifications.filter(n => n.type === 'announcement')
    if (type === 'personal') return notifications.filter(n => n.type === 'personal_data' || n.type === 'personal_business')
    return notifications.filter(n => n.type === type)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">通知中心</CardTitle>
              <div className="flex items-center gap-2">
                <Link href="/notifications">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    查看全部
                  </Button>
                </Link>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    全部已读
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
                <TabsTrigger value="all" className="text-xs">
                  全部 {notifications.length > 0 && `(${notifications.length})`}
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  未读 {getFilteredNotifications('unread').length > 0 && `(${getFilteredNotifications('unread').length})`}
                </TabsTrigger>
                <TabsTrigger value="announcement" className="text-xs">
                  公告 {getFilteredNotifications('announcement').length > 0 && `(${getFilteredNotifications('announcement').length})`}
                </TabsTrigger>
                <TabsTrigger value="personal" className="text-xs">
                  个人 {getFilteredNotifications('personal').length > 0 && `(${getFilteredNotifications('personal').length})`}
                </TabsTrigger>
              </TabsList>

              {['all', 'unread', 'announcement', 'personal'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <ScrollArea className="h-96">
                    <div className="space-y-1 px-4 pb-4">
                      {getFilteredNotifications(tab).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          暂无通知
                        </div>
                      ) : (
                        getFilteredNotifications(tab).map((notification, index) => (
                          <div key={notification.id}>
                            <NotificationItem
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onDelete={deleteNotification}
                              onClick={handleNotificationClick}
                            />
                            {index < getFilteredNotifications(tab).length - 1 && (
                              <Separator className="my-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 通知项组件
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (notification: Notification) => void
}) {
  const handleClick = () => {
    if (onClick) {
      onClick(notification)
    } else if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "mt-1 p-1 rounded-full",
        getNotificationColor(notification.type, notification.priority)
      )}>
        {getNotificationIcon(notification.category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium truncate">{notification.title}</h4>
          {!notification.read && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>

        {/* 显示额外数据 */}
        {notification.data && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
            {notification.category === 'pr_score' && (
              <span>PR #{notification.data.prId} - 评分: {notification.data.score}</span>
            )}
            {notification.category === 'points_earned' && (
              <span>获得积分: +{notification.data.points} ({notification.data.source})</span>
            )}
            {notification.category === 'mall_exchange' && notification.data.redeemCode && (
              <div className="space-y-1">
                <span>兑换商品: {notification.data.item} - 消耗积分: {notification.data.points}</span>
                <div className="font-mono bg-primary/10 px-2 py-1 rounded border">
                  兑换密钥: <span className="font-bold text-primary">{notification.data.redeemCode}</span>
                </div>
              </div>
            )}
            {notification.category === 'mall_exchange' && !notification.data.redeemCode && (
              <span>兑换商品: {notification.data.item} - 消耗积分: {notification.data.points}</span>
            )}
            {notification.category === 'mall_verification' && (
              <span>核销商品: {notification.data.item}</span>
            )}
            {notification.category === 'verification_staff' && (
              <span>待处理订单: {notification.data.count} 个</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatTime(notification.timestamp)}
          </span>
          <div className="flex items-center gap-1">
            {notification.priority === 'high' && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                重要
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
