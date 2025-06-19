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
import SiteHeader from "@/components/site-header"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useApi } from "@/hooks/useApi"
import { directActivityApi, directUserApi, directPrApi } from "@/lib/direct-api"
import { toast } from "@/components/ui/use-toast"

export default function ActivityDetailPage() {
  const params = useParams()
  const activityId = Array.isArray(params?.activityId) ? params.activityId[0] : params?.activityId
  const { execute: fetchActivity, data: activityRes, isLoading, error } = useApi(directActivityApi.getActivityByShowId)
  const { execute: fetchUserProfile, data: userProfile, isLoading: profileLoading, error: profileError } = useApi(directUserApi.getProfile)
  const { execute: triggerAnalysis, isLoading: isAnalyzing, error: analysisError } = useApi(directPrApi.analyzePr)
  
  const [activity, setActivity] = useState<any | null>(null)
  const [userProfileData, setUserProfileData] = useState<any | null>(null)

  useEffect(() => {
    if (activityId) {
      fetchActivity(activityId).then((res: any) => {
        if (res && res.success) {
          setActivity(res.data)
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

  const handleAnalyzeClick = async () => {
    if (!activityId) return;
    toast({ title: "AI 评分", description: "正在触发 AI 评分..." });
    try {
      const res = await triggerAnalysis(activityId);
      if (res && res.message) {
        toast({ title: "AI 评分", description: res.message, variant: "default" });
        // 重新获取活动数据以显示最新评分
        fetchActivity(activityId).then((res: any) => {
          if (res && res.success) {
            setActivity(res.data);
          }
        });
      } else {
        toast({ title: "AI 评分失败", description: "未知错误", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "AI 评分失败", description: err.message || "服务器错误", variant: "destructive" });
      console.error("AI analysis error:", err);
    }
  };

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-500" />
                    AI 智能评价
                  </CardTitle>
                  <Button onClick={handleAnalyzeClick} disabled={isAnalyzing} size="sm">
                    {isAnalyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="mr-2 h-4 w-4" />
                    )}
                    {isAnalyzing ? "分析中..." : "获取 AI 评分"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{activity.ai_analysis?.overall_score?.toFixed(1) || 'N/A'}</div>
                    <div className="text-lg font-medium text-gray-700 mb-1">综合评分</div>
                    <div className="text-sm text-gray-500">基于多维度智能分析</div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="space-y-4">
                    {activity.ai_analysis?.dimensions && Object.entries(activity.ai_analysis.dimensions).map(([key, value]: [string, any]) => (
                      <ScoreItem
                        key={key}
                        label={
                          key === 'code_quality' ? '代码质量' :
                          key === 'innovation' ? '创新性' :
                          key === 'documentation_completeness' ? '文档完整性' :
                          key === 'test_coverage' ? '测试覆盖率' :
                          key === 'performance_optimization' ? '性能优化' :
                          key // fallback for unknown keys
                        }
                        value={(value / 10) * 100} // Convert 0-10 score to 0-100 for progress bar
                        score={value}
                        color={
                          key === 'code_quality' ? 'blue' :
                          key === 'innovation' ? 'green' :
                          key === 'documentation_completeness' ? 'yellow' :
                          key === 'test_coverage' ? 'purple' :
                          key === 'performance_optimization' ? 'indigo' :
                          'gray' // fallback color
                        }
                      />
                    ))}
                  </div>

                  {/* AI Comments */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">AI 评价意见</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      {activity.ai_analysis?.suggestions && activity.ai_analysis.suggestions.map((suggestion: any, index: number) => (
                        <CommentItem key={index} text={suggestion.content} warning={suggestion.type === 'suggestion' || suggestion.type === 'negative'} />
                      ))}
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
  let progressColorClass;
  switch (color) {
    case 'blue': progressColorClass = 'bg-blue-500'; break;
    case 'green': progressColorClass = 'bg-green-500'; break;
    case 'yellow': progressColorClass = 'bg-yellow-500'; break;
    case 'purple': progressColorClass = 'bg-purple-500'; break;
    case 'indigo': progressColorClass = 'bg-indigo-500'; break;
    default: progressColorClass = 'bg-gray-500';
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <Progress value={value} className="h-2 mt-1" indicatorClassName={progressColorClass} />
      </div>
      <span className="text-sm font-semibold text-gray-800">{score.toFixed(1)}/10</span>
    </div>
  )
}

function CommentItem({ text, warning = false }: { text: string; warning?: boolean }) {
  return (
    <li className={`flex items-start ${warning ? 'text-yellow-700' : 'text-blue-800'}`}>
      {warning ? <AlertCircle className="w-4 h-4 mr-2 mt-1 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />}
      <span>{text}</span>
    </li>
  )
}

function InfoItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className={color ? `text-${color}-600 font-medium` : "font-medium"}>{value}</span>
    </div>
  )
}

function TimelineItem({ label, time, color }: { label: string; time: string; color: string }) {
  let circleColorClass;
  switch (color) {
    case 'green': circleColorClass = 'bg-green-500'; break;
    case 'blue': circleColorClass = 'bg-blue-500'; break;
    case 'yellow': circleColorClass = 'bg-yellow-500'; break;
    case 'purple': circleColorClass = 'bg-purple-500'; break;
    default: circleColorClass = 'bg-gray-500';
  }

  return (
    <div className="flex items-center mb-4">
      <div className={`w-3 h-3 rounded-full ${circleColorClass} mr-3`}></div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}

function PointItem({ label, points, color }: { label: string; points: number; color: string }) {
  let textColorClass;
  switch (color) {
    case 'green': textColorClass = 'text-green-600'; break;
    case 'blue': textColorClass = 'text-blue-600'; break;
    case 'purple': textColorClass = 'text-purple-600'; break;
    case 'yellow': textColorClass = 'text-yellow-600'; break;
    default: textColorClass = 'text-gray-600';
  }

  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <span>{label}</span>
      <span className={`font-semibold ${textColorClass}`}>+{points}</span>
    </div>
  )
} 