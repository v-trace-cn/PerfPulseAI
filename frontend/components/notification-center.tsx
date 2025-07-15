"use client"

import React, { useState, useEffect } from "react"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, ExternalLink } from "lucide-react"
import Link from "next/link"
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

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState('all')
  const [isOpen, setIsOpen] = useState(false)

  // 计算未读通知数量
  const unreadCount = notifications.filter(n => !n.read).length

  // 按类型过滤通知
  const getFilteredNotifications = (type: string) => {
    if (type === 'all') return notifications
    return notifications.filter(n => n.type === type)
  }

  // 标记通知为已读
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // 删除通知
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // 全部标记为已读
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
                <TabsTrigger value="announcement" className="text-xs">
                  公告 {getFilteredNotifications('announcement').length > 0 && `(${getFilteredNotifications('announcement').length})`}
                </TabsTrigger>
                <TabsTrigger value="personal" className="text-xs">
                  个人 {getFilteredNotifications('personal').length > 0 && `(${getFilteredNotifications('personal').length})`}
                </TabsTrigger>
                <TabsTrigger value="business" className="text-xs">
                  业务 {getFilteredNotifications('business').length > 0 && `(${getFilteredNotifications('business').length})`}
                </TabsTrigger>
              </TabsList>

              {['all', 'announcement', 'personal', 'business'].map(tab => (
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
  onDelete 
}: { 
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
        !notification.read && "bg-primary/5"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
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
