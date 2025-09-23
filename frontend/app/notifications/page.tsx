"use client"

import React, { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Bell, X, Check, AlertCircle, Gift, TrendingUp, Megaphone, User, Briefcase, Filter, Search, MoreVertical, Trash2, Mail, Loader2, Copy } from "lucide-react"
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
import { formatRelativeTime, getFullChinaTime } from "@/lib/timezone-utils"




// 获取通知图标
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

  // 分类颜色（兼容旧版本）
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
    case 'ALERT':
      return 'text-red-500'
    // 兼容旧的分类
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
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'LOW':
      return 'bg-gray-100 text-gray-800 border-gray-200'
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

// 格式化时间 - 使用中国时区
const formatTime = (timestamp: string) => {
  return formatRelativeTime(timestamp)
}

// 获取完整时间 - 使用中国时区
const getFullTime = (timestamp: string) => {
  return getFullChinaTime(timestamp)
}

// 内部组件，使用 useSearchParams
function NotificationsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('unread')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const { toast } = useToast()

  // 复制兑换密钥到剪贴板
  const copyRedeemCode = async (redeemCode: string, event: React.MouseEvent) => {
    event.stopPropagation() // 阻止事件冒泡
    try {
      await navigator.clipboard.writeText(redeemCode)
      toast({
        title: "复制成功",
        description: "兑换密钥已复制到剪贴板",
      })
    } catch (error) {
      // 如果 clipboard API 不可用，使用备用方法
      const textArea = document.createElement('textarea')
      textArea.value = redeemCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      toast({
        title: "复制成功",
        description: "兑换密钥已复制到剪贴板",
      })
    }
  }

  // 获取URL中的高亮通知ID
  useEffect(() => {
    const highlight = searchParams.get('highlight')
    if (highlight) {
      setHighlightId(highlight)
      // 当有高亮通知时，切换到"全部"标签页
      setActiveTab('all')
      // 自动滚动到高亮通知
      const timer = setTimeout(() => {
        const element = document.getElementById(`notification-${highlight}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          console.log('未找到高亮通知元素')
        }
      }, 1000) // 增加延迟确保数据加载完成

      return () => clearTimeout(timer)
    }
  }, [searchParams])

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

  // 调试信息
  console.log('通知页面状态:', {
    notifications: notifications.length,
    loading,
    error,
    activeTab,
    highlight: searchParams.get('highlight')
  })

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
              <p className="text-red-600 mb-4">{error instanceof Error ? error.message : String(error)}</p>
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
            <div className="text-muted-foreground">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} 条未读
                </Badge>
              )}
            </div>
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
                  <TabsTrigger value="unread" className="text-sm">
                    未读 ({notifications.filter(n => !n.read).length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-sm">
                    全部
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
                              onCopyRedeemCode={copyRedeemCode}
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
  onCopyRedeemCode,
  isHighlighted = false
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
  onCopyRedeemCode: (redeemCode: string, event: React.MouseEvent) => void
  isHighlighted?: boolean
}) {
  return (
    <div
      id={`notification-${notification.id}`}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg transition-all duration-500 group relative",
        // 未读消息样式
        !notification.read && "bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10",
        // 已读消息样式 - 轻微的背景色区别
        notification.read && "bg-gray-50 hover:bg-gray-100",
        // 高亮样式
        isHighlighted && "bg-yellow-100 border-2 border-yellow-400 shadow-lg scale-[1.02]"
      )}
    >
      {/* 通知图标 */}
      <div className={cn(
        "mt-1 p-3 rounded-full flex-shrink-0 transition-all",
        getNotificationColor(notification.type, notification.priority),
        // 未读消息图标样式
        !notification.read && "bg-primary/10 ring-2 ring-primary/20 shadow-md",
        // 已读消息图标样式
        notification.read && "opacity-70"
      )}>
        {getNotificationIcon(notification.category)}
      </div>

      {/* 通知内容区域 */}
      <div className="flex-1 min-w-0 ml-4">
        {/* 顶部标题行 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground truncate">
              {notification.title}
            </h3>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>

          {/* 操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
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

        {/* 底部信息行：时间戳 + 标签 */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span
            title={getFullTime(notification.timestamp)}
            className="text-muted-foreground"
          >
            {formatTime(notification.timestamp)}
          </span>
          <div className="flex items-center gap-2">
            {/* 优先级标识 */}
            {notification.priority && (
              <Badge
                variant={
                  notification.priority === 'CRITICAL' ? 'destructive' :
                  notification.priority === 'HIGH' ? 'default' :
                  'secondary'
                }
                className="text-xs px-2 py-0"
              >
                {notification.priority === 'CRITICAL' ? '紧急' :
                 notification.priority === 'HIGH' ? '重要' :
                 notification.priority === 'NORMAL' ? '普通' :
                 notification.priority === 'LOW' ? '低' : notification.priority}
              </Badge>
            )}
            {/* 分类标识 */}
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {notification.category === 'ACHIEVEMENT' ? '成就' :
               notification.category === 'TRANSACTION' ? '交易' :
               notification.category === 'SOCIAL' ? '社交' :
               notification.category === 'SYSTEM' ? '系统' :
               notification.category === 'WORKFLOW' ? '工作流' :
               notification.category === 'ALERT' ? '警告' :
               notification.type === 'announcement' ? '公告' :
               notification.type === 'personal_data' ? '个人数据' :
               notification.type === 'personal_business' ? '个人业务' : '其他'}
            </Badge>
          </div>
        </div>

        {/* 显示结构化数据或通知摘要 */}
        {notification.data && Object.keys(notification.data).length > 0 ? (
          <div className="space-y-2">
            {/* 成就通知 */}
            {notification.category === 'ACHIEVEMENT' && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-green-600 font-medium text-2xl">🏆</span>
                  <div>
                    <h4 className="font-semibold text-green-800 text-lg">恭喜获得新成就！</h4>
                    <p className="text-green-700 font-medium">{notification.data.achievementName || '新成就'}</p>
                  </div>
                </div>

                {notification.data.pointsEarned && (
                  <div className="bg-white p-3 rounded-md border border-green-200">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-lg">💰</span>
                      <span className="text-green-700 font-medium">
                        奖励积分: <span className="text-green-800 font-bold text-lg">+{notification.data.pointsEarned}</span>
                      </span>
                    </div>
                  </div>
                )}

                {notification.data.description && (
                  <div className="text-gray-700 text-sm bg-white p-3 rounded-md border border-green-200">
                    <span className="text-gray-500 text-xs">成就描述</span>
                    <p className="mt-1">{notification.data.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* 交易通知 */}
            {notification.category === 'TRANSACTION' && notification.data.redeemCode && (
              <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-600 font-medium text-lg">🎉</span>
                  <span className="font-semibold text-blue-800">兑换成功</span>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    恭喜您成功兑换 <span className="font-medium text-blue-700">{notification.data.item}</span>！
                    消耗 <span className="font-medium">{notification.data.points}</span> 积分。
                  </p>

                  <div className="bg-white p-3 rounded-md border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">兑换密钥</p>
                        <span className="font-mono text-blue-700 font-bold text-base">
                          {notification.data.redeemCode}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-100 border border-blue-200 rounded"
                        onClick={(e) => onCopyRedeemCode(notification.data.redeemCode, e)}
                        title="复制兑换密钥"
                      >
                        <Copy className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-sm">📞</span>
                    <span className="text-sm">请联系 <span className="font-medium text-blue-700">{notification.data.hrContact}</span> 完成兑换</span>
                  </div>

                  {/* 有效期暂时隐藏 */}
                  {false && notification.data.validUntil && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                      <span>⏰</span>
                      <span>有效期至: {notification.data.validUntil}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 工作流通知 */}
            {notification.category === 'WORKFLOW' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-medium">📋</span>
                  <span className="font-medium">{notification.data.workflowType || '工作流'}</span>
                </div>
                {notification.data.deadline && (
                  <div className="text-red-500">
                    截止时间: {new Date(notification.data.deadline).toLocaleString()}
                  </div>
                )}
                {notification.data.assignee && (
                  <div className="text-gray-600">
                    负责人: {notification.data.assignee}
                  </div>
                )}
              </div>
            )}

            {/* 警告通知 */}
            {notification.category === 'ALERT' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-medium">🚨</span>
                  <span className="font-medium text-red-600">{notification.data.alertType || '安全警告'}</span>
                </div>
                {notification.data.severity && (
                  <div className="text-red-500">
                    严重程度: {notification.data.severity}
                  </div>
                )}
                {notification.data.affectedSystems && (
                  <div className="text-gray-600">
                    影响系统: {notification.data.affectedSystems.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* 兼容旧的分类 */}
            {notification.category === 'pr_score' && (
              <span>PR #{notification.data.prId} - 评分: {notification.data.score}</span>
            )}
            {notification.category === 'points_earned' && (
              <span>获得积分: +{notification.data.points} ({notification.data.source})</span>
            )}
            {notification.category === 'REDEMPTION' && (
              <div className="space-y-2">
                <span>恭喜您成功兑换 {notification.data.item}！消耗 {notification.data.points} 积分。</span>
                {notification.data.redeemCode && (
                  <div className="inline-flex items-center gap-2">
                    <span className="font-mono bg-blue-50 text-blue-700 px-3 py-2 rounded border border-blue-200">
                      兑换密钥: <span className="font-bold">{notification.data.redeemCode}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-100 border border-blue-200 rounded"
                      onClick={(e) => onCopyRedeemCode(notification.data.redeemCode, e)}
                      title="复制兑换密钥"
                    >
                      <Copy className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </div>
                )}
                <span className="text-gray-600">请联系 {notification.data.hrContact} 完成兑换。</span>
              </div>
            )}
            {notification.category === 'mall_verification' && (
              <span>核销商品: {notification.data.item}</span>
            )}
            {notification.category === 'verification_staff' && (
              <span>待处理订单: {notification.data.count} 个</span>
            )}
          </div>
        ) : (
          /* 如果没有结构化数据，显示通知摘要或消息 */
          (notification.summary || notification.message) && (
            <div className="p-3 rounded text-sm bg-muted/30 text-foreground leading-relaxed">
              {notification.summary || notification.message}
            </div>
          )
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
