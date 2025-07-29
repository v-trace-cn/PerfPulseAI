"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, Filter, Search, MoreVertical, Trash2, Mail } from "lucide-react"
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

// 通知类型定义
export interface Notification {
  id: string
  type: 'announcement' | 'personal' | 'business'
  category: 'pr_score' | 'points_earned' | 'system_announcement' | 'mall_exchange' | 'mall_verification' | 'verification_staff'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  data?: any
}

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'business',
    category: 'pr_score',
    title: 'PR 评分完成',
    message: '您的 PR #123 "优化用户登录流程" 已完成评分，获得 85 分',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    priority: 'medium',
    data: { prId: '123', score: 85 }
  },
  {
    id: '2',
    type: 'personal',
    category: 'points_earned',
    title: '积分到账',
    message: '恭喜您获得 50 积分！来源：完成代码审查',
    timestamp: '2024-01-15T09:15:00Z',
    read: false,
    priority: 'medium',
    data: { points: 50, source: '完成代码审查' }
  },
  {
    id: '3',
    type: 'announcement',
    category: 'system_announcement',
    title: '系统维护通知',
    message: '系统将于今晚 22:00-24:00 进行维护升级，期间可能影响部分功能使用',
    timestamp: '2024-01-15T08:00:00Z',
    read: true,
    priority: 'high'
  },
  {
    id: '4',
    type: 'business',
    category: 'mall_exchange',
    title: '积分兑换成功',
    message: '您已成功兑换"星巴克咖啡券"，消耗 200 积分，请等待核销',
    timestamp: '2024-01-14T16:45:00Z',
    read: false,
    priority: 'low',
    data: { item: '星巴克咖啡券', points: 200 }
  },
  {
    id: '5',
    type: 'business',
    category: 'mall_verification',
    title: '兑换核销完成',
    message: '您的"技术书籍补贴"已核销完成，请查收相关资源',
    timestamp: '2024-01-14T14:20:00Z',
    read: true,
    priority: 'medium',
    data: { item: '技术书籍补贴' }
  },
  {
    id: '6',
    type: 'business',
    category: 'verification_staff',
    title: '待核销商品',
    message: '有 3 个积分商品兑换订单待您核销处理',
    timestamp: '2024-01-14T11:30:00Z',
    read: false,
    priority: 'high',
    data: { count: 3 }
  },
  {
    id: '7',
    type: 'personal',
    category: 'points_earned',
    title: '积分到账',
    message: '恭喜您获得 80 积分！来源：解决关键bug',
    timestamp: '2024-01-13T15:20:00Z',
    read: true,
    priority: 'medium',
    data: { points: 80, source: '解决关键bug' }
  },
  {
    id: '8',
    type: 'announcement',
    category: 'system_announcement',
    title: '新功能上线',
    message: '积分商城新增多款奖励商品，快来看看吧！',
    timestamp: '2024-01-13T10:00:00Z',
    read: true,
    priority: 'low'
  },
  {
    id: '9',
    type: 'business',
    category: 'pr_score',
    title: 'PR 评分完成',
    message: '您的 PR #124 "修复数据库连接问题" 已完成评分，获得 92 分',
    timestamp: '2024-01-12T14:30:00Z',
    read: true,
    priority: 'medium',
    data: { prId: '124', score: 92 }
  },
  {
    id: '10',
    type: 'business',
    category: 'mall_exchange',
    title: '积分兑换成功',
    message: '您已成功兑换"技术书籍补贴"，消耗 650 积分，请等待核销',
    timestamp: '2024-01-12T11:15:00Z',
    read: true,
    priority: 'low',
    data: { item: '技术书籍补贴', points: 650 }
  }
]

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const { toast } = useToast()

  // 计算未读通知数量 - 使用 useMemo 优化
  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  // 过滤通知 - 使用 useMemo 优化
  const getFilteredNotifications = useMemo(() => {
    return (type: string) => {
      let filtered = notifications

      // 按类型过滤
      if (type !== 'all') {
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

  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // 标记通知为未读
  const markAsUnread = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: false } : n)
    )
  }

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    toast({
      title: "通知已删除",
      description: "通知已成功删除",
    })
  }

  // 全部标记为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast({
      title: "操作成功",
      description: "所有通知已标记为已读",
    })
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    setNotifications([])
    toast({
      title: "操作成功",
      description: "所有通知已清空",
    })
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
              管理您的所有通知消息
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
                  <TabsTrigger value="announcement" className="text-sm">
                    公告 ({notifications.filter(n => n.type === 'announcement').length})
                  </TabsTrigger>
                  <TabsTrigger value="personal" className="text-sm">
                    个人 ({notifications.filter(n => n.type === 'personal').length})
                  </TabsTrigger>
                  <TabsTrigger value="business" className="text-sm">
                    业务 ({notifications.filter(n => n.type === 'business').length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {['all', 'announcement', 'personal', 'business'].map(tab => (
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
  onDelete
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group",
        !notification.read && "bg-primary/5 border-l-4 border-l-primary"
      )}
    >
      <div className={cn(
        "mt-1 p-2 rounded-full flex-shrink-0",
        getNotificationColor(notification.type, notification.priority),
        !notification.read && "bg-primary/10"
      )}>
        {getNotificationIcon(notification.category)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <h3 className="text-sm font-medium truncate">{notification.title}</h3>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
            <Badge
              variant="outline"
              className={cn("text-xs px-2 py-0", getPriorityColor(notification.priority))}
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

        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {notification.message}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span title={getFullTime(notification.timestamp)}>
            {formatTime(notification.timestamp)}
          </span>
          <Badge variant="secondary" className="text-xs">
            {notification.type === 'announcement' ? '公告' :
             notification.type === 'personal' ? '个人' : '业务'}
          </Badge>
        </div>

        {/* 显示额外数据 */}
        {notification.data && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
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
