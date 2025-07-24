"use client"

import { useState, useEffect } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Download,
  Users,
  Gift,
  Trophy,
  Filter,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  ChevronLeft,
  ChevronRight,
  Bell,
  ShoppingCart,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

// 积分商品数据
const pointsProducts = [
  {
    id: 1,
    name: "MacBook Pro 16寸",
    description: "最新款 MacBook Pro，适合开发工作",
    points: 5000,
    category: "实物奖励",
    image: "/placeholder.svg?height=200&width=200",
    stock: 5,
    isAvailable: true,
  },
  {
    id: 2,
    name: "iPad Air",
    description: "轻薄便携的平板电脑",
    points: 3500,
    category: "实物奖励",
    image: "/placeholder.svg?height=200&width=200",
    stock: 10,
    isAvailable: true,
  },
  {
    id: 3,
    name: "年度会员",
    description: "各种软件服务的年度会员",
    points: 1200,
    category: "虚拟奖励",
    image: "/placeholder.svg?height=200&width=200",
    stock: 999,
    isAvailable: true,
  },
  {
    id: 4,
    name: "现金红包",
    description: "直接现金奖励",
    points: 800,
    category: "现金奖励",
    image: "/placeholder.svg?height=200&width=200",
    stock: 999,
    isAvailable: true,
  },
  {
    id: 5,
    name: "在线课程",
    description: "技能提升在线课程",
    points: 600,
    category: "虚拟奖励",
    image: "/placeholder.svg?height=200&width=200",
    stock: 999,
    isAvailable: true,
  },
];

// 兑换记录数据结构
const redemptionData = [
  {
    id: 1,
    userId: 1,
    userName: "关键先生",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "研发部",
    redeemCode: "GIFT2024001",
    rewardType: "实物奖励",
    rewardName: "MacBook Pro 16寸",
    pointsCost: 5000,
    status: "已发放",
    redeemTime: "2024-06-15 14:30:00",
    processTime: "2024-06-16 09:15:00",
  },
  {
    id: 2,
    userId: 2,
    userName: "增长黑客",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "产品部",
    redeemCode: "GIFT2024002",
    rewardType: "虚拟奖励",
    rewardName: "年度会员",
    pointsCost: 1200,
    status: "处理中",
    redeemTime: "2024-06-14 16:45:00",
    processTime: null,
  },
  {
    id: 3,
    userId: 3,
    userName: "像素魔术师",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "设计部",
    redeemCode: "GIFT2024003",
    rewardType: "实物奖励",
    rewardName: "iPad Air",
    pointsCost: 3500,
    status: "已发放",
    redeemTime: "2024-06-13 11:20:00",
    processTime: "2024-06-14 10:30:00",
  },
  {
    id: 4,
    userId: 4,
    userName: "数据分析师",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "数据部",
    redeemCode: "GIFT2024004",
    rewardType: "现金奖励",
    rewardName: "现金红包",
    pointsCost: 800,
    status: "已发放",
    redeemTime: "2024-06-12 09:10:00",
    processTime: "2024-06-12 15:20:00",
  },
  {
    id: 5,
    userId: 5,
    userName: "全栈工程师",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "研发部",
    redeemCode: "GIFT2024005",
    rewardType: "虚拟奖励",
    rewardName: "在线课程",
    pointsCost: 600,
    status: "已取消",
    redeemTime: "2024-06-11 13:45:00",
    processTime: "2024-06-11 14:00:00",
  },
  {
    id: 6,
    userId: 6,
    userName: "运维专家",
    userAvatar: "/placeholder.svg?height=32&width=32",
    department: "运维部",
    redeemCode: "GIFT2024006",
    rewardType: "实物奖励",
    rewardName: "机械键盘",
    pointsCost: 1500,
    status: "处理中",
    redeemTime: "2024-06-10 17:30:00",
    processTime: null,
  },
]

// 时间段统计数据
const timeRangeStats = {
  "2024-01": { month: "2024年1月", totalRedemptions: 12, totalPoints: 18500, totalUsers: 8 },
  "2024-02": { month: "2024年2月", totalRedemptions: 15, totalPoints: 22300, totalUsers: 10 },
  "2024-03": { month: "2024年3月", totalRedemptions: 18, totalPoints: 26800, totalUsers: 12 },
  "2024-04": { month: "2024年4月", totalRedemptions: 22, totalPoints: 31200, totalUsers: 14 },
  "2024-05": { month: "2024年5月", totalRedemptions: 25, totalPoints: 35600, totalUsers: 16 },
  "2024-06": { month: "2024年6月", totalRedemptions: 28, totalPoints: 42100, totalUsers: 18 },
}

export default function RedemptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2024, 4, 1), // 2024年5月1日
    to: new Date(2024, 5, 30), // 2024年6月30日
  })
  const [selectedTimeRange, setSelectedTimeRange] = useState("current")

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 积分商城状态
  const [showPointsMall, setShowPointsMall] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [userPoints, setUserPoints] = useState(8500) // 模拟用户积分

  // 处理时间范围变化
  const handleTimeRangeChange = (value: string) => {
    setSelectedTimeRange(value)
    const now = new Date()

    switch (value) {
      case "current-week":
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // 周一
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // 周日
        setDateRange({ from: startOfWeek, to: endOfWeek })
        break
      case "current":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setDateRange({ from: startOfMonth, to: endOfMonth })
        break
      case "last-week":
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(now.getDate() - now.getDay() - 6) // 上周一
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6) // 上周日
        setDateRange({ from: lastWeekStart, to: lastWeekEnd })
        break
      case "last-month":
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        setDateRange({ from: lastMonthStart, to: lastMonthEnd })
        break
      case "last-3-months":
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        setDateRange({ from: threeMonthsAgo, to: endOfLastMonth })
        break
      default:
        // custom - 保持当前日期范围
        break
    }
  }
  const [showTrends, setShowTrends] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [rewardTypeFilter, setRewardTypeFilter] = useState("all")
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])

  // 密钥相关状态
  const [redeemKey, setRedeemKey] = useState("")
  const [keyValidation, setKeyValidation] = useState<{
    isValid: boolean | null
    message: string
    rewardInfo?: any
  }>({ isValid: null, message: "" })

  // 兑换功能
  const handleRedeem = async (product: any) => {
    if (userPoints < product.points) {
      toast({
        title: "积分不足",
        description: `您当前有 ${userPoints} 积分，需要 ${product.points} 积分才能兑换此商品。`,
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成兑换密钥
      const redeemCode = `GIFT${Date.now()}`;

      // 创建兑换记录
      const newRedemption = {
        id: Date.now(),
        userId: user?.id || 1,
        userName: user?.name || "当前用户",
        userAvatar: user?.avatar || "/placeholder.svg?height=32&width=32",
        department: user?.department || "研发部",
        redeemCode,
        rewardType: product.category,
        rewardName: product.name,
        pointsCost: product.points,
        status: "已发放",
        redeemTime: new Date().toLocaleString(),
        processTime: new Date().toLocaleString(),
      };

      // 更新用户积分
      setUserPoints(prev => prev - product.points);

      // 添加到兑换记录
      redemptionData.unshift(newRedemption);

      // 发送通知
      sendRedemptionNotification(redeemCode, product.name);

      toast({
        title: "兑换成功！",
        description: `您已成功兑换 ${product.name}，兑换密钥：${redeemCode}`,
      });

      setSelectedProduct(null);
      setShowPointsMall(false);
    } catch (error) {
      toast({
        title: "兑换失败",
        description: "系统错误，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  // 发送兑换成功通知
  const sendRedemptionNotification = async (redeemCode: string, productName: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "redemption_success",
          title: "兑换成功",
          message: `您已成功兑换 ${productName}，兑换密钥：${redeemCode}`,
          userId: user?.id || 1,
          data: {
            redeemCode,
            productName,
            points: selectedProduct?.points
          }
        }),
      });

      if (response.ok) {
        console.log("通知发送成功");
      } else {
        console.error("通知发送失败");
      }
    } catch (error) {
      console.error("发送通知时出错:", error);
    }
  };

  // 过滤和分页逻辑
  const filteredData = redemptionData.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rewardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.redeemCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesType = rewardTypeFilter === "all" || record.rewardType === rewardTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // 分页计算
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 分页控制
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const filteredRedemptions = redemptionData.filter((record) => {
    const matchesSearch =
      record.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.redeemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.rewardName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const matchesType = rewardTypeFilter === "all" || record.rewardType === rewardTypeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleSelectAll = () => {
    if (selectedRecords.length === filteredData.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(filteredData.map((record) => record.id))
    }
  }

  const handleSelectRecord = (recordId: number) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]))
  }

  // 验证密钥
  const validateRedeemKey = () => {
    if (!redeemKey.trim()) {
      setKeyValidation({ isValid: false, message: "请输入兑换密钥" })
      return
    }

    // 模拟密钥验证逻辑
    const validKeys = {
      SUMMER2024: { reward: "夏日大礼包", points: 1000, type: "实物奖励" },
      WELCOME2024: { reward: "新人礼包", points: 500, type: "虚拟奖励" },
      PREMIUM2024: { reward: "高级会员", points: 2000, type: "虚拟奖励" },
    }

    if (validKeys[redeemKey]) {
      setKeyValidation({
        isValid: true,
        message: "密钥验证成功！",
        rewardInfo: validKeys[redeemKey],
      })
    } else {
      setKeyValidation({
        isValid: false,
        message: "无效的兑换密钥，请检查后重试",
      })
    }
  }

  // 执行密钥兑换
  const handleKeyRedeem = () => {
    if (keyValidation.isValid && keyValidation.rewardInfo) {
      // 这里可以调用API执行兑换逻辑
      alert(`兑换成功！获得：${keyValidation.rewardInfo.reward}`)
      setRedeemKey("")
      setKeyValidation({ isValid: null, message: "" })
    }
  }

  const getTimeRangeKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  const getCurrentTimeRangeData = () => {
    const currentKey = getTimeRangeKey(new Date())
    return timeRangeStats[currentKey] || timeRangeStats["2024-06"]
  }

  const getTimeRangeStatsData = () => {
    const currentData = getCurrentTimeRangeData()
    const lastMonthKey = getTimeRangeKey(new Date(new Date().setMonth(new Date().getMonth() - 1)))
    const lastMonthData = timeRangeStats[lastMonthKey] || timeRangeStats["2024-05"]

    return {
      current: currentData,
      lastMonth: lastMonthData,
      growth: {
        totalRedemptions: (
          ((currentData.totalRedemptions - lastMonthData.totalRedemptions) / lastMonthData.totalRedemptions) *
          100
        ).toFixed(1),
        totalPoints: (
          ((currentData.totalPoints - lastMonthData.totalPoints) / lastMonthData.totalPoints) *
          100
        ).toFixed(1),
        totalUsers: (((currentData.totalUsers - lastMonthData.totalUsers) / lastMonthData.totalUsers) * 100).toFixed(1),
      },
    }
  }

  const handleExport = () => {
    const selectedData = redemptionData.filter((record) => selectedRecords.includes(record.id))
    const timeRangeText =
      selectedTimeRange === "current"
        ? "本月"
        : selectedTimeRange === "last-month"
          ? "上月"
          : selectedTimeRange === "last-3-months"
            ? "近3个月"
            : "自定义时间段"

    // Create CSV content
    const csvContent = [
      [`兑换记录导出 - ${timeRangeText}`, `导出时间: ${new Date().toLocaleString()}`],
      [],
      ["兑换ID", "用户姓名", "部门", "兑换码", "奖励类型", "奖励名称", "消耗积分", "状态", "兑换时间", "处理时间"],
      ...selectedData.map((record) => [
        record.id,
        record.userName,
        record.department,
        record.redeemCode,
        record.rewardType,
        record.rewardName,
        record.pointsCost,
        record.status,
        record.redeemTime,
        record.processTime || "未处理",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    // Download CSV
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `兑换记录导出_${timeRangeText}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const timeStats = getTimeRangeStatsData()
  const statusOptions = ["all", "已发放", "处理中", "已取消"]
  const rewardTypeOptions = ["all", "实物奖励", "虚拟奖励", "现金奖励"]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已发放":
        return "bg-green-100 text-green-700"
      case "处理中":
        return "bg-yellow-100 text-yellow-700"
      case "已取消":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "已发放":
        return <CheckCircle className="h-4 w-4" />
      case "处理中":
        return <Clock className="h-4 w-4" />
      case "已取消":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getCustomStatusColor = (status: string) => {
    switch (status) {
      case "已发放":
        return { bg: "#A2FAF420", text: "#065F46", border: "#A2FAF4" }
      case "处理中":
        return { bg: "#A2C8FA20", text: "#1E40AF", border: "#A2C8FA" }
      case "已取消":
        return { bg: "#FCA5A520", text: "#B91C1C", border: "#FCA5A5" }
      default:
        return { bg: "#F3F4F620", text: "#374151", border: "#D1D5DB" }
    }
  }

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="p-6">
            {/* Page Title */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="h-6 w-6" style={{ color: "#B4A2FA" }} />
                  兑奖管理
                </h1>
                <p className="text-gray-600 mt-1">管理积分兑换和奖励发放</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">我的积分:</span>
                  <span className="text-lg font-bold text-yellow-600">{userPoints}</span>
                </div>
                <Button
                  onClick={() => setShowPointsMall(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  积分商城
                </Button>
              </div>
            </div>

            {/* Key Redemption Card */}
            <Card
              className="mb-6 border-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #B4A2FA15, #A2ADFA15)" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" style={{ color: "#B4A2FA" }} />
                  密钥兑换
                </CardTitle>
                <CardDescription className="text-gray-600">输入兑换密钥来获取奖励</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="redeemKey" className="text-gray-700">
                      兑换密钥
                    </Label>
                    <Input
                      id="redeemKey"
                      placeholder="请输入兑换密钥..."
                      value={redeemKey}
                      onChange={(e) => setRedeemKey(e.target.value)}
                      className="mt-1 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={validateRedeemKey}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 bg-transparent"
                    >
                      验证密钥
                    </Button>
                    <Button
                      onClick={handleKeyRedeem}
                      disabled={!keyValidation.isValid}
                      className="text-white disabled:opacity-50"
                      style={{ backgroundColor: "#B4A2FA" }}
                    >
                      立即兑换
                    </Button>
                  </div>
                </div>

                {keyValidation.message && (
                  <div
                    className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${keyValidation.isValid ? "border" : "border"}`}
                    style={{
                      backgroundColor: keyValidation.isValid ? "#A2FAF420" : "#FCA5A520",
                      borderColor: keyValidation.isValid ? "#A2FAF4" : "#FCA5A5",
                      color: keyValidation.isValid ? "#065F46" : "#B91C1C",
                    }}
                  >
                    {keyValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span>{keyValidation.message}</span>
                    {keyValidation.rewardInfo && (
                      <div className="ml-4 text-sm">
                        奖励：{keyValidation.rewardInfo.reward} | 消耗积分：{keyValidation.rewardInfo.points} | 类型：
                        {keyValidation.rewardInfo.type}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #A2ADFA20, #A2ADFA10)" }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">已选择记录</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedRecords.length}</p>
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#A2ADFA" }}
                    >
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #A2E4FA20, #A2E4FA10)" }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">总兑换次数</p>
                      <p className="text-2xl font-bold text-gray-900">{timeStats.current.totalRedemptions}</p>
                      <p className="text-xs" style={{ color: "#0891B2" }}>
                        较上期 +{timeStats.growth.totalRedemptions}%
                      </p>
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#A2E4FA" }}
                    >
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #A2C8FA20, #A2C8FA10)" }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">消耗积分</p>
                      <p className="text-2xl font-bold text-gray-900">{timeStats.current.totalPoints.toLocaleString()}</p>
                      <p className="text-xs" style={{ color: "#2563EB" }}>
                        较上期 +{timeStats.growth.totalPoints}%
                      </p>
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#A2C8FA" }}
                    >
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #A2FAF420, #A2FAF410)" }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">参与用户</p>
                      <p className="text-2xl font-bold text-gray-900">{timeStats.current.totalUsers}</p>
                      <p className="text-xs" style={{ color: "#059669" }}>
                        较上期 +{timeStats.growth.totalUsers}%
                      </p>
                    </div>
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#A2FAF4" }}
                    >
                      <span className="text-white font-bold text-sm">U</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Time Range Statistics */}
            <Card className="mb-6 border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" style={{ color: "#B4A2FA" }} />
                    时间段统计
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showTrends ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTrends(!showTrends)}
                      className={showTrends ? "text-white" : "border-gray-300 hover:bg-gray-50"}
                      style={showTrends ? { backgroundColor: "#B4A2FA" } : {}}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {showTrends ? "隐藏" : "显示"}趋势
                    </Button>
                    <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
                      <SelectTrigger className="w-40 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current-week">本周</SelectItem>
                        <SelectItem value="current">本月</SelectItem>
                        <SelectItem value="last-week">上周</SelectItem>
                        <SelectItem value="last-month">上月</SelectItem>
                        <SelectItem value="last-3-months">近3个月</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedTimeRange === "custom" && (
                  <div className="mb-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="startDate" className="text-sm text-gray-600">开始日期</Label>
                        <div className="relative mt-1">
                          <Input
                            id="startDate"
                            type="date"
                            value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                            className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                            placeholder="30/04/2024"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="endDate" className="text-sm text-gray-600">结束日期</Label>
                        <div className="relative mt-1">
                          <Input
                            id="endDate"
                            type="date"
                            value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                            className="border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                            placeholder="29/06/2024"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showTrends && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" style={{ color: "#B4A2FA" }} />
                      月度兑换趋势
                    </h4>
                    <div className="grid grid-cols-6 gap-4">
                      {Object.entries(timeRangeStats).map(([key, data]) => (
                        <div key={key} className="text-center">
                          <div className="mb-2">
                            <div
                              className="rounded-t"
                              style={{
                                backgroundColor: "#B4A2FA",
                                height: `${(data.totalRedemptions / 30) * 60}px`,
                                minHeight: "4px",
                              }}
                            ></div>
                            <div
                              className="rounded-b"
                              style={{
                                backgroundColor: "#A2E4FA",
                                height: `${(data.totalPoints / 45000) * 40}px`,
                                minHeight: "4px",
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600">{data.month.split("年")[1]}</p>
                          <p className="text-xs font-medium">{data.totalRedemptions}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: "#B4A2FA" }}></div>
                        <span>兑换次数</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: "#A2E4FA" }}></div>
                        <span>积分消耗(缩放)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Redemption Records */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>兑换记录</CardTitle>
                  <CardDescription>查看和管理所有兑换记录 ({filteredData.length} 条记录)</CardDescription>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={selectedRecords.length === 0}
                  className="text-white disabled:opacity-50"
                  style={{ backgroundColor: "#B4A2FA" }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出记录 ({selectedRecords.length})
                </Button>
              </CardHeader>
              <CardContent>
                {/* Filters and Search */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5" style={{ color: "#B4A2FA" }} />
                    <span className="font-medium text-gray-900">筛选和搜索</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索用户、兑换码或奖励..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        {statusOptions.slice(1).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={rewardTypeFilter} onValueChange={setRewardTypeFilter}>
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="奖励类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        {rewardTypeOptions.slice(1).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={handleSelectAll}
                      className="border-gray-300 hover:bg-gray-50 bg-transparent"
                    >
                      {selectedRecords.length === filteredRedemptions.length ? "取消全选" : "全选"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {paginatedData.map((record) => (
                    <div
                      key={record.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                        selectedRecords.includes(record.id)
                          ? "border-2 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      style={
                        selectedRecords.includes(record.id)
                          ? {
                              backgroundColor: "#B4A2FA10",
                              borderColor: "#B4A2FA",
                            }
                          : {}
                      }
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={record.userAvatar || "/placeholder.svg"} alt={record.userName} />
                        <AvatarFallback>{record.userName.slice(0, 2)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">{record.userName}</p>
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {record.department}
                          </Badge>
                          <Badge
                            className={`text-xs flex items-center gap-1`}
                            style={{
                              backgroundColor: getCustomStatusColor(record.status).bg,
                              color: getCustomStatusColor(record.status).text,
                              border: `1px solid ${getCustomStatusColor(record.status).border}`,
                            }}
                          >
                            {getStatusIcon(record.status)}
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>兑换码: {record.redeemCode}</span>
                          <span>•</span>
                          <span>{record.rewardType}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-medium text-gray-900">{record.rewardName}</p>
                        <p className="text-sm font-medium" style={{ color: "#B4A2FA" }}>
                          {record.pointsCost} 积分
                        </p>
                        <p className="text-xs text-gray-500">{record.redeemTime}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        显示 {startIndex + 1}-{Math.min(endIndex, filteredData.length)} 条，共 {filteredData.length} 条记录
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
                      <span className="text-sm text-gray-600">条/页</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1">
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
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 积分商城对话框 */}
            <Dialog open={showPointsMall} onOpenChange={setShowPointsMall}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    积分商城
                  </DialogTitle>
                  <DialogDescription>
                    使用您的积分兑换精美奖品
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {pointsProducts.map((product) => (
                    <Card key={product.id} className="relative overflow-hidden">
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <Gift className="h-16 w-16 text-gray-400" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg text-yellow-600">{product.points}</span>
                            <span className="text-sm text-gray-500">积分</span>
                          </div>
                          <Badge variant="secondary">{product.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500">库存: {product.stock}</span>
                          <span className={`text-sm ${product.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {product.isAvailable ? '有货' : '缺货'}
                          </span>
                        </div>
                        <Button
                          onClick={() => setSelectedProduct(product)}
                          disabled={!product.isAvailable || userPoints < product.points}
                          className="w-full"
                          variant={userPoints >= product.points ? "default" : "secondary"}
                        >
                          {userPoints >= product.points ? '立即兑换' : '积分不足'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* 兑换确认对话框 */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认兑换</DialogTitle>
                  <DialogDescription>
                    您确定要兑换以下商品吗？
                  </DialogDescription>
                </DialogHeader>

                {selectedProduct && (
                  <div className="py-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Gift className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedProduct.name}</h3>
                        <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-yellow-600">{selectedProduct.points} 积分</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span>当前积分:</span>
                        <span className="font-bold">{userPoints}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span>兑换消耗:</span>
                        <span className="font-bold text-red-600">-{selectedProduct.points}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span>剩余积分:</span>
                        <span className="font-bold">{userPoints - selectedProduct.points}</span>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                    取消
                  </Button>
                  <Button
                    onClick={() => selectedProduct && handleRedeem(selectedProduct)}
                    disabled={isRedeeming}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isRedeeming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        兑换中...
                      </>
                    ) : (
                      '确认兑换'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
