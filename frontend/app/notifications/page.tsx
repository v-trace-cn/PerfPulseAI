"use client"

import React, { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, Filter, Search, MoreVertical, Trash2, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications, type Notification } from "@/hooks/useNotifications"




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

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

// 获取完整时间
const getFullTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 内部组件，使用 useSearchParams
function NotificationsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const { toast } = useToast()

  // 使用真实数据
  const {
    notifications,
    loading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(activeTab === 'all' ? undefined : activeTab)

  // 计算未读通知数量 - 使用 useMemo 优化
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  // 处理 URL 参数中的高亮通知
  useEffect(() => {
    const highlight = searchParams.get('highlight')
    if (highlight) {
      setHighlightId(highlight)
      // 3秒后清除高亮
      const timer = setTimeout(() => {
        setHighlightId(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // 过滤通知 - 使用 useMemo 优化
  const getFilteredNotifications = useMemo(() => {
    return (type: string) => {
      let filtered = notifications

      // 按类型过滤
      if (type === 'unread') {
        filtered = filtered.filter(n => !n.read)
      } else if (type === 'announcement') {
        filtered = filtered.filter(n => n.type === 'announcement')
      } else if (type === 'personal') {
        filtered = filtered.filter(n => n.type === 'personal_data' || n.type === 'personal_business')
      } else if (type !== 'all') {
        filtered = filtered.filter(n => n.type === type)
      }

      // 按搜索关键词过滤
      if (searchQuery) {
        const lowerSearchQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(n =>
          n.title.toLowerCase().includes(lowerSearchQuery) ||
          n.message.toLowerCase().includes(lowerSearchQuery)
        )
      }

      // 按优先级过滤
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(n => n.priority === priorityFilter)
      }

      // 按已读状态过滤
      if (readFilter === 'unread') {
        filtered = filtered.filter(n => !n.read)
      } else if (readFilter === 'read') {
        filtered = filtered.filter(n => n.read)
      }

      // 按时间排序（最新的在前）
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
  }, [notifications, searchQuery, priorityFilter, readFilter]);

  // 标记通知为未读
  const markAsUnread = (id: string) => {
    // 这个功能暂时只在前端实现，后端可以后续添加
    toast({
      title: "功能暂未实现",
      description: "标记为未读功能正在开发中",
      variant: "destructive",
    })
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    // 这个功能暂时只在前端实现，后端可以后续添加
    toast({
      title: "功能暂未实现",
      description: "清空所有通知功能正在开发中",
      variant: "destructive",
    })
  }

  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载通知中...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                重新加载
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Bell className="mr-3 h-8 w-8" />
              通知中心
            </h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} 条未读
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                全部已读
              </Button>
            )}
            <Button variant="outline" onClick={clearAllNotifications}>
              <Trash2 className="h-4 w-4 mr-2" />
              清空通知
            </Button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索通知..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部优先级</SelectItem>
                    <SelectItem value="high">高优先级</SelectItem>
                    <SelectItem value="medium">中优先级</SelectItem>
                    <SelectItem value="low">低优先级</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="unread">未读</SelectItem>
                    <SelectItem value="read">已读</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知列表 */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="p-4 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="text-sm">
                    全部 ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-sm">
                    未读 ({notifications.filter(n => !n.read).length})
                  </TabsTrigger>
                  <TabsTrigger value="announcement" className="text-sm">
                    公告 ({notifications.filter(n => n.type === 'announcement').length})
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="text-sm">
                    个人 ({notifications.filter(n => n.type === 'personal_data' || n.type === 'personal_business').length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {['all', 'unread', 'announcement', 'personal'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-1 p-4">
                      {getFilteredNotifications(tab).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">暂无通知</p>
                          <p className="text-sm">当前筛选条件下没有找到相关通知</p>
                        </div>
                      ) : (
                        getFilteredNotifications(tab).map((notification, index) => (
                          <div key={notification.id}>
                            <NotificationItem
                              notification={notification}
                              onMarkAsRead={markAsRead}
                              onMarkAsUnread={markAsUnread}
                              onDelete={deleteNotification}
                              isHighlighted={highlightId === notification.id}
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
      </main>
    </div>
  )
}

// 通知项组件
function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  isHighlighted = false
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
  isHighlighted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg transition-all duration-500 group relative",
        // 未读消息样式
        !notification.read && "bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10",
        // 已读消息样式 - 更明显的灰色背景和降低透明度
        notification.read && "bg-muted/30 hover:bg-muted/50 opacity-70",
        // 高亮样式
        isHighlighted && "bg-yellow-100 border-2 border-yellow-400 shadow-lg scale-[1.02]"
      )}
    >
      <div className={cn(
        "mt-1 p-2 rounded-full flex-shrink-0 transition-all",
        getNotificationColor(notification.type, notification.priority),
        // 未读消息图标样式
        !notification.read && "bg-primary/10 ring-2 ring-primary/20",
        // 已读消息图标样式 - 降低饱和度
        notification.read && "opacity-60 grayscale-[0.3]"
      )}>
        {getNotificationIcon(notification.category)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <h3 className={cn(
              "text-sm font-medium truncate",
              // 已读消息标题样式
              notification.read && "text-muted-foreground"
            )}>
              {notification.title}
            </h3>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 animate-pulse" />
            )}
            {notification.read && (
              <Badge variant="secondary" className="text-xs px-2 py-0 bg-muted text-muted-foreground">
                已读
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0",
                getPriorityColor(notification.priority),
                // 已读消息优先级标签样式
                notification.read && "opacity-60"
              )}
            >
              {notification.priority === 'high' ? '高' : notification.priority === 'medium' ? '中' : '低'}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {notification.read ? (
                <DropdownMenuItem onClick={() => onMarkAsUnread(notification.id)}>
                  <Mail className="h-4 w-4 mr-2" />
                  标记为未读
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  标记为已读
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(notification.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className={cn(
          "text-sm mb-3 leading-relaxed",
          // 已读消息内容样式
          notification.read ? "text-muted-foreground/80" : "text-foreground"
        )}>
          {notification.message}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span
            title={getFullTime(notification.timestamp)}
            className={cn(
              notification.read ? "text-muted-foreground/60" : "text-muted-foreground"
            )}
          >
            {formatTime(notification.timestamp)}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              notification.read && "opacity-60"
            )}
          >
            {notification.type === 'announcement' ? '公告' :
             notification.type === 'personal_data' ? '个人数据' :
             notification.type === 'personal_business' ? '个人业务' : '其他'}
          </Badge>
        </div>

        {/* 显示额外数据 */}
        {notification.data && (
          <div className={cn(
            "mt-3 p-2 rounded text-xs",
            // 已读消息额外数据样式
            notification.read ? "bg-muted/30 text-muted-foreground/70" : "bg-muted/50 text-muted-foreground"
          )}>
            {notification.category === 'pr_score' && (
              <span>PR #{notification.data.prId} - 评分: {notification.data.score}</span>
            )}
            {notification.category === 'points_earned' && (
              <span>获得积分: +{notification.data.points} ({notification.data.source})</span>
            )}
            {notification.category === 'mall_exchange' && (
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
      </div>
    </div>
  )
}

// 主导出组件，包装 Suspense
export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载通知中...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  )
}
