"use client"

import * as React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentActivities } from "@/components/recent-activities"
import { LazyScoringSystemWithSuspense } from "@/components/lazy/LazyComponents"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { unifiedApi } from "@/lib/unified-api"
import { User } from "@/lib/types"
import { GovernanceCard, WeeklyGoalsCard, PointsCard, ComplianceCard } from "@/components/ui/metric-card"
import { useToast } from "@/components/ui/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// 积分相关类型定义 - 移动到 @/lib/types/points
import { formatPoints } from '@/lib/types/points';

// 拆分后的组件导入
import { PointsOverviewWithStats } from '@/components/dashboard/PointsOverviewWithStats';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ProfileEditDialog } from '@/components/dashboard/ProfileEditDialog';
import { ProfileAchievements } from '@/components/dashboard/ProfileAchievements';
import { ColleagueDialog } from '@/components/dashboard/ColleagueDialog';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';



// 动画延迟工具函数
const getAnimationDelay = (index: number) => ({
  style: { animationDelay: `${index * 100}ms` }
});

// 卡片动画类名生成器
const getCardAnimationClass = (index: number) =>
  `animate-in slide-in-from-bottom-2 fade-in duration-500 ${index > 0 ? `delay-${index * 100}` : ''}`;



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient(); // 初始化 queryClient

  // Points data is now handled in individual components

  const { toast } = useToast()

  // Simplified state management - only keep what's not in useAuth
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [viewColleagueOpen, setViewColleagueOpen] = useState(false)
  const [selectedColleague, setSelectedColleague] = useState<User | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)
  const [achievements] = useState<any[]>([]) // Placeholder for achievements

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

  // Activity API removed - now handled by RecentActivities component

  const handleEditProfile = () => {
    // 在打开编辑对话框时，设置当前用户的组织
    const currentDepartment = departments.find(d => d.name === user?.department);
    setSelectedDepartment(currentDepartment?.id.toString());
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // 只有当手机号不为空时才进行验证
    if (user?.phone && !isValidPhone(user.phone)) {
      toast({
        title: "错误",
        description: "请输入有效的11位手机号码。",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedInfo = {
        name: user?.name || "",
        phone: user?.phone || "",
        githubUrl: user?.githubUrl || "",
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

  // Recent activities are now handled by RecentActivities component



  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // 手机号验证函数
  const isValidPhone = (phone: string) => {
    // 简单的中国手机号验证（11位数字，1开头）
    // return true; // 暂时跳过手机号验证，用于调试
    return /^1[3-9]\d{9}$/.test(phone)
  }

  // Avatar upload functionality moved to ProfileCard component

  if (isLoadingDepartments) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  // 组件渲染
  return (
    <div className="h-full px-4 pt-4 pb-6 lg:px-8 lg:pb-10">

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
          <section className="space-y-8 pt-4 animate-in fade-in duration-300">
            <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto px-2">
              <div {...getAnimationDelay(0)}>
                <GovernanceCard value={89.5} trend="+2.5%" />
              </div>
              <div {...getAnimationDelay(1)}>
                <WeeklyGoalsCard value={145} trend="+24" />
              </div>
              <div {...getAnimationDelay(2)}>
                <PointsCard points={parseFloat(formatPoints(user?.total_points || user?.points || 0))} trend="+15" />
              </div>
              <div {...getAnimationDelay(3)}>
                <ComplianceCard percentage={98.2} trend="+1.2%" />
              </div>
            </div>
            <div className={cn("grid gap-8 md:gap-8 lg:grid-cols-7 px-2 mb-8 pb-8")}>
              <Card className="col-span-4 shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-in slide-in-from-bottom-2 fade-in duration-500">
                <CardHeader>
                  <CardTitle>多维度治理分析</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-3 shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-in slide-in-from-bottom-2 fade-in duration-500">
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
          <section className="p-4">
            <div className="bg-card rounded-xl border border-border shadow-lg p-6 relative">
              <PointsOverviewWithStats />
            </div>
          </section>
        )}

        {activeTab === "scoring" && (
          <section className="animate-in fade-in duration-300 p-2 md:p-3 lg:p-4">
            <div className="bg-card rounded-xl border border-border shadow-lg p-4 md:p-5 lg:p-6 w-full max-w-[1400px] mx-auto">
              <LazyScoringSystemWithSuspense />
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-300 max-w-7xl mx-auto px-2">
            <div className="grid gap-8 md:grid-cols-3 mb-8">
              {/* 个人信息卡片 */}
              <div className="md:col-span-1">
                <ProfileCard
                  userData={{
                    name: user?.name || "",
                    department: user?.department || "",
                    position: user?.position || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    githubUrl: user?.githubUrl || "",
                    joinDate: user?.joinDate || "",
                    points: user?.total_points ?? user?.points ?? 0,
                    level: user?.level ?? 0,
                    companyName: user?.companyName || "",
                    skills: user?.skills || []
                  }}
                  setUserData={() => {}} // No longer needed
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
                  userData={{
                    name: user?.name || "",
                    department: user?.department || "",
                    position: user?.position || "",
                    email: user?.email || "",
                    phone: user?.phone || "",
                    githubUrl: user?.githubUrl || "",
                    joinDate: user?.joinDate || "",
                    points: user?.total_points ?? user?.points ?? 0,
                    level: user?.level ?? 0,
                    companyName: user?.companyName || "",
                    skills: user?.skills || []
                  }}
                  setUserData={() => {}} // No longer needed
                  selectedDepartment={selectedDepartment}
                  setSelectedDepartment={setSelectedDepartment}
                  departments={departments}
                  isLoadingDepartments={isLoadingDepartments}
                  user={user}
                  onSave={handleSaveProfile}
                />
              </div>

              {/* 成就和活动卡片 */}
              <ProfileAchievements userData={{
                name: user?.name || "",
                department: user?.department || "",
                position: user?.position || "",
                email: user?.email || "",
                phone: user?.phone || "",
                githubUrl: user?.githubUrl || "",
                joinDate: user?.joinDate || "",
                points: user?.total_points ?? user?.points ?? 0,
                level: user?.level ?? 0,
                companyName: user?.companyName || "",
                skills: user?.skills || [],
                achievements,
                recentActivities: []
              }} />
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

