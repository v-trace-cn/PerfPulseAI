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
  Award,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useQueryClient } from '@tanstack/react-query'
import {
  useActivityByShowId,
  usePrDetails,
  useAnalyzePr,
  useCalculatePrPoints,
  useResetActivityPoints,
  useScoringDimensions
} from "@/lib/queries"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { format, addHours } from "date-fns"

const labelMap: Record<string, string> = {
  bonus: "基础积分",
  innovation_bonus: "创新加分",
  code_quality: "代码质量",
  maintainability: "可维护性",
  security: "安全性",
  performance_optimization: "性能优化",
  observability: "可观测性",
};

export default function ActivityDetailPage() {
  const params = useParams()
  const showId = Array.isArray(params?.showId) ? params.showId[0] : params?.showId
  
  const queryClient = useQueryClient();
  const { data: activityQueryResult, isLoading, error } = useActivityByShowId(showId as string);
  const activity = activityQueryResult?.data;

  // 解析 aiAnalysis 如果它是字符串
  const parsedAiAnalysis = useMemo(() => {
    if (!activity?.aiAnalysis) return null;
    if (typeof activity.aiAnalysis === 'string') {
      try {
        return JSON.parse(activity.aiAnalysis);
      } catch (e) {
        console.error('Failed to parse aiAnalysis:', e);
        return null;
      }
    }
    return activity.aiAnalysis;
  }, [activity?.aiAnalysis]);

  const { data: userProfileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', activity?.userId],
    queryFn: () => fetch(`/api/users/${activity?.userId}`).then(res => res.json()),
    enabled: !!activity?.userId,
    staleTime: 5 * 60 * 1000,
  });

  // 调试日志已移除

  const { mutate: triggerAnalysis, isPending: isAnalyzing, error: analysisError } = useAnalyzePr()
  const { mutate: resetActivityPoints, isPending: isResettingPoints } = useResetActivityPoints()
  const { mutate: calculatePoints, isPending: isCalculatingPoints, error: calculateError } = useCalculatePrPoints()
  
  const { toast } = useToast();

  const { data: prDetails, isLoading: prLoading } = usePrDetails(String(activity?.id));
  const { data: scoringDimensions } = useScoringDimensions();

  const handleAnalyzeClick = () => {
    if (!showId) return;

    toast({
      title: "正在重置并获取 AI 评分",
      description: "正在重置当前活动积分和AI分析结果，并准备重新获取 AI 评分...",
    });

    // 先重置积分，成功后再触发分析
    resetActivityPoints(showId);
  };

  // 使用从查询获取的维度标签
  const dimensionLabels = scoringDimensions?.data || {};

  const [isCalculatingPointsManual, setIsCalculatingPointsManual] = useState(false);

  const handleCalculatePointsClick = () => {
    if (!showId || isCalculatingPointsManual) return;
    setIsCalculatingPointsManual(true);
    toast({
      title: "正在计算积分",
      description: "正在根据AI分析结果计算积分...",
    });

    calculatePoints(showId, {
      onSuccess: () => {
        setIsCalculatingPointsManual(false);
        queryClient.invalidateQueries({ queryKey: ['activity', showId] });
      },
      onError: () => {
        setIsCalculatingPointsManual(false);
      }
    });
  };

  // 添加 SSE 监听，AI 分析完成后自动计算积分
  useEffect(() => {
    if (!showId) return;
    const eventSource = new EventSource(`/api/pr/stream-analysis-updates/${showId}`);
    eventSource.onmessage = async (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === 'analyzed') {
          // 触发积分计算
          await calculatePoints(showId);
          // 刷新活动数据以显示积分明细
          queryClient.invalidateQueries({ queryKey: ['activity', showId] });
        }
      } catch {
        // ignore
      }
    };
    return () => eventSource.close();
  }, [showId, calculatePoints, queryClient]);

  if (isLoading || profileLoading) {
    return <div className="text-center p-4">加载中...</div>
  }
  if (error || profileError) {
    return <div className="text-center p-4 text-red-500">错误: {error?.message || profileError?.message}</div>
  }
  if (!activity) {
    return <div className="text-center p-4">未找到该活动</div>
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="max-w-7xl mx-auto px-6 py-8 bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          {/* Activity Header */}
          <div className="mb-8">
            <Link href="/?tab=profile" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
              <ArrowLeft className="mr-1 w-4 h-4" /> 返回个人中心
            </Link>
            <div className="flex items-center justify-between mb-4">
              {
                (() => {
                  const title = activity.title || '';
                  const match = title.match(/^(.*?)\s*#(\d+)-\s*(.*)$/);
                  if (match) {
                    const [, prefix, number, suffix] = match;
                    return (
                      <h1 className="text-3xl font-bold text-gray-900">
                        <a
                          href={activity.diffUrl?.replace(".diff", "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline">
                        {prefix} #{number}</a><br />

                        <span className="text-xl font-medium text-gray-700">{suffix}</span>
                      </h1>
                    );
                  } else {
                    return <h1 className="text-3xl font-bold text-gray-900">{title}</h1>;
                  }
                })()
              }
              <Badge variant="secondary" className={activity.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                {activity.status === "completed" ? <><CheckCircle className="w-4 h-4 mr-1" />已完成</> : activity.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {activity.user?.name || ""}
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-1" />
                +{parsedAiAnalysis?.points?.total_points ?? 0} 积分
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
                    描述
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                    <p className="text-gray-600 mb-3">{activity.description}</p>
                  </div>

                  {/* Code Changes Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">代码总数统计变更</span>
                      <div className="text-xs flex items-center space-x-2">
                        {prDetails?.additions !== undefined && prDetails?.deletions !== undefined ? (
                          <>
                            <span className="text-green-600 font-medium">+{prDetails.additions}</span>
                            <span className="text-red-600 font-medium">-{prDetails.deletions}</span>
                          </>
                        ) : parsedAiAnalysis?.additions !== undefined && parsedAiAnalysis?.deletions !== undefined ? (
                          <>
                            <span className="text-green-600 font-medium">+{parsedAiAnalysis.additions}</span>
                            <span className="text-red-600 font-medium">-{parsedAiAnalysis.deletions}</span>
                          </>
                        ) : (
                          <span className="text-blue-600">N/A</span>
                        )}
                      </div>
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
                  <Button
                    onClick={handleAnalyzeClick}
                    disabled={isAnalyzing || activity?.status === 'analyzing'}
                    size="sm"
                  >
                    {(isAnalyzing || activity?.status === 'analyzing') ? (
                      "分析中"
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        {parsedAiAnalysis && typeof parsedAiAnalysis.overall_score === 'number' && parsedAiAnalysis.overall_score > 0 ? "重新 AI 评分" : "获取 AI 评分"}
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* —— 综合分数 —— */}
                  <div className="text-center mb-6">
                    <h3 className="text-5xl font-bold text-gray-900 mb-2">
                      {Math.round(parseFloat(parsedAiAnalysis?.overall_score || 0))}
                    </h3>
                    {parsedAiAnalysis?.summary && (
                      <div className="mt-4 text-center text-gray-700">
                        <p className="text-sm font-semibold mb-1">综合评价:</p>
                        <p className="text-base">{parsedAiAnalysis.summary}</p>
                      </div>
                    )}
                  </div>

                  {/* —— 维度评分 + 建议 —— */}
                  {(() => {
                    if (!parsedAiAnalysis?.dimensions) return null;

                    const dimLabel = (k: string) => (
                      k === 'code_quality' ? '代码质量' :
                      k === 'maintainability' ? '可维护性' :
                      k === 'security' ? '安全性' :
                      k === 'performance_optimization' ? '性能优化' :
                      k === 'innovation' ? '创新性' :
                      k === 'observability' ? '可观测性' :
                      k === 'documentation_completeness' ? '文档完整性' :
                      k === 'test_coverage' ? '测试覆盖率' :
                      k === 'ci_cd_quality' ? 'CI/CD 自动化质量' : k
                    );

                    // 将建议按维度归类
                    const suggestionMap: Record<string, any[]> = {};
                    if (parsedAiAnalysis.suggestions) {
                      parsedAiAnalysis.suggestions.forEach((s: any) => {
                        const dim = s.dimension || s["主要维度"] || s["维度"] || '其他';
                        if (!suggestionMap[dim]) suggestionMap[dim] = [];
                        suggestionMap[dim].push(s);
                      });
                    }

                    return (
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(parsedAiAnalysis.dimensions)
                          .filter(([key]) => key !== 'innovation')
                          .map(([key, dim]: any) => {
                          const score = parseFloat(dim.score || 0);
                          const suggestions = suggestionMap[dimLabel(key)] || suggestionMap[key] || [];
                          const sortedSug = [...suggestions].sort((a: any, b: any) => {
                            const weight = (s: any) => {
                              const t = (s.type || s["类型"] || "positive").toLowerCase();
                              if (t === 'negative' || t === '建议') return 0;
                              if (t === 'question') return 1;
                              return 2;
                            };
                            return weight(a) - weight(b);
                          });
                          const actionableCnt = sortedSug.filter((s: any) => {
                            const t = (s.type || s["类型"] || "positive").toLowerCase();
                            return t === 'negative' || t === 'question' || t === '建议';
                          }).length;

                          // 颜色
                          const color = (
                            key === 'code_quality' ? 'purple' :
                            key === 'maintainability' ? 'gray' :
                            key === 'security' ? 'red' :
                            key === 'performance_optimization' ? 'sky' :
                            key === 'innovation' ? 'green' :
                            key === 'observability' ? 'gray' :
                            key === 'documentation_completeness' ? 'amber' :
                            key === 'test_coverage' ? 'blue' :
                            key === 'ci_cd_quality' ? 'indigo' : 'gray');

                          const getColorClass = (baseColor: string) => {
                            switch (baseColor) {
                              case 'blue': return 'bg-blue-500';
                              case 'green': return 'bg-green-500';
                              case 'yellow': return 'bg-yellow-500';
                              case 'purple': return 'bg-purple-500';
                              case 'indigo': return 'bg-indigo-500';
                              case 'amber': return 'bg-amber-500';
                              case 'sky': return 'bg-sky-500';
                              case 'red': return 'bg-red-500';
                              case 'gray': return 'bg-gray-500';
                              default: return 'bg-gray-500';
                            }
                          };

                          const getTextColorClass = (baseColor: string) => {
                            switch (baseColor) {
                              case 'blue': return 'text-blue-500';
                              case 'green': return 'text-green-500';
                              case 'yellow': return 'text-yellow-500';
                              case 'purple': return 'text-purple-500';
                              case 'indigo': return 'text-indigo-500';
                              case 'amber': return 'text-amber-500';
                              case 'sky': return 'text-sky-500';
                              case 'red': return 'text-red-500';
                              case 'gray': return 'text-gray-500';
                              default: return 'text-gray-500';
                            }
                          };

                          return (
                            <AccordionItem key={key} value={key}>
                              <AccordionTrigger className="flex justify-between items-center w-full">
                                <div className="flex items-center space-x-4">
                                  <div className={`w-3 h-3 rounded-full ${getColorClass(color)}`}></div>
                                  <span className="text-sm font-medium text-gray-700 w-20 text-left">{dimLabel(key)}</span>
                                  <div className="w-28"><Progress value={score * 10} className="h-2 bg-gray-200" indicatorClassName={getColorClass(color)} /></div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-sm font-semibold ${getTextColorClass(color)}`}>{Number.isFinite(score) ? score : 'N/A'}/10</span>
                                  <span className="text-xs text-gray-500">{actionableCnt}/{sortedSug.length}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                {sortedSug.length ? (
                                  <ul className="space-y-2 text-sm text-blue-800">
                                    {sortedSug.map((s: any, idx: number) => {
                                      const text = s.content || s.detail || s["详细内容"] || s["detail"] || s["简要标题"] || s.brief_title || s.title;
                                      if (!text) return null;
                                      const filePath = s.file_path || s.path || s["file_path"] || s["文件路径"];
                                      const t = (s.type || s["类型"] || "positive").toLowerCase();
                                      const warning = t === 'negative' || t === 'question' || t === '建议';
                                      return <CommentItem key={idx} text={text} warning={warning} filePath={filePath} />;
                                    })}
                                  </ul>
                                ) : <p className="text-xs text-gray-500">暂无建议</p>}
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contributor Info */}
              <Link href="/?tab=profile">
                <Card className="cursor-pointer hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">贡献者信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={userProfileData?.avatar || "/placeholder-logo.png"} alt={userProfileData?.name || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">{userProfileData?.name?.charAt(0) || ``}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">{userProfileData?.name || ""}</div>
                        <div className="text-sm text-gray-500">{userProfileData?.position || ""}</div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-3 text-sm">
                      {profileLoading ? (
                        <p className="text-gray-500">加载中...</p>
                      ) : (
                        <>
                          <InfoItem label="本次积分" value={`${parsedAiAnalysis?.points?.total_points ?? 0} 分`} color='purple' />
                          <InfoItem label="累计积分" value={`${userProfileData?.total_points ?? 0} 分`} color="blue" />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">活动时间线</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const items: any[] = [];
                    if (activity.pointsCalculatedAt) items.push({ label: '积分计算完成', time: activity.pointsCalculatedAt, color: 'blue' });
                    if (activity.aiAnalysisCompletedAt) items.push({ label: 'AI 评价完成', time: activity.aiAnalysisCompletedAt, color: 'blue' });
                    if (activity.aiAnalysisStartedAt) items.push({ label: 'AI 评价开始', time: activity.aiAnalysisStartedAt, color: 'yellow' });

                    if (prDetails?.events) {
                      prDetails.events.forEach((ev: any) => {
                        let label = ev.event_type;
                        let color = 'gray';
                        switch (ev.event_type) {
                          case 'opened': label = '提交 PR'; color = 'purple'; break;
                          case 'review_passed': label = '代码审查通过'; color = 'yellow'; break;
                          case 'merged': label = 'PR 已合并'; color = 'green'; break;
                          case 'ai_evaluation_started': label = 'AI 评价开始'; color = 'yellow'; break;
                          case 'ai_evaluation': label = 'AI 评价完成'; color = 'blue'; break;
                          default:
                            // 保持原样
                            break;
                        }
                        items.push({ label, time: ev.event_time, color });
                      });
                    }

                    // 排序时间升序
                    items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

                    return items.map((it, idx) => (
                      <TimelineItem
                        key={idx}
                        label={it.label}
                        time={format(addHours(new Date(it.time), 8), 'yyyy-MM-dd HH:mm:ss')}
                        color={it.color}
                      />
                    ));
                  })()}
                </CardContent>
              </Card>

              {/* 积分明细 */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">积分明细</CardTitle>
                </CardHeader>
                <CardContent>
                  {parsedAiAnalysis?.points?.detailed_points ? (
                    Array.isArray(parsedAiAnalysis.points.detailed_points) ? (
                      parsedAiAnalysis.points.detailed_points.map((item: any, idx: number) => {
                        const pts = item.bonus ?? item.innovation_bonus ?? 0;
                        const label = item.text ?? (item.bonus !== undefined ? labelMap.bonus : labelMap.innovation_bonus);
                        return <PointItem key={idx} label={label} points={pts} color="blue" />;
                      })
                    ) : (
                      Object.entries(parsedAiAnalysis.points.detailed_points)
                        .filter(([dim]) => dim !== 'innovation')
                        .map(([dim, pts]) => (
                          <PointItem key={dim} label={labelMap[dim] || dim} points={pts as number} color="blue" />
                        ))
                    )
                  ) : (
                    <p className="text-gray-500">暂无积分明细</p>
                  )}
                  {parsedAiAnalysis?.points?.total_points > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center font-semibold">
                        <span>总计</span>
                        <span className="text-blue-600">+{parsedAiAnalysis.points.total_points}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ----------------- 辅助子组件 ----------------- */

function ScoreItem({ label, value, score, color }: { label: string; value: number; score: number; color: string }) {
  const getColorClass = (baseColor: string) => {
    switch (baseColor) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'purple': return 'bg-purple-500';
      case 'indigo': return 'bg-indigo-500';
      case 'amber': return 'bg-amber-500';
      case 'sky': return 'bg-sky-500';
      case 'red': return 'bg-red-500';
      case 'gray': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreTextColorClass = (score: number) => {
    if (score >= 80) {
      return 'text-green-600';
    } else if (score >= 50) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="flex items-center space-x-2">
        <div className={`text-sm font-semibold ${getScoreTextColorClass(score)}`}>
          {Number.isFinite(score) ? Math.round(score / 10) : 'N/A'}/10
        </div>
        <div className="w-24">
          <Progress value={value} className={`h-2 ${getColorClass(color)}`} />
        </div>
      </div>
    </div>
  );
}

function CommentItem({ text, warning = false, filePath }: { text: string; warning?: boolean; filePath?: string }) {
  return (
    <li className={`flex items-start ${warning ? 'text-yellow-700' : 'text-blue-800'}`}>
      {warning ? <AlertCircle className="w-4 h-4 mr-2 mt-1 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />}
      <div>
        <span>{text}</span>
        {filePath && <span className="ml-2 text-xs text-gray-500">({filePath})</span>}
      </div>
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
    case 'orange': textColorClass = 'text-orange-600'; break;
    case 'red': textColorClass = 'text-red-600'; break;
    case 'gray': textColorClass = 'text-gray-600'; break;
    default: textColorClass = 'text-gray-600';
  }

  return (
    <div className="flex justify-between items-center text-sm mb-2">
      <span>{label}</span>
      <span className={`font-semibold ${textColorClass}`}>+{Number.isInteger(points) ? points : points.toFixed(1)}</span>
    </div>
  )
}
