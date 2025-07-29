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
import { ProfileAvatar, UnifiedAvatar } from "@/components/ui/unified-avatar"
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

// 积分相关类型定义 - 移动到 @/lib/types/points
import { PointTransaction, UserPointsSummary, MonthlyStats, WeeklyStats, RedemptionStats, formatPoints } from '@/lib/types/points';

// 拆分后的组件导入
import { PointsOverview } from '@/components/dashboard/PointsOverview';
import { PointsOverviewWithStats } from '@/components/dashboard/PointsOverviewWithStats';
import { PointsHistory } from '@/components/dashboard/PointsHistory';
import { PointsMall } from '@/components/dashboard/PointsMall';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ProfileEditDialog } from '@/components/dashboard/ProfileEditDialog';
import { ProfileAchievements } from '@/components/dashboard/ProfileAchievements';
import { ColleagueDialog } from '@/components/dashboard/ColleagueDialog';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

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

        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="space-y-8 max-w-7xl mx-auto flex-grow w-full pb-16">

        {activeTab === "overview" && (
          <section className="space-y-8 pt-4 animate-fadeIn transition-opacity duration-300">
            <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto px-2">
              <GovernanceCard value={89.5} trend="+2.5%" />
              <WeeklyGoalsCard value={145} trend="+24" />
              <PointsCard points={parseFloat(formatPoints(userData?.points || 0))} />
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
              <PointsOverviewWithStats />
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
              <div className="md:col-span-1">
                <ProfileCard
                  userData={userData}
                  setUserData={setUserData}
                  mounted={mounted}
                />

                <Button
                  className="w-full mt-4 bg-gradient-to-r from-primary to-accent border-0"
                  onClick={handleEditProfile}
                >
                  编辑个人资料
                </Button>


                <ProfileEditDialog
                  open={editProfileOpen}
                  onOpenChange={setEditProfileOpen}
                  userData={userData}
                  setUserData={setUserData}
                  selectedDepartment={selectedDepartment}
                  setSelectedDepartment={setSelectedDepartment}
                  departments={departments}
                  isLoadingDepartments={isLoadingDepartments}
                  user={user}
                  onSave={handleSaveProfile}
                />
              </div>

              {/* 成就和活动卡片 */}
              <ProfileAchievements userData={userData} />
            </div>
          </div>
        )}
      </main>
      {/* 查看同事资料对话框 */}
      <ColleagueDialog
        open={viewColleagueOpen}
        onOpenChange={setViewColleagueOpen}
        selectedColleague={selectedColleague}
        mounted={mounted}
      />
    </div>
  )
}

