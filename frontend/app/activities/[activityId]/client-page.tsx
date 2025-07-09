"use client"

import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  GitPullRequest,
  Star,
  Code,
  MessageSquare,
  Award,
  Calendar,
  User,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useApi } from "@/hooks/useApi"
import { unifiedApi, prApi } from "@/lib/unified-api"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export default function ActivityPageClient() {
  const params = useParams()
  const activityId = params.activityId as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State for activity data
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch activity data
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true)
        const response = await unifiedApi.activity.getActivityByShowId(activityId)
        if (response.success) {
          setActivity(response.data)
        } else {
          setError(response.message || '获取活动详情失败')
        }
      } catch (err) {
        setError('获取活动详情失败')
        console.error('Error fetching activity:', err)
      } finally {
        setLoading(false)
      }
    }

    if (activityId) {
      fetchActivity()
    }
  }, [activityId])

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">活动详情</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">活动详情</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>未找到活动信息</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">活动详情</h1>
      </div>

      {/* Activity Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">{activity.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{activity.user?.name || '未知用户'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(activity.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
              {activity.status === 'completed' ? '已完成' : 
               activity.status === 'in_progress' ? '进行中' : 
               activity.status === 'pending' ? '待处理' : '已取消'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {activity.description && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">描述</h3>
              <p className="text-muted-foreground">{activity.description}</p>
            </div>
          )}
          
          {activity.points && (
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{activity.points} 积分</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
