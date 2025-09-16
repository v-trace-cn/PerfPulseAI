"use client"

import React, { useState } from "react"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, ExternalLink, Copy } from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"



// 获取通知图标 - 支持新的分类系统
const getNotificationIcon = (category: string) => {
  switch (category) {
    case 'ACHIEVEMENT':
      return <TrendingUp className="h-4 w-4" />
    case 'TRANSACTION':
      return <Gift className="h-4 w-4" />
    case 'SOCIAL':
      return <User className="h-4 w-4" />
    case 'SYSTEM':
      return <Megaphone className="h-4 w-4" />
    case 'WORKFLOW':
      return <Briefcase className="h-4 w-4" />
    case 'ALERT':
      return <AlertCircle className="h-4 w-4" />
    // 兼容旧的分类
    case 'pr_score':
      return <TrendingUp className="h-4 w-4" />
    case 'points_earned':
      return <Gift className="h-4 w-4" />
    case 'system_announcement':
      return <Megaphone className="h-4 w-4" />
    case 'mall_exchange':
    case 'mall_verification':
    case 'REDEMPTION':
      return <Gift className="h-4 w-4" />
    case 'verification_staff':
      return <Briefcase className="h-4 w-4" />
    default:
      return <AlertCircle className="h-4 w-4" />
  }
}

// 获取通知颜色 - 基于优先级和分类
const getNotificationColor = (category: string, priority: string) => {
  // 优先级颜色
  switch (priority) {
    case 'CRITICAL':
      return 'text-red-600'
    case 'HIGH':
      return 'text-orange-500'
    case 'NORMAL':
      return 'text-blue-500'
    case 'LOW':
      return 'text-gray-500'
  }

  // 分类颜色
  switch (category) {
    case 'ACHIEVEMENT':
      return 'text-green-500'
    case 'TRANSACTION':
      return 'text-blue-500'
    case 'SOCIAL':
      return 'text-purple-500'
    case 'SYSTEM':
      return 'text-blue-500'
    case 'WORKFLOW':
      return 'text-orange-500'
    case 'WARN':
      return 'text-red-500'
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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [isOpen, setIsOpen] = useState(false)

  // 使用统一的通知数据 hook（现在包含 SSE 支持）
  const {
    notifications,
    loading,
    refetch,
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
        {/* 显示结构化数据或通知摘要 */}
        {notification.data && Object.keys(notification.data).length > 0 ? (
          <div className="mt-2">
            {/* 成就通知 */}
            {notification.category === 'ACHIEVEMENT' && (
              <div className="space-y-1 p-2 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">🏆</span>
                  <span className="text-green-700 font-medium text-xs">
                    {notification.data.achievementName || '新成就'}
                  </span>
                </div>
                {notification.data.pointsEarned && (
                  <div className="text-green-600 text-xs">
                    奖励积分: +{notification.data.pointsEarned}
                  </div>
                )}
              </div>
            )}

            {/* 交易通知 */}
            {notification.category === 'TRANSACTION' && notification.data && (
              <div className="space-y-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-medium">🎉</span>
                  <span className="text-blue-700 font-medium text-xs">兑换成功</span>
                </div>
                <div className="text-xs text-gray-700">
                  成功兑换 <span className="font-medium">{notification.data.item || '商品'}</span>
                  {notification.data.points !== undefined && (
                    <span>，消耗 <span className="font-medium">{notification.data.points}</span> 积分</span>
                  )}
                </div>
                {notification.data.hrContact && (
                  <div className="text-xs text-gray-600">
                    请联系 <span className="font-medium text-blue-700">{notification.data.hrContact}</span> 完成兑换
                  </div>
                )}
                <div className="text-xs text-blue-600">
                  点击获取获取密钥
                </div>
              </div>
            )}

            {/* 工作流通知 */}
            {/* {notification.category === 'WORKFLOW' && (
              <div className="space-y-1">
                <span className="text-orange-600 font-medium">
                  📋 {notification.data.workflowType || '工作流'}
                </span>
                {notification.data.deadline && (
                  <span className="block text-red-500">
                    截止时间: {new Date(notification.data.deadline).toLocaleString()}
                  </span>
                )}
              </div>
            )} */}

            {/* 警告通知 */}
            {notification.category === 'ALERT' && (
              <div className="space-y-1">
                <span className="text-red-600 font-medium">
                  🚨 {notification.data.alertType || '安全警告'}
                </span>
                {notification.data.severity && (
                  <span className="block">严重程度: {notification.data.severity}</span>
                )}
              </div>
            )}

            {/* 积分通知 */}
            {(notification.category === 'ACHIEVEMENT' || notification.category === 'points_earned') && notification.data.pointsChange && (
              <span>积分变动: {notification.data.pointsChange > 0 ? '+' : ''}{notification.data.pointsChange}</span>
            )}

            {/* 兼容旧的分类 */}
            {notification.category === 'pr_score' && (
              <span>PR #{notification.data.prId} - 评分: {notification.data.score}</span>
            )}
            {notification.category === 'points_earned' && (
              <span>获得积分: +{notification.data.points} ({notification.data.source})</span>
            )}
            {notification.category === 'REDEMPTION' && !notification.data.redeemCode && (
              <span>兑换商品: {notification.data.item} - 消耗积分: {notification.data.points}</span>
            )}
            {notification.category === 'mall_verification' && (
              <span>核销商品: {notification.data.item}</span>
            )}
            {notification.category === 'verification_staff' && (
              <span>待处理订单: {notification.data.count} 个</span>
            )}
          </div>
        ) : (
          /* 如果没有结构化数据，显示通知摘要 */
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {notification.summary || notification.message || ''}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatTime(notification.timestamp)}
          </span>
          <div className="flex items-center gap-1">
            {/* 优先级标识 */}
            {notification.priority && (
              <Badge
                variant={
                  notification.priority === 'CRITICAL' ? 'destructive' :
                  notification.priority === 'HIGH' ? 'default' :
                  notification.priority === 'high' ? 'destructive' :
                  'secondary'
                }
                className="text-xs px-1 py-0"
              >
                {notification.priority === 'CRITICAL' ? '紧急' :
                 notification.priority === 'HIGH' ? '重要' :
                 notification.priority === 'high' ? '重要' :
                 notification.priority === 'NORMAL' ? '普通' :
                 notification.priority === 'LOW' ? '低' : notification.priority}
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
