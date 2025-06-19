"use client"

import type React from "react"

import Image from "next/image"
import Dashboard from "@/components/dashboard"
import {
  User,
  Settings,
  LogOut,
  HelpCircle,
  LogIn,
  UserPlus,
  MessageCircleQuestionIcon as QuestionMarkCircledIcon,
  MailIcon,
  MessageSquareIcon,
  MessageSquareTextIcon,
  FileTextIcon,
  GraduationCapIcon,
  BookOpenIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { directAuthApi } from "@/lib/direct-api"  // 导入密码重置 API

export default function ClientPage() {
  const { user, isAuthenticated, isLoading, error, login, register, logout } = useAuth()
  const router = useRouter()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    passwordMatch: "",
  })
  const [registrationStatus, setRegistrationStatus] = useState<string>("");
  // 当注册提示文字出现后，3 秒后自动清除
  useEffect(() => {
    if (registrationStatus) {
      const timer = setTimeout(() => setRegistrationStatus(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [registrationStatus]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [activeHelpTab, setActiveHelpTab] = useState("faq")
  const [activeTab, setActiveTab] = useState("profile")
  const searchParams = useSearchParams()
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium")
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("dark")
  const [themeColor, setThemeColor] = useState<string>("primary")
  const { setTheme } = useTheme()
  const { toast } = useToast()

  // 应用字体大小变化的函数
  const applyFontSize = (size: "small" | "medium" | "large") => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // 获取根元素
    const root = document.documentElement

    // 根据选择设置CSS变量
    switch (size) {
      case "small":
        root.style.setProperty("--font-size-factor", "0.9")
        break
      case "medium":
        root.style.setProperty("--font-size-factor", "1")
        break
      case "large":
        root.style.setProperty("--font-size-factor", "1.2")
        break
    }

    // 保存用户偏好到localStorage
    localStorage.setItem("preferred-font-size", size)
  }

  // 应用主题模式
  const applyThemeMode = (mode: "light" | "dark" | "system") => {
    setTheme(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem("preferred-theme-mode", mode)
    }
  }

  // 应用主题色
  const applyThemeColor = (color: string) => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement

    // 保存当前选择的颜色
    localStorage.setItem("preferred-theme-color", color)

    // 根据选择设置CSS变量
    switch (color) {
      case "primary": // 默认紫色
        root.style.setProperty("--primary", "252 94% 67%")
        break
      case "blue":
        root.style.setProperty("--primary", "217 91% 60%")
        break
      case "green":
        root.style.setProperty("--primary", "142 71% 45%")
        break
      case "amber":
        root.style.setProperty("--primary", "38 92% 50%")
        break
      case "red":
        root.style.setProperty("--primary", "0 84% 60%")
        break
      case "purple":
        root.style.setProperty("--primary", "270 95% 75%")
        break
    }
  }

  // 在组件挂载时加载保存的字体大小设置
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem("preferred-font-size") as "small" | "medium" | "large" | null
      if (savedFontSize) {
        setFontSize(savedFontSize)
        applyFontSize(savedFontSize)
      }
    }
  }, [])

  // 在组件挂载时加载保存的主题设置
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const savedThemeMode = localStorage.getItem("preferred-theme-mode") as "light" | "dark" | "system" | null
      if (savedThemeMode) {
        setThemeMode(savedThemeMode)
        applyThemeMode(savedThemeMode)
      }

      const savedThemeColor = localStorage.getItem("preferred-theme-color")
      if (savedThemeColor) {
        setThemeColor(savedThemeColor)
        applyThemeColor(savedThemeColor)
      }
    }
  }, [])

  // 使用 AuthContext 自动管理身份验证状态

  useEffect(() => {
    // 检查 URL 参数是否包含 tab=profile 或 tab=settings
    const tab = searchParams.get("tab")
    if (tab === "profile") {
      setActiveTab("profile")
    } else if (tab === "settings") {
      setActiveTab("settings")
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    // 同步更新表单数据
    setFormData((prev) => ({ ...prev, [id]: value }))

    // 清除对应字段的错误
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }))
    }

    // 如果是密码字段变更，检查密码匹配
    if (id === "password" || id === "confirmPassword") {
      if (id === "password" && formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          passwordMatch: "两次输入的密码不一致",
        }))
      } else if (id === "confirmPassword" && value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          passwordMatch: "两次输入的密码不一致",
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          passwordMatch: "",
        }))
      }
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "请输入有效的邮箱地址"
      isValid = false
    } else {
      newErrors.email = ""
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = "密码不能为空"
      isValid = false
    } else {
      newErrors.password = ""
    }

    // 如果是注册模式，验证确认密码
    if (authMode === "register") {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "请确认密码"
        isValid = false
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.passwordMatch = "两次输入的密码不一致"
        isValid = false
      } else {
        newErrors.confirmPassword = ""
        newErrors.passwordMatch = ""
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setErrors({ ...errors });
    if (authMode === "login") {
      // 登录逻辑
      let loginSuccess = false;
      loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        setAuthDialogOpen(false);
      }
    } else if (authMode === "register") {
      // 注册逻辑
      try {
        const success = await register(formData.email, formData.password, formData.email.split("@")[0]);
        if (success) {
          setRegistrationStatus("注册成功");
          setAuthDialogOpen(false);
        } else {
          setRegistrationStatus("注册失败，请稍后再试");
        }
      } catch (err) {
        setRegistrationStatus("注册失败，请稍后再试");
      }
    } else if (authMode === "reset") {
      // 重置密码逻辑
      try {
        const resp = await directAuthApi.resetPassword(formData.email, formData.password);
        if (resp.success) {
          toast({ title: "重置成功", description: "请使用新密码登录系统", variant: "default" });
          // 切回登录模式并重置表单
          setAuthMode("login");
          setFormData({ email: formData.email, password: "", confirmPassword: "" });
          setErrors({ email: "", password: "", confirmPassword: "", passwordMatch: "" });
        } else {
          toast({ title: "重置失败", description: resp.message || "请稍后再试", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "重置错误", description: "无法连接服务器，请稍后再试", variant: "destructive" });
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <style jsx global>{`
        :root {
          --font-size-factor: 1;
          font-size: calc(16px * var(--font-size-factor));
        }
        
        .text-xs {
          font-size: calc(0.75rem * var(--font-size-factor));
        }
        
        .text-sm {
          font-size: calc(0.875rem * var(--font-size-factor));
        }
        
        .text-base {
          font-size: calc(1rem * var(--font-size-factor));
        }
        
        .text-lg {
          font-size: calc(1.125rem * var(--font-size-factor));
        }
        
        .text-xl {
          font-size: calc(1.25rem * var(--font-size-factor));
        }
        
        .text-2xl {
          font-size: calc(1.5rem * var(--font-size-factor));
        }
      `}</style>
      <header className="border-b backdrop-blur-sm bg-background/70 sticky top-0 z-50 transition-colors duration-300 dark:border-primary/10 border-black/5">
        <div className="container flex h-16 items-center justify-between py-4 dark:bg-background/40 dark:backdrop-blur-md dark:border-primary/5 dark:shadow-[0_4px_20px_rgba(79,70,229,0.1)] rounded-b-lg">
          <div className="flex items-center gap-2">
            <Image src="/logo.ico" alt="Logo" width={24} height={24} className="animate-pulse-slow" />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="cyber-text">PerfPulseAI</span> 
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 data-pill hover:bg-muted/50 transition-colors relative pr-14 pl-3 py-1.5 ml-2">
                {isAuthenticated ? (
                  <>
                    <Avatar className="h-6 w-6 border-2 border-primary/20">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.name || '用户'} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.name ? user.name.charAt(0) : '用'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-medium">{user?.name || '未知用户'}</span>
                      <span className="text-[10px] text-muted-foreground">{user?.department || user?.email || '未知部门'}</span>
                    </div>
                    <Badge className="h-5 ml-1 mr-6 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                      <span className="text-[10px]">{user?.points || 0}分</span>
                    </Badge>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 text-primary" />
                    <span className="text-sm">登录</span>
                  </>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
                <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => (window.location.href = "?tab=profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setSettingsDialogOpen(true)
                        // 使用更安全的方式关闭下拉菜单
                        if (typeof window !== 'undefined') {
                          document.body.click()
                        }
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setHelpDialogOpen(true)
                        // 使用更安全的方式关闭下拉菜单
                        if (typeof window !== 'undefined') {
                          document.body.click()
                        }
                      }}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>AI 帮助与支持</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-500 focus:text-red-500"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer text-primary focus:text-primary"
                      onClick={() => {
                        setAuthMode("login")
                        setAuthDialogOpen(true)
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>登录系统</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-emerald-500 focus:text-emerald-500"
                      onClick={() => {
                        setAuthMode("register")
                        setAuthDialogOpen(true)
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>注册账号</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 dark:bg-gradient-to-b dark:from-background dark:to-background/90">
        <div className="shadow-xl rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm border border-black/5 dark:border-primary/20 dark:bg-background/30 dark:shadow-[0_8px_30px_rgba(79,70,229,0.15)]">
          <Dashboard />
        </div>
      </div>
      {/* 登录/注册对话框 */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "登录系统" : authMode === "register" ? "注册账号" : "重置密码"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "请输入您的邮箱和密码登录系统"
                : authMode === "register"
                  ? "创建一个新账号以访问AI治理系统"
                  : "请输入您的邮箱和新密码"}
            </DialogDescription>
            {authMode === "register" && registrationStatus && registrationStatus.includes("但未返回") && (
              <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>您可以稍后使用注册的邮箱和密码登录系统</p>
              </div>
            )}
          </DialogHeader>
          <div className="grid gap-y-2 py-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-2">
                <p>{error}</p>
              </div>
            )}
            {registrationStatus && (
              <div className={`${registrationStatus.includes("但未返回") ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400" : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"} border p-3 rounded-md text-sm mb-4`}>
                <div className="flex items-start">
                  {registrationStatus.includes("但未返回") ? (
                    <div className="mr-2 flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="mr-2 flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{registrationStatus}</p>
                    {registrationStatus.includes("用户ID") && (
                      <p className="mt-1 text-xs">注册成功！您的用户ID已返回，可以使用此账号登录系统。</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                className="col-span-3"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.email}</p>}
            </div>
            {authMode === "login" && (
              <div className="text-right">
                <Button
                  variant="link"
                  className="text-xs p-0"
                  onClick={() => setAuthMode("reset")}
                  disabled={isLoading}
                >
                  忘记密码？
                </Button>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                className="col-span-3"
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.password}</p>
              )}
            </div>
            {(authMode === "register" || authMode === "reset") && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  确认密码
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="col-span-3"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                  }}
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs col-span-3 col-start-2">{errors.confirmPassword}</p>
                )}
              </div>
            )}
            {errors.passwordMatch && (
              <p className="text-red-500 text-xs text-center">{errors.passwordMatch}</p>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="flex flex-col items-start space-y-1">
              {authMode === "login" && (
                <Button
                  variant="link"
                  className="text-xs p-0"
                  onClick={() => setAuthMode("register")}
                  disabled={isLoading}
                >
                  没有账号？注册新账号
                </Button>
              )}
              {authMode === "register" && (
                <Button
                  variant="link"
                  className="text-xs p-0"
                  onClick={() => setAuthMode("login")}
                  disabled={isLoading}
                >
                  已有账号？返回登录
                </Button>
              )}
              {authMode === "reset" && (
                <Button
                  variant="link"
                  className="text-xs p-0"
                  onClick={() => setAuthMode("login")}
                  disabled={isLoading}
                >
                  返回登录
                </Button>
              )}
            </div>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="w-28 justify-center">
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  {authMode === "login" ? "登录中..." : authMode === "register" ? "注册中..." : "重置中..."}
                </>
              ) : (
                authMode === "login" ? "登录" : authMode === "register" ? "注册" : "重置密码"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* AI 帮助与支持对话框 */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI 帮助与支持</DialogTitle>
            <DialogDescription>获取关于 AI 治理系统的帮助和支持</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="faq" value={activeHelpTab} onValueChange={setActiveHelpTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="faq">常见问题</TabsTrigger>
                <TabsTrigger value="contact">联系支持</TabsTrigger>
                <TabsTrigger value="docs">文档资源</TabsTrigger>
              </TabsList>
              <TabsContent value="faq" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">常见问题解答</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                      <h4 className="font-medium flex items-center">
                        <QuestionMarkCircledIcon className="h-4 w-4 mr-2 text-primary" />
                        如何获取和使用积分？
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        积分可通过完成任务、参与治理活动和获得同事点赞来获取。积分可用于兑换奖励或升级权限。
                      </p>
                    </div>
                    <div className="border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                      <h4 className="font-medium flex items-center">
                        <QuestionMarkCircledIcon className="h-4 w-4 mr-2 text-primary" />
                        如何提交治理建议？
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        在"治理机制"标签页中，点击"添加贡献"按钮，填写相关信息并提交。您的建议将由AI系统和团队成员评估。
                      </p>
                    </div>
                    <div className="border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                      <h4 className="font-medium flex items-center">
                        <QuestionMarkCircledIcon className="h-4 w-4 mr-2 text-primary" />
                        如何查看我的治理分数？
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        在个人中心可以查看您的治理分数和详细分析。治理分数由合规性、透明度和责任制三个维度组成。
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="contact" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">联系支持团队</h3>
                  <div className="grid gap-4">
                    <div className="flex items-start space-x-3 border rounded-lg p-3">
                      <MailIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">电子邮件支持</h4>
                        <p className="text-sm text-muted-foreground">
                          发送邮件至 <span className="text-primary">ai-support@example.com</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">工作日回复时间：24小时内</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 border rounded-lg p-3">
                      <MessageSquareIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">在线聊天支持</h4>
                        <p className="text-sm text-muted-foreground">工作时间：周一至周五 9:00-18:00</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          <MessageSquareTextIcon className="h-4 w-4 mr-2" />
                          开始聊天
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="docs" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">文档资源</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer">
                      <FileTextIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium">用户手册</h4>
                        <p className="text-sm text-muted-foreground">详细的系统使用指南</p>
                      </div>
                      <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer">
                      <GraduationCapIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium">视频教程</h4>
                        <p className="text-sm text-muted-foreground">系统功能演示视频</p>
                      </div>
                      <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer">
                      <BookOpenIcon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium">AI治理最佳实践</h4>
                        <p className="text-sm text-muted-foreground">行业标准和最佳实践指南</p>
                      </div>
                      <ExternalLinkIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHelpDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 设置弹窗 */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <div className="flex h-[500px]">
            {/* 侧边导航栏 */}
            <div className="w-[200px] border-r border-border bg-muted/30 flex flex-col">
              <div className="p-4 border-b">
                <DialogTitle className="text-lg">系统设置</DialogTitle>
              </div>
              <div className="py-2 flex-1 overflow-y-auto">
                <nav className="space-y-1 px-2">
                  {/* 导航链接，点击时滚动到对应部分 */}
                  <a
                    href="#appearance"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary group"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById("appearance")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                    外观
                  </a>
                  <a
                    href="#notifications"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary group"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle cx="12" cy="16" r="1" />
                    </svg>
                    通知
                  </a>
                  <a
                    href="#privacy"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary group"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById("privacy")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle cx="12" cy="16" r="1" />
                    </svg>
                    隐私
                  </a>
                  <a
                    href="#accessibility"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary group"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById("accessibility")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m4.93 4.93 4.24 4.24" />
                      <path d="m14.83 9.17 4.24-4.24" />
                      <path d="m14.83 14.83 4.24 4.24" />
                      <path d="m9.17 14.83-4.24 4.24" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    无障碍
                  </a>
                  <a
                    href="#advanced"
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 hover:text-primary group"
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById("advanced")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    高级
                  </a>
                </nav>
              </div>
            </div>

            {/* 主内容区域 - 连续滚动文档 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-12">
              {/* 外观设置部分 */}
              <section id="appearance" className="scroll-mt-4">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                    外观设置
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">主题模式</Label>
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`border-2 ${themeMode === "light" ? "border-primary" : "border-gray-200 dark:border-gray-700"} rounded-md p-1 cursor-pointer hover:border-primary transition-colors w-full aspect-video flex items-center justify-center bg-white`}
                          onClick={() => {
                            setThemeMode("light")
                            applyThemeMode("light")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-black"
                          >
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                          </svg>
                        </div>
                        <span className="text-sm">浅色</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`border-2 ${themeMode === "dark" ? "border-primary" : "border-gray-200 dark:border-gray-700"} rounded-md p-1 cursor-pointer hover:border-primary transition-colors w-full aspect-video flex items-center justify-center bg-gray-900`}
                          onClick={() => {
                            setThemeMode("dark")
                            applyThemeMode("dark")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                          </svg>
                        </div>
                        <span className="text-sm">深色</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`border-2 ${themeMode === "system" ? "border-primary" : "border-gray-200 dark:border-gray-700"} rounded-md p-1 cursor-pointer hover:border-primary transition-colors w-full aspect-video flex items-center justify-center bg-gradient-to-r from-white to-gray-900`}
                          onClick={() => {
                            setThemeMode("system")
                            applyThemeMode("system")
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600"
                          >
                            <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                            <path d="M12 8a2.83 2.83 0 0 1 4 4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.9 4.9 1.4 1.4" />
                            <path d="m17.7 17.7 1.4 1.4" />
                            <path d="m14.83 9.17 4.24-4.24" />
                            <path d="m19.07 4.93-1.4 1.4" />
                            <path d="m6.34 17.66-1.4 1.4" />
                            <path d="m9.17 14.83-4.24 4.24" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </div>
                        <span className="text-sm">跟随系统</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">选择您喜欢的界面模式，或跟随系统设置自动切换</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">主题色</Label>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <div
                        className={`w-8 h-8 rounded-full bg-primary border-2 ${themeColor === "primary" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("primary")
                          applyThemeColor("primary")
                        }}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full bg-blue-500 border-2 ${themeColor === "blue" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("blue")
                          applyThemeColor("blue")
                        }}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full bg-green-500 border-2 ${themeColor === "green" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("green")
                          applyThemeColor("green")
                        }}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full bg-amber-500 border-2 ${themeColor === "amber" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("amber")
                          applyThemeColor("amber")
                        }}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full bg-red-500 border-2 ${themeColor === "red" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("red")
                          applyThemeColor("red")
                        }}
                      ></div>
                      <div
                        className={`w-8 h-8 rounded-full bg-purple-500 border-2 ${themeColor === "purple" ? "border-black dark:border-white" : "border-white dark:border-gray-800"} shadow-sm cursor-pointer`}
                        onClick={() => {
                          setThemeColor("purple")
                          applyThemeColor("purple")
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground">选择您喜欢的主题色，将应用于整个界面</p>
                  </div>
                </div>
              </section>

              {/* 通知设置部分 */}
              <section id="notifications" className="scroll-mt-4">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle cx="12" cy="16" r="1" />
                    </svg>
                    通知设置
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">邮件通知</Label>
                      <p className="text-xs text-muted-foreground">接收重要更新和活动的邮件通知</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input
                        id="emailNotifications"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">推送通知</Label>
                      <p className="text-xs text-muted-foreground">接收实时推送通知</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input
                        id="pushNotifications"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">声音提醒</Label>
                      <p className="text-xs text-muted-foreground">收到通知时播放声音</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input id="soundNotifications" type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">通知频率</Label>
                    <select className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors">
                      <option>实时通知</option>
                      <option>每小时汇总</option>
                      <option>每日汇总</option>
                      <option>每周汇总</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* 隐私设置部分 */}
              <section id="privacy" className="scroll-mt-4">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      <circle cx="12" cy="16" r="1" />
                    </svg>
                    隐私设置
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">数据共享</Label>
                      <p className="text-xs text-muted-foreground">允许系统收集使用数据以改进服务</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input
                        id="dataSharing"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">个人资料可见性</Label>
                      <p className="text-xs text-muted-foreground">控制谁可以查看您的个人资料</p>
                    </div>
                    <select className="w-40 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors">
                      <option>所有人</option>
                      <option>仅团队成员</option>
                      <option>仅管理员</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">活动记录</Label>
                      <p className="text-xs text-muted-foreground">记录您的系统活动历史</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input
                        id="activityLogging"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 无障碍设置部分 */}
              <section id="accessibility" className="scroll-mt-4">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m4.93 4.93 4.24 4.24" />
                      <path d="m14.83 9.17 4.24-4.24" />
                      <path d="m14.83 14.83 4.24 4.24" />
                      <path d="m9.17 14.83-4.24 4.24" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    无障碍设置
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">字体大小</Label>
                    <div className="flex items-center space-x-4 pt-1">
                      <Button
                        variant={fontSize === "small" ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          setFontSize("small")
                          applyFontSize("small")
                        }}
                      >
                        小
                      </Button>
                      <Button
                        variant={fontSize === "medium" ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-3 text-sm"
                        onClick={() => {
                          setFontSize("medium")
                          applyFontSize("medium")
                        }}
                      >
                        中
                      </Button>
                      <Button
                        variant={fontSize === "large" ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-3 text-base"
                        onClick={() => {
                          setFontSize("large")
                          applyFontSize("large")
                        }}
                      >
                        大
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">调整后的字体大小将应用于整个应用界面</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium">对比度</Label>
                    <div className="pt-1">
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2">低</span>
                        <div className="relative flex-1 h-4 bg-muted rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: "70%" }}></div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="70"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">高</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">动画效果</Label>
                      <p className="text-xs text-muted-foreground">启用界面动画效果</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input
                        id="animations"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 高级设置部分 */}
              <section id="advanced" className="scroll-mt-4">
                <div className="border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-primary" />
                    高级设置
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">开发者模式</Label>
                      <p className="text-xs text-muted-foreground">启用高级功能和调试工具</p>
                    </div>
                    <div className="flex h-5 items-center">
                      <input id="developerMode" type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">数据导出</Label>
                    <p className="text-xs text-muted-foreground mb-2">导出您的所有数据</p>
                    <Button variant="outline" size="sm" className="h-8">
                      <DownloadIcon className="h-3.5 w-3.5 mr-1.5" />
                      导出数据
                    </Button>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">清除缓存</Label>
                    <p className="text-xs text-muted-foreground mb-2">清除本地存储的临时数据</p>
                    <Button variant="outline" size="sm" className="h-8">
                      清除缓存
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setSettingsDialogOpen(false)}>保存设置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
