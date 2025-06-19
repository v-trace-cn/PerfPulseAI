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
} from "lucide-react"
import SiteHeader from "@/components/site-header"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useApi } from "@/hooks/useApi"
import { directActivityApi, directUserApi } from "@/lib/direct-api"

export default function ActivityDetailPage() {
  const params = useParams()
  const activityId = Array.isArray(params?.activityId) ? params.activityId[0] : params?.activityId
  const { execute: fetchActivity, data: activityRes, isLoading, error } = useApi(directActivityApi.getActivityByShowId)
  const { execute: fetchUserProfile, data: userProfile, isLoading: profileLoading, error: profileError } = useApi(directUserApi.getProfile)
  const [activity, setActivity] = useState<any | null>(null)
  const [userProfileData, setUserProfileData] = useState<any | null>(null)

  useEffect(() => {
    if (activityId) {
      fetchActivity(activityId).then((res: any) => {
        if (res && res.success) {
          setActivity(res.data)
        } else {
          console.error("Fetch activity failed", res)
        }
      }).catch((err) => console.error("Error fetching activity", err))
    }
  }, [activityId, fetchActivity])

  useEffect(() => {
    if (activity?.user_id) {
      fetchUserProfile(String(activity.user_id))
        .then((prof: any) => {
          setUserProfileData(prof)
        })
        .catch((err) => console.error("Error fetching user profile", err))
    }
  }, [activity, fetchUserProfile])

  if (isLoading) {
    return <div className="text-center p-4">加载中...</div>
  }
  if (error) {
    return <div className="text-center p-4 text-red-500">错误: {error}</div>
  }
  if (!activity) {
    return <div className="text-center p-4">未找到该活动</div>
  }

  return (
    <>
      <SiteHeader onLoginClick={() => {}} onRegisterClick={() => {}} onHelpClick={() => {}} onSettingsClick={() => {}} />
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="max-w-7xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          {/* Activity Header */}
          <div className="mb-8">
            <Link href="/?tab=profile" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
              <ArrowLeft className="mr-1 w-4 h-4" /> 返回个人中心
            </Link>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">活动详情: {activity.title}</h1>
              <Badge variant="secondary" className={activity.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {activity.status === "completed" ? <><CheckCircle className="w-4 h-4 mr-1" />已完成</> : activity.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(activity.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {activity.user?.name || ""}
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-1" />
                +{activity.points} 积分
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* GitHub PR Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GitPullRequest className="w-5 h-5 mr-2 text-blue-600" />
                    活动描述
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                    <p className="text-gray-600 mb-3">{activity.description}</p>
                  </div>

                  {/* Code Changes Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">代码总数统计变更</span>
                      <span className="text-xs text-green-700">+156 -12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Evaluation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    AI 智能评价
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">8.7</div>
                    <div className="text-lg font-medium text-gray-700 mb-1">综合评分</div>
                    <div className="text-sm text-gray-500">基于多维度智能分析</div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="space-y-4">
                    <ScoreItem label="代码质量" value={92} score={9.2} color="blue" />
                    <ScoreItem label="创新性" value={85} score={8.5} color="green" />
                    <ScoreItem label="文档完整性" value={78} score={7.8} color="yellow" />
                    <ScoreItem label="测试覆盖率" value={88} score={8.8} color="purple" />
                    <ScoreItem label="性能优化" value={82} score={8.2} color="indigo" />
                  </div>

                  {/* AI Comments */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">AI 评价意见</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <CommentItem text="代码结构清晰，遵循了良好的编程规范" />
                      <CommentItem text="机器学习模型集成方案具有创新性" />
                      <CommentItem text="建议增加更多边界情况的测试用例" warning />
                      <CommentItem text="性能优化效果显著，响应时间提升35%" />
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contributor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">贡献者信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={userProfileData?.avatar || "/placeholder.svg"} alt={userProfileData?.name || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">{userProfileData?.name?.charAt(0) || ``}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{userProfileData?.name || ""}</div>
                      <div className="text-sm text-gray-500">{userProfileData?.position || ""}</div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3 text-sm">
                    <InfoItem label="已完成任务" value={`${userProfileData?.completedTasks ?? 0} 次`} />
                    <InfoItem label="累计积分" value={`${userProfileData?.points ?? 0} 分`} color="blue" />
                    <InfoItem label="等级" value={`Lv.${userProfileData?.level ?? 1}`} color="green" />
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">活动时间线</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimelineItem label="PR 已合并" time="16:28" color="green" />
                  <TimelineItem label="AI 评价完成" time="16:15" color="blue" />
                  <TimelineItem label="代码审查通过" time="15:42" color="yellow" />
                  <TimelineItem label="提交 PR" time="14:30" color="purple" />
                </CardContent>
              </Card>

              {/* Points Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">积分明细</CardTitle>
                </CardHeader>
                <CardContent>
                  <PointItem label="代码质量" points={10} color="green" />
                  <PointItem label="创新加分" points={8} color="blue" />
                  <PointItem label="测试完整性" points={5} color="purple" />
                  <PointItem label="及时完成" points={2} color="yellow" />
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-semibold">
                    <span>总计</span>
                    <span className="text-blue-600">+{activity.points}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ----------------- 辅助子组件 ----------------- */

function ScoreItem({ label, value, score, color }: { label: string; value: number; score: number; color: string }) {
  const colorMap: any = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600",
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center space-x-2">
        <Progress value={value} className="w-24 h-2" />
        <span className={`text-sm font-semibold ${colorMap[color]}`}>{score}</span>
      </div>
    </div>
  )
}

function CommentItem({ text, warning = false }: { text: string; warning?: boolean }) {
  return (
    <li className="flex items-start">
      {warning ? (
        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-yellow-600" />
      ) : (
        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600" />
      )}
      {text}
    </li>
  )
}

function InfoItem({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClass = color ? `text-${color}-600` : ""
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  )
}

function TimelineItem({ label, time, color }: { label: string; time: string; color: string }) {
  const bgColor = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
  }[color]
  return (
    <div className="flex items-start space-x-3 mb-4 last:mb-0">
      <div className={`w-2 h-2 ${bgColor} rounded-full mt-2`}></div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>
    </div>
  )
}

function PointItem({ label, points, color }: { label: string; points: number; color: string }) {
  const colorClass = {
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    yellow: "text-yellow-600",
  }[color]
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${colorClass}`}>+{points}</span>
    </div>
  )
} 