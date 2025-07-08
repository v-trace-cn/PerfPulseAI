"use client"

import * as React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentActivities } from "@/components/recent-activities"
// 修改导入方式，使用默认导入
import RewardSystem from "@/components/reward-system"
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
  MessageSquare,
  Activity,
  Eye,
  EyeOff,
  Plus,
  Search,
  Github,
  Building2,
  Calendar,
  Camera,
  BarChart3 as ChartBar,
  User as UserIcon,
  Cpu,
  Code,
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
import { User, Activity as ActivityType, RecentActivity, Department, Member as MemberType, ProfileUpdateData } from "@/lib/types"
import { GovernanceCard, WeeklyGoalsCard, PointsCard, ComplianceCard } from "@/components/ui/metric-card"
import { useToast } from "@/components/ui/use-toast"
import { useApi } from "@/hooks/useApi"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useQuery, useQueryClient } from "@tanstack/react-query"

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

interface Member {
  id: string;
  name: string;
  email: string;
  githubUrl: string | null;
  avatar: string;
  department: string | null;
  position: string | null;
  joinDate: string;
  points: number;
  level: number;
  phone: string | null;
  // Removed the other score fields as they are not directly from backend user data
  // complianceScore: number;
  // transparencyScore: number;
  // accountabilityScore: number;
  // totalScore: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient(); // 初始化 queryClient
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
  })

  const [showPhone, setShowPhone] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [viewColleagueOpen, setViewColleagueOpen] = useState(false)
  const [selectedColleague, setSelectedColleague] = useState<Member | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)

  // 使用 useQuery 获取部门列表
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await unifiedApi.department.getAll();
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });
  const departments = Array.isArray(departmentsData) ? departmentsData : [];

  // Activity API for fetching recent personal activities
  const { execute: fetchRecentActivities } = useApi(unifiedApi.activity.getRecentActivities);

  const handleEditProfile = () => {
    // 在打开编辑对话框时，设置当前用户的部门
    const currentDepartment = departments.find(d => d.name === userData.department);
    setSelectedDepartment(currentDepartment?.id.toString());
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSaveProfile called.");
    console.log("userData.phone:", userData.phone, "isValidPhone:", isValidPhone(userData.phone));

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
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined, // 使用状态中的部门ID
      };

      console.log("Updated info to send:", updatedInfo);
      console.log("User object:", user, "User ID:", user?.id);

      if (user && user.id) {
        const result = await unifiedApi.user.updateUserInfo(user.id, updatedInfo);
        console.log("API update result:", result);

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
      console.log("AuthContext user updated:", user);
      console.log("user.points:", user.points);
      console.log("user.total_points:", user.total_points);
      console.log("user.githubUrl directly:", user.githubUrl);
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
      });
      console.log("Updated userData in useEffect (after explicit set):");
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
              show_id: act.show_id,
              type: act.status,
              title: act.title,
              date: getRelativeDate(act.created_at),
              points: act.points,
            }));
            setUserData((prev: any) => ({ ...prev, recentActivities: formattedActivities }));
          } else {
            console.error("Fetching recent activities failed or no activities in response.data.activities", response);
          }
        })
        .catch((err) => console.error("Error fetching recent activities", err));
    }
  }, [user, fetchRecentActivities]);

  // New useEffect to observe userData changes
  useEffect(() => {
    console.log("userData state changed:", userData);
    if (userData.githubUrl) {
      console.log("GitHub URL is now present in userData:", userData.githubUrl);
    } else {
      console.log("GitHub URL is still NOT present in userData.");
    }
  }, [userData]); // Depend on userData to log its changes

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
        console.error("上传头像时出错:", error)
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
              <RewardSystem />
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
                        {(userData.skills as string[]).map((skill: string, index: number) => (
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
                                部门
                              </Label>
                              <Select
                                key={`dept-select-${isLoadingDepartments}-${departments.length}`}
                                value={selectedDepartment}
                                onValueChange={setSelectedDepartment}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="选择部门" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  {isLoadingDepartments ? (
                                    <SelectItem value="loading" disabled>加载中...</SelectItem>
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
                        {userData.achievements.map((achievement) => (
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
                    {(selectedColleague.skills as string[]).map((skill: string, index: number) => (
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
