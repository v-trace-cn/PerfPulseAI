"use client"

import * as React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentActivities } from "@/components/recent-activities"
import { ScoringSystem } from "@/components/scoring-system"
import {
  Award,
  Gauge,
  Shield,
  Pencil,
  Trophy,
  Mail,
  Phone,
  CheckCircle2,
  GitPullRequest,
  Activity,
  Eye,
  EyeOff,
  Plus,
  Search,
  Github,
  Building2,
  Building,
  Calendar,
  Camera,
  BarChart3 as ChartBar,
  User as UserIcon,
  Cpu,
  Code,
  Coins,
  ShoppingCart,
  History,
  TrendingUp,
  Gift,
  Star,
  ArrowUp,
  ArrowDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Sparkles,
  ThumbsUp,
  Heart
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { cn, getRelativeDate } from "@/lib/utils"
import { unifiedApi } from "@/lib/unified-api"
import { User } from "@/lib/types"
import { GovernanceCard, WeeklyGoalsCard, PointsCard, ComplianceCard } from "@/components/ui/metric-card"
import { useToast } from "@/components/ui/use-toast"
import { useApi } from "@/hooks/useApi"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Tabs as PointsTabs, TabsContent as PointsTabsContent, TabsList as PointsTabsList, TabsTrigger as PointsTabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

// 积分相关类型定义
interface PointTransaction {
  id: string;
  userId: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
  canDispute: boolean;
  disputeTimeLeft: number;
}

interface UserPointsSummary {
  userId: number;
  currentBalance: number;
  totalTransactions: number;
  totalEarned: number;
  totalSpent: number;
  lastTransactionDate?: string;
  currentLevel?: {
    id: number;
    level: number;
    name: string;
    minPoints: number;
    maxPoints?: number;
    benefits?: string;
    icon?: string;
    color?: string;
  };
  nextLevel?: {
    id: number;
    level: number;
    name: string;
    minPoints: number;
    maxPoints?: number;
    benefits?: string;
    icon?: string;
    color?: string;
  };
  pointsToNext?: number;
  progressPercentage: number;
}


// 添加自定义动画
const fadeInAnimation = `@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`

const fadeInSlideUpAnimation = `@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}`

const pulseAnimation = `@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}`

// 添加全局样式
const globalStyles = `
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-fadeInSlideUp {
    animation: fadeInSlideUp 0.6s ease-out forwards;
  }
  
  .animate-pulse-subtle {
    animation: pulse 3s infinite;
  }
  
  .card-transition-delay-1 {
    animation-delay: 0.1s;
  }
  
  .card-transition-delay-2 {
    animation-delay: 0.2s;
  }
  
  .card-transition-delay-3 {
    animation-delay: 0.3s;
  }
  
  .card-transition-delay-4 {
    animation-delay: 0.4s;
  }

  .data-pill {
    display: inline-flex;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    line-height: 1rem;
    align-items: center;
    justify-content: center;
  }

  .toggle {
    --width: 32px;
    --height: calc(var(--width) / 2);
    --radius: var(--height);
    --handle-bg: #fff;
    --handle-offset: 2px;
    --bg: theme(colors.primary.DEFAULT);
    --bg-empty: theme(colors.muted.DEFAULT);
    --transition: 0.2s ease;
    
    position: relative;
    display: inline-block;
    width: var(--width);
    height: var(--height);
    cursor: pointer;
    
    &:after {
      content: '';
      position: absolute;
      top: var(--handle-offset);
      left: var(--handle-offset);
      width: calc(var(--height) - (var(--handle-offset) * 2));
      height: calc(var(--height) - (var(--handle-offset) * 2));
      border-radius: 50%;
      background: var(--handle-bg);
      transition: left var(--transition);
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    }
    
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: var(--radius);
      background: var(--bg-empty);
      transition: background var(--transition);
    }
    
    &:checked {
      &:before {
        background: var(--bg);
      }
      
      &:after {
        left: calc(100% - var(--height) + var(--handle-offset) + 2px);
      }
    }
  }

  .select {
    appearance: none;
    background-color: transparent;
    border: 1px solid theme(colors.muted.DEFAULT);
    border-radius: theme(borderRadius.md);
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: theme(colors.foreground.DEFAULT);
    transition: border-color 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: theme(colors.primary.DEFAULT);
      box-shadow: 0 0 0 2px rgba(theme(colors.primary.DEFAULT), 0.2);
    }
    
    &[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .select-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
`



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient(); // 初始化 queryClient

  // 获取积分摘要数据
  const { data: pointsSummary, isLoading: pointsSummaryLoading } = useQuery<UserPointsSummary>({
    queryKey: ['points-summary', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/points/summary?userId=${user?.id}`, {
        headers: {
          'X-User-Id': user?.id?.toString() || '',
        }
      })
      if (!response.ok) throw new Error('Failed to fetch points summary')
      return response.json()
    },
    staleTime: 30000, // 30秒缓存
    enabled: !!user?.id, // 只有在用户登录且有ID时才执行
  })

  // 获取积分交易记录（最近5条）
  const { data: pointsTransactions, isLoading: pointsTransactionsLoading, error: pointsTransactionsError } = useQuery<{
    transactions: PointTransaction[];
    totalCount: number;
  }>({
    queryKey: ['points-transactions-recent', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/points/transactions?page=1&page_size=5`, {
        headers: {
          'X-User-Id': user?.id?.toString() || '',
        }
      })
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch points transactions: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    staleTime: 10000, // 10秒缓存
    enabled: !!user?.id, // 只有在用户登录且有ID时才执行
  })

  // 获取月度积分统计
  const { data: monthlyStats, isLoading: monthlyStatsLoading } = useQuery<{
    userId: number;
    monthlyTransactions: number;
    monthlyEarned: number;
    monthlySpent: number;
    monthStart: string;
  }>({
    queryKey: ['points-monthly-stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/points/monthly-stats`, {
        headers: {
          'X-User-Id': user?.id?.toString() || '',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch monthly stats')
      }
      return response.json()
    },
    staleTime: 60000, // 1分钟缓存
    enabled: !!user?.id, // 只有在用户登录且有ID时才执行
  })

  // 获取兑换统计
  const { data: redemptionStats, isLoading: redemptionStatsLoading } = useQuery<{
    userId: number;
    totalRedemptions: number;
    totalPointsSpent: number;
    monthlyRedemptions: number;
    monthlyPointsSpent: number;
    monthStart: string;
  }>({
    queryKey: ['points-redemption-stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/points/redemption-stats`, {
        headers: {
          'X-User-Id': user?.id?.toString() || '',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch redemption stats')
      }
      return response.json()
    },
    staleTime: 60000, // 1分钟缓存
    enabled: !!user?.id, // 只有在用户登录且有ID时才执行
  })

  // 获取周度积分统计
  const { data: weeklyStats, isLoading: weeklyStatsLoading } = useQuery<{
    userId: number;
    weeklyTransactions: number;
    weeklyEarned: number;
    weeklySpent: number;
    weekStart: string;
  }>({
    queryKey: ['points-weekly-stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/points/weekly-stats`, {
        headers: {
          'X-User-Id': user?.id?.toString() || '',
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch weekly stats')
      }
      return response.json()
    },
    staleTime: 60000, // 1分钟缓存
    enabled: !!user?.id, // 只有在用户登录且有ID时才执行
  })

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userData, setUserData] = useState<any>({
    name: "",
    email: "",
    position: "",
    phone: "",
    githubUrl: "",
    departmentId: null,
    avatar: "/placeholder-user.jpg",
    total_points: 0, // 初始化总积分
    level: 1,
    achievements: [],
    companyId: null,
    companyName: "",
  })

  const [showPhone, setShowPhone] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [viewColleagueOpen, setViewColleagueOpen] = useState(false)
  const [selectedColleague, setSelectedColleague] = useState<User | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)

  // 使用 useQuery 获取部门列表 - 只有在用户有公司ID时才执行
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments", user?.companyId],
    queryFn: async () => {
      const res = await unifiedApi.department.getAll(user?.id?.toString());
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!user?.companyId && !!user?.id,
  });
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  // Activity API for fetching recent personal activities
  const { execute: fetchRecentActivities } = useApi(unifiedApi.activity.getRecentActivities);

  const handleEditProfile = () => {
    // 在打开编辑对话框时，设置当前用户的组织
    const currentDepartment = departments.find(d => d.name === userData.department);
    setSelectedDepartment(currentDepartment?.id.toString());
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // 只有当手机号不为空时才进行验证
    if (userData.phone && !isValidPhone(userData.phone)) {
      toast({
        title: "错误",
        description: "请输入有效的11位手机号码。",
        variant: "destructive",
      })
      return
    }
    
    try {
      const updatedInfo = {
        name: userData.name,
        phone: userData.phone,
        githubUrl: userData.githubUrl,
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined, // 使用状态中的组织ID
      };

      if (user && user.id) {
        const result = await unifiedApi.user.updateUserInfo(user.id, updatedInfo);

        if (result.success) {
          toast({
            title: "成功",
            description: "个人资料已更新。",
            variant: "default",
          })
          setEditProfileOpen(false)
          await refreshUser();
          // 如果有其他地方也使用 React Query 查询用户数据，需要使其失效
          queryClient.invalidateQueries({ queryKey: ["user", user.id] });
        } else {
          toast({
            title: "更新失败",
            description: result.message || "更新个人资料时出错。",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后再试。",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    // 检查 URL 参数是否包含 tab=profile
    const tab = searchParams.get("tab")
    if (tab === "profile") {
      setActiveTab("profile")
    }
  }, [searchParams])

  // 当获取到最新 user 时，同步基本信息
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        department: user.department || "",
        position: user.position || "",
        email: user.email || "",
        phone: user.phone || "",
        githubUrl: user.githubUrl || "",
        joinDate: user.joinDate || "",
        points: user.total_points ?? user.points ?? 0,
        level: user.level ?? 0,
        avatar: user.avatar || "/placeholder-logo.png",
        skills: user.skills || [],
        achievements: userData.achievements,
        recentActivities: userData.recentActivities,
        companyId: user.companyId,
        companyName: user.companyName,
      });

    }
  }, [user]);

  // Fetch recent personal activities when user changes
  useEffect(() => {
    if (user?.id) {
      fetchRecentActivities(user.id, 1, 5)
        .then((response: any) => {
          if (response && response.success && response.data && response.data.activities) {
            const formattedActivities = response.data.activities.map((act: any) => ({
              id: act.id,
              show_id: act.showId || act.show_id,
              type: act.status,
              title: act.title,
              date: getRelativeDate(act.createdAt || act.created_at),
              points: act.points,
            }));
            setUserData((prev: any) => ({ ...prev, recentActivities: formattedActivities }));
          } else {
          }
        })
        .catch(() => {
          // 静默处理错误，避免控制台日志
        });
    }
  }, [user, fetchRecentActivities]);



  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // 手机号验证函数
  const isValidPhone = (phone: string) => {
    // 简单的中国手机号验证（11位数字，1开头）
    // return true; // 暂时跳过手机号验证，用于调试
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && user?.id) {
      const file = files[0]
      try {
        const result = await unifiedApi.user.uploadAvatar(String(user.id), file)
        if (result.success && result.data.avatar) {
          setUserData((prev: any) => ({ ...prev, avatar: result.data.avatar }))
          toast({
            title: "头像上传成功",
            description: "您的头像已更新。",
            variant: "default",
          })
        } else {
          toast({
            title: "头像上传失败",
            description: result.message || "请稍后再试。",
            variant: "destructive",
          })
        }
      } catch (error) {
        // 静默处理错误
        toast({
          title: "上传错误",
          description: "上传头像时发生错误，请重试。",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoadingDepartments) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  // 组件渲染
  return (
    <div className="h-full px-4 pt-0 pb-6 lg:px-8 lg:pb-10">
      <style>{globalStyles}</style>

      <div className="flex items-center justify-between space-y-2 mb-6">
        <div className="flex items-center space-x-2 group">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full transition-all duration-500 group-hover:h-10 group-hover:bg-gradient-to-b group-hover:from-accent group-hover:to-primary"></div>
          <h2 className="text-lg font-semibold cyber-text relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-accent after:transition-all after:duration-500 group-hover:after:w-full">
            工作台
          </h2>
        </div>

        <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab} className="flex-1 ml-8">
          <TabsList className="flex justify-center bg-muted/10 backdrop-blur-sm rounded-full border border-primary/5 p-1 shadow-inner">
            <TabsTrigger
              value="overview"
              className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
            >
              <Gauge className="mr-2 h-4 w-4" />
              <span>智能概览</span>
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
            >
              <Award className="mr-2 h-4 w-4" />
              <span>积分系统</span>
            </TabsTrigger>
            <TabsTrigger
              value="scoring"
              className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
            >
              <ChartBar className="mr-2 h-4 w-4" />
              <span>治理机制</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <span>个人中心</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="space-y-8 max-w-7xl mx-auto flex-grow w-full pb-16">

        {activeTab === "overview" && (
          <section className="space-y-8 pt-4 animate-fadeIn transition-opacity duration-300">
            <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto px-2">
              <GovernanceCard value={89.5} trend="+2.5%" />
              <WeeklyGoalsCard value={145} trend="+24" />
              <PointsCard points={userData?.points || 0} />
              <ComplianceCard percentage={98.2} trend="+1.2%" />
            </div>
            <div className={cn("grid gap-8 md:gap-8 lg:grid-cols-7 px-2 mb-8 pb-8")}>
              <Card className="col-span-4 tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp">
                <CardHeader>
                  <CardTitle>多维度治理分析</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-3 tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp">
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivities />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {activeTab === "rewards" && (
          <section className="animate-fadeIn transition-opacity duration-300 p-4">
            <div className="bg-card rounded-xl border border-border shadow-lg p-6">
              <DashboardPointsOverview
                pointsSummary={pointsSummary}
                pointsSummaryLoading={pointsSummaryLoading}
                pointsTransactions={pointsTransactions}
                pointsTransactionsLoading={pointsTransactionsLoading}
                pointsTransactionsError={pointsTransactionsError}
                monthlyStats={monthlyStats}
                monthlyStatsLoading={monthlyStatsLoading}
                weeklyStats={weeklyStats}
                weeklyStatsLoading={weeklyStatsLoading}
                redemptionStats={redemptionStats}
                redemptionStatsLoading={redemptionStatsLoading}
              />
            </div>
          </section>
        )}

        {activeTab === "scoring" && (
          <section className="animate-fadeIn transition-opacity duration-300 p-2 md:p-3 lg:p-4">
            <div className="bg-card rounded-xl border border-border shadow-lg p-4 md:p-5 lg:p-6 w-full max-w-[1400px] mx-auto">
              <ScoringSystem />
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 pt-4 animate-fadeIn transition-opacity duration-300 max-w-7xl mx-auto px-2">
            <div className="grid gap-8 md:grid-cols-3 mb-8">
              {/* 个人信息卡片 */}
              <Card className="tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp md:col-span-1">
                <CardHeader className="flex flex-col items-center text-center pb-2 bg-gradient-to-r from-primary/10 to-transparent rounded-t-xl overflow-hidden">
                  <div className="relative mb-2">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={userData.avatar} alt={userData.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {userData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                      <Cpu className="h-4 w-4" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">{userData.name}</CardTitle>
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                      {userData.department} · {userData.position}
                    </Badge>
                    <p className="text-sm text-muted-foreground">加入时间: {userData.joinDate}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">联系方式</h4>
                      </div>
                      <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{userData.email}</span>
                      </div>
                      <div className="grid grid-cols-[20px_1fr_auto] gap-2 items-center">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm transition-all duration-300">
                          {showPhone ? (
                            <span className="text-foreground font-medium">{userData.phone}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              {userData.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => setShowPhone(!showPhone)}
                          className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        >
                          {showPhone ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>隐藏手机号</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>显示手机号</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* 公司信息 */}
                    {userData.companyName && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">公司</h4>
                        <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{userData.companyName}</span>
                        </div>
                      </div>
                    )}

                    {userData.companyName && <Separator />}

                    {/* GitHub 账号 */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">GitHub 地址</h4>
                      <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                        <Code className="h-4 w-4 text-muted-foreground" />
                        {userData.githubUrl ? (
                          <a
                            href={userData.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {userData.githubUrl}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {userData.githubUrl}
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">积分等级</h4>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <div className="text-lg font-bold">{userData.points}</div>
                        <Badge className="ml-auto bg-primary/10 text-primary">{mounted ? `Lv.${userData.level}` : null}</Badge>
                      </div>
                      <Progress
                        value={(userData.points / 2000) * 100}
                        className="h-2 bg-muted/50"
                        indicatorClassName="progress-indicator"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        距离下一级别还需 <span className="text-primary">{2000 - userData.points}</span> 积分
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">专业技能</h4>
                      <div className="flex flex-wrap gap-2">
                        {(userData.skills as string[] || []).map((skill: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-muted/30 pr-1 pl-2 flex items-center gap-1 group"
                          >
                            {skill}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setUserData({
                                  ...userData,
                                  skills: (userData.skills as string[]).filter((_, i) => i !== index),
                                })
                              }}
                              className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-x"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            </button>
                          </Badge>
                        ))}
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            const newSkill = prompt("请输入要添加的技能")
                            if (newSkill && newSkill.trim() !== "") {
                              setUserData({
                                ...userData,
                                skills: [...userData.skills, newSkill.trim()],
                              })
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-primary to-accent border-0"
                      onClick={handleEditProfile}
                    >
                      编辑个人资料
                    </Button>

                    <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>编辑个人资料</DialogTitle>
                          <DialogDescription>
                            更新您的个人信息和偏好设置
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveProfile}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-name" className="text-right">
                                姓名
                              </Label>
                              <Input
                                id="edit-name"
                                name="edit-name"
                                value={userData.name}
                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-department" className="text-right">
                                组织
                              </Label>
                              <Select
                                key={`dept-select-${isLoadingDepartments}-${departments.length}`}
                                value={selectedDepartment}
                                onValueChange={setSelectedDepartment}
                                disabled={!user?.companyId}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder={user?.companyId ? "选择组织" : "请先加入公司"} />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {!user?.companyId ? (
                                    <SelectItem value="no-company" disabled>请先加入公司</SelectItem>
                                  ) : isLoadingDepartments ? (
                                    <SelectItem value="loading" disabled>加载中...</SelectItem>
                                  ) : departments.length === 0 ? (
                                    <SelectItem value="no-orgs" disabled>暂无组织</SelectItem>
                                  ) : (
                                    departments.map((dept) => (
                                      <SelectItem key={dept.id} value={String(dept.id)}>
                                        {dept.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-position" className="text-right">
                                职位
                              </Label>
                              <Input
                                id="edit-position"
                                name="edit-position"
                                value={userData.position}
                                onChange={(e) => setUserData({ ...userData, position: e.target.value })}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-email" className="text-right">
                                邮箱
                              </Label>
                              <Input
                                id="edit-email"
                                name="edit-email"
                                type="email"
                                value={userData.email}
                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                className="col-span-3"
                                disabled
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-phone" className="text-right">
                                手机
                              </Label>
                              <Input
                                id="edit-phone"
                                name="edit-phone"
                                type="tel"
                                value={userData.phone}
                                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-github" className="text-right">
                                GitHub 地址
                              </Label>
                              <Input
                                id="edit-github"
                                name="edit-github"
                                value={userData.githubUrl}
                                onChange={(e) => setUserData({ ...userData, githubUrl: e.target.value })}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">保存更改</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* 成就和活动卡片 */}
              <Card className="tech-card shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp md:col-span-2 pb-6">
                <CardHeader>
                  <CardTitle>个人成就与活动</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="activities" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/30 backdrop-blur-sm rounded-lg shadow-sm">
                      <TabsTrigger
                        value="achievements"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
                      >
                        <Trophy className="mr-2 h-3.5 w-3.5" />
                        <span>成就徽章</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="activities"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
                      >
                        <Activity className="mr-2 h-3.5 w-3.5" />
                        <span>最近个人活动</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="achievements" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(userData.achievements || []).map((achievement: any) => (
                          <Card key={achievement.id} className="tech-card overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-md font-medium">{achievement.title}</CardTitle>
                              <div className="text-2xl">{achievement.icon}</div>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <p className="text-sm text-muted-foreground">{achievement.date}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="activities" className="space-y-4">
                      <RecentActivities />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      {/* 查看同事资料对话框 */}
      <Dialog open={viewColleagueOpen} onOpenChange={setViewColleagueOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>同事资料</DialogTitle>
            <DialogDescription>查看团队成员的详细信息</DialogDescription>
          </DialogHeader>
          {selectedColleague && (
            <div className="py-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-20 w-20 mb-2 border-4 border-primary/20">
                  <AvatarImage src={selectedColleague.avatar} alt={selectedColleague.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedColleague.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{selectedColleague.name}</h2>
                <Badge className="mt-1 bg-primary/10 text-primary border-none">
                  {selectedColleague.department} · {selectedColleague.position}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">联系方式</h4>
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedColleague.email}</span>
                  </div>
                  <div className="grid grid-cols-[20px_1fr] gap-2 items-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedColleague.phone}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">积分等级</h4>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <div className="text-lg font-bold">{selectedColleague.points}</div>
                    <Badge className="ml-auto bg-primary/10 text-primary">{mounted ? `Lv.${selectedColleague.level}` : null}</Badge>
                  </div>
                  <Progress
                    value={(selectedColleague.points / 2000) * 100}
                    className="h-2 bg-muted/50"
                    indicatorClassName="progress-indicator"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">专业技能</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedColleague.skills as string[] || []).map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-muted/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-4">加入时间: {selectedColleague.joinDate}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewColleagueOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 积分明细分页组件
function PointsHistoryWithPagination({ userId }: { userId?: string | number }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 获取积分交易记录（分页）
  const { data: pointsTransactions, isLoading, error } = useQuery<{
    transactions: PointTransaction[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>({
    queryKey: ['points-transactions-paginated', userId, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/points/transactions?page=${currentPage}&page_size=${pageSize}`, {
        headers: {
          'X-User-Id': userId?.toString() || '',
        }
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch points transactions: ${response.status}`);
      }
      const data = await response.json();
      return {
        ...data,
        totalPages: Math.ceil(data.totalCount / pageSize)
      };
    },
    staleTime: 10000, // 10秒缓存
    enabled: !!userId, // 只有在用户登录且有ID时才执行
  })

  // 转换积分交易记录为显示格式
  const pointsHistory = pointsTransactions?.transactions?.map(transaction => ({
    id: transaction.id,
    type: transaction.transactionType === 'EARN' ? 'earn' : 'spend',
    amount: transaction.transactionType === 'EARN' ? transaction.amount : -Math.abs(transaction.amount),
    reason: transaction.description || '积分交易',
    date: new Date(transaction.createdAt).toLocaleDateString('zh-CN'),
    category: getTransactionCategory(transaction.transactionType, transaction.referenceType)
  })) || [];

  // 获取交易类别的辅助函数
  function getTransactionCategory(transactionType: string, referenceType?: string) {
    if (transactionType === 'EARN') {
      if (referenceType === 'activity') return '技术贡献';
      if (referenceType === 'bonus') return '奖励积分';
      return '积分获得';
    } else if (transactionType === 'SPEND') {
      if (referenceType === 'redemption') return '福利兑换';
      return '积分消费';
    }
    return '其他';
  }

  const totalPages = pointsTransactions?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            积分明细
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              共 {pointsTransactions?.totalCount || 0} 条记录
            </span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条/页</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              加载失败: {error.message}
            </div>
          ) : pointsHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无积分记录
            </div>
          ) : (
            pointsHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    record.type === "earn"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {record.type === "earn" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{record.reason}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {record.category}
                      </Badge>
                      <span>•</span>
                      <span>{record.date}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  record.type === "earn" ? "text-green-600" : "text-red-600"
                }`}>
                  {record.type === "earn" ? "+" : ""}{record.amount}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              显示 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, pointsTransactions?.totalCount || 0)} 条，
              共 {pointsTransactions?.totalCount || 0} 条记录
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Dashboard 积分概览组件 - 完整版本
function DashboardPointsOverview({
  pointsSummary,
  pointsSummaryLoading,
  pointsTransactions,
  pointsTransactionsLoading,
  pointsTransactionsError,
  monthlyStats,
  monthlyStatsLoading,
  weeklyStats,
  weeklyStatsLoading,
  redemptionStats,
  redemptionStatsLoading
}: {
  pointsSummary?: UserPointsSummary;
  pointsSummaryLoading: boolean;
  pointsTransactions?: { transactions: PointTransaction[]; totalCount: number };
  pointsTransactionsLoading: boolean;
  pointsTransactionsError?: Error;
  monthlyStats?: {
    userId: number;
    monthlyTransactions: number;
    monthlyEarned: number;
    monthlySpent: number;
    monthStart: string;
  };
  monthlyStatsLoading: boolean;
  weeklyStats?: {
    userId: number;
    weeklyTransactions: number;
    weeklyEarned: number;
    weeklySpent: number;
    weekStart: string;
  };
  weeklyStatsLoading: boolean;
  redemptionStats?: {
    userId: number;
    totalRedemptions: number;
    totalPointsSpent: number;
    monthlyRedemptions: number;
    monthlyPointsSpent: number;
    monthStart: string;
  };
  redemptionStatsLoading: boolean;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  // 使用真实数据或fallback到模拟数据
  const userData = {
    currentPoints: pointsSummary?.currentBalance || user?.total_points || user?.points || 0,
    totalEarned: pointsSummary?.totalEarned || 0,
    totalSpent: pointsSummary?.totalSpent || 0,
    level: pointsSummary?.currentLevel?.level || user?.level || 1,
    nextLevelPoints: pointsSummary?.pointsToNext || 0,
    monthlyEarned: monthlyStats?.monthlyEarned || 0,
    monthlySpent: monthlyStats?.monthlySpent || 0,
    redeemCount: redemptionStats?.monthlyRedemptions || 0,
    progressPercentage: pointsSummary?.progressPercentage || 0
  };

  // 转换积分交易记录为显示格式
  const pointsHistory = pointsTransactions?.transactions?.map(transaction => ({
    id: transaction.id,
    type: transaction.transactionType === 'EARN' ? 'earn' : 'spend',
    amount: transaction.transactionType === 'EARN' ? transaction.amount : -Math.abs(transaction.amount),
    reason: transaction.description || '积分交易',
    date: new Date(transaction.createdAt).toLocaleDateString('zh-CN'),
    category: getTransactionCategory(transaction.transactionType, transaction.referenceType)
  })) || [];

  // 获取交易类别的辅助函数
  function getTransactionCategory(transactionType: string, referenceType?: string) {
    if (transactionType === 'EARN') {
      if (referenceType === 'activity') return '技术贡献';
      if (referenceType === 'bonus') return '奖励积分';
      return '积分获得';
    } else if (transactionType === 'SPEND') {
      if (referenceType === 'redemption') return '福利兑换';
      return '积分消费';
    }
    return '其他';
  }

  const mockRedeemHistory = [
    { id: 1, item: "星巴克咖啡券", points: 200, status: "completed", date: "2024-01-13", category: "福利" },
    { id: 2, item: "技术书籍《Clean Code》", points: 150, status: "completed", date: "2024-01-11", category: "学习" },
    { id: 3, item: "午餐券", points: 100, status: "pending", date: "2024-01-10", category: "福利" },
  ];

  const progressPercentage = userData.progressPercentage;

  return (
    <div className="space-y-6">
      {/* 积分概览卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 当前积分 */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前积分</CardTitle>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Coins className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pointsSummaryLoading ? '...' : userData.currentPoints}
            </div>
          </CardContent>
        </Card>

        {/* 本月兑换 */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月兑换</CardTitle>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pointsSummaryLoading ? '...' : userData.redeemCount}
            </div>
          </CardContent>
        </Card>

        {/* 积分等级 */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">积分等级</CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Star className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              Lv.{pointsSummaryLoading ? '...' : userData.level}
            </div>
            <div className="mt-2">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {pointsSummaryLoading ? '加载中...' : `距离下一级别还需 ${userData.nextLevelPoints} 积分`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 累计获得 */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计获得</CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {pointsSummaryLoading ? '...' : userData.totalEarned}
            </div>
            <p className="text-xs text-muted-foreground">
              已消费 {pointsSummaryLoading ? '...' : userData.totalSpent} 积分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">积分商城</TabsTrigger>
          <TabsTrigger value="history">积分明细</TabsTrigger>
          <TabsTrigger value="redeem">兑换明细</TabsTrigger>
        </TabsList>

        {/* 积分商城 */}
        <TabsContent value="overview" className="space-y-4">
          <DashboardPointsMall currentPoints={userData.currentPoints} />
        </TabsContent>

        {/* 积分明细 */}
        <TabsContent value="history" className="space-y-4">
          <PointsHistoryWithPagination userId={user?.id} />
        </TabsContent>

        {/* 兑换明细 */}
        <TabsContent value="redeem" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="mr-2 h-5 w-5" />
                兑换明细
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRedeemHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Gift className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{record.item}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {record.category}
                          </Badge>
                          <span>•</span>
                          <span>{record.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-blue-600">-{record.points}</span>
                      <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                        {record.status === "completed" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {record.status === "completed" ? "已完成" : "处理中"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 积分商城组件
function DashboardPointsMall({ currentPoints }: { currentPoints: number }) {
  const { toast } = useToast()

  // 奖励数据
  const rewards = [
    {
      id: 1,
      title: "额外休假日",
      description: "获得一天带薪休假",
      points: 7,
      category: "休闲",
      icon: Gift,
      likes: 85,
      stock: 10,
      available: true,
    },
    {
      id: 2,
      title: "专业发展基金",
      description: "获得用于专业发展的资金支持",
      points: 10,
      category: "职业发展",
      icon: Award,
      likes: 92,
      stock: 5,
      available: true,
    },
    {
      id: 3,
      title: "技术书籍补贴",
      description: "获得用于购买专业技术书籍的补贴",
      points: 6,
      category: "职业发展",
      icon: Trophy,
      likes: 78,
      stock: 15,
      available: true,
    },
    {
      id: 4,
      title: "健身房会员",
      description: "一个月的健身房会员资格",
      points: 4,
      category: "健康",
      icon: Zap,
      likes: 65,
      stock: 8,
      available: true,
    },
    {
      id: 5,
      title: "咖啡券",
      description: "星巴克咖啡券 5 张",
      points: 20,
      category: "福利",
      icon: Gift,
      likes: 90,
      stock: 20,
      available: true,
    },
    {
      id: 6,
      title: "团队聚餐",
      description: "组织团队聚餐活动",
      points: 80,
      category: "团队",
      icon: Sparkles,
      likes: 88,
      stock: 3,
      available: true,
    },
    {
      id: 7,
      title: "京东购物卡",
      description: "价值 500 元京东购物卡",
      points: 12,
      category: "福利",
      icon: Gift,
      likes: 95,
      stock: 12,
      available: true,
    },
    {
      id: 8,
      title: "办公设备补贴",
      description: "用于购买键盘、鼠标等办公设备",
      points: 3,
      category: "办公",
      icon: Cpu,
      likes: 72,
      stock: 25,
      available: true,
    },
    {
      id: 9,
      title: "在线课程券",
      description: "技术培训平台课程券",
      points: 4,
      category: "职业发展",
      icon: Trophy,
      likes: 85,
      stock: 18,
      available: true,
    },
    {
      id: 10,
      title: "午餐券",
      description: "公司食堂午餐券 10 张",
      points: 150,
      category: "福利",
      icon: Gift,
      likes: 88,
      stock: 30,
      available: true,
    },
  ]



  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)
  const [selectedRedeemReward, setSelectedRedeemReward] = useState<any>(null)

  const handleRedeemClick = (reward: any) => {
    if (currentPoints < reward.points) {
      toast({
        title: "积分不足",
        description: `您需要 ${reward.points} 积分，当前只有 ${currentPoints} 积分`,
        variant: "destructive",
      })
      return
    }

    if (!reward.available || reward.stock <= 0) {
      toast({
        title: "商品缺货",
        description: "该商品暂时缺货，请选择其他商品",
        variant: "destructive",
      })
      return
    }

    setSelectedRedeemReward(reward)
    setRedeemDialogOpen(true)
  }

  const confirmRedeem = () => {
    if (!selectedRedeemReward) return

    // 模拟兑换成功
    toast({
      title: "兑换成功",
      description: `成功兑换 ${selectedRedeemReward.title}，消耗 ${selectedRedeemReward.points} 积分。订单已提交，请等待核销。`,
      variant: "default",
    })

    // 更新库存（实际应该调用API）
    const updatedRewards = rewards.map(r =>
      r.id === selectedRedeemReward.id
        ? { ...r, stock: r.stock - 1 }
        : r
    )

    setRedeemDialogOpen(false)
    setSelectedRedeemReward(null)
  }

  return (
    <div className="space-y-6">
      {/* 奖励商城 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            积分商城
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const IconComponent = reward.icon
              const canAfford = currentPoints >= reward.points
              const inStock = reward.available && reward.stock > 0
              const canRedeem = canAfford && inStock

              return (
                <Card key={reward.id} className={`transition-all duration-200 hover:shadow-md ${
                  canAfford ? 'hover:scale-105' : 'opacity-75'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold flex items-center text-primary">
                          <Coins className="h-4 w-4 mr-1" />
                          {reward.points}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          {reward.likes}%
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        库存: {reward.stock}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant={canRedeem ? "default" : "secondary"}
                          size="sm"
                          disabled={!canRedeem}
                          className="h-8 text-xs"
                          onClick={() => handleRedeemClick(reward)}
                        >
                          {!inStock ? "缺货" : !canAfford ? "积分不足" : "兑换"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>



      {/* 兑换确认弹窗 */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Gift className="mr-2 h-5 w-5 text-primary" />
              确认兑换
            </DialogTitle>
          </DialogHeader>
          {selectedRedeemReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">{selectedRedeemReward.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedRedeemReward.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span>消耗积分:</span>
                  <span className="font-semibold text-primary">
                    {selectedRedeemReward.points} 积分
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span>剩余库存:</span>
                  <span className="font-semibold">
                    {selectedRedeemReward.stock} 件
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                兑换后将生成订单，请等待管理员核销。核销完成后您将收到通知。
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmRedeem}>
              确认兑换
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
