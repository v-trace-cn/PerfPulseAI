"use client"

import { useState, useEffect, useMemo } from "react"
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
import { useAuth } from "@/lib/auth-context-rq"
import { useCanViewAdminMenus } from "@/hooks"
import unifiedApi from "@/lib/unified-api"


// 积分商品数据






export default function RedemptionPage() {
  const { user } = useAuth();
  // 使用React Query检查权限
  const { data: permissionData, isLoading: permissionLoading } = useCanViewAdminMenus(user?.companyId?.toString())
  const canRedemption = permissionData?.data?.canRedemption || false
  const permChecked = !permissionLoading

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
  const [userPoints, setUserPoints] = useState(0) // 从后端获取用户积分
  const [redeemingProducts, setRedeemingProducts] = useState<Set<string>>(new Set())

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
  const [isRedeeming, setIsRedeeming] = useState(false)

  // HR 联系人（人力资源部第一个在职人员）
  const [hrContact, setHrContact] = useState<{ id: string; name: string; avatar?: string } | null>(null)

  // 清除任何可能的缓存错误状态
  useEffect(() => {
    setKeyValidation({ isValid: null, message: "" })
  }, [])

  // 真实兑换数据状态
  const [redemptionRecords, setRedemptionRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)

  // 积分商品数据状态
  const [pointsProducts, setPointsProducts] = useState<any[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // 统计数据状态
  const [timeRangeStats, setTimeRangeStats] = useState<any>({})
  const [statsLoading, setStatsLoading] = useState(false)

  // 获取兑换记录 - 改为公司级别数据
  const fetchRedemptionRecords = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const offset = (currentPage - 1) * pageSize
      const response = await fetch(`/api/mall/purchases/company?limit=${pageSize}&offset=${offset}`, {
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        const data = await response.json()
        // 转换后端数据格式为前端格式，现在包含公司所有成员的兑换记录
        const formattedRecords = data.purchases.map((item: any) => ({
          id: item.id,
          userId: item.userId,
          userName: item.userName || "未知用户", // 使用实际的用户名
          userAvatar: item.userAvatar || "/placeholder.svg?height=32&width=32",
          department: item.userDepartment || "未知部门", // 使用实际的部门信息
          redeemCode: item.redemptionCode || "无",
          rewardType: "积分商品",
          rewardName: item.itemName,
          pointsCost: item.pointsCost,
          status: getStatusText(item.status),
          redeemTime: new Date(item.createdAt).toLocaleString(),
          processTime: item.completedAt ? new Date(item.completedAt).toLocaleString() : "-"
        }))

        setRedemptionRecords(formattedRecords)
        setTotalRecords(data.totalCount)
      } else {
        console.error('获取公司兑换记录失败')
      }
    } catch (error) {
      console.error('获取公司兑换记录错误:', error)
    } finally {
      setLoading(false)
    }
  }

  // 转换状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '处理中'
      case 'COMPLETED':
        return '已发放'
      case 'CANCELLED':
        return '已取消'
      default:
        return '未知'
    }
  }

  // 获取用户积分
  const fetchUserPoints = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/points/summary', {
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserPoints(data.currentBalance || data.points || 0)
      } else {
        console.error('获取用户积分失败')
      }
    } catch (error) {
      console.error('获取用户积分错误:', error)
    }
  }

  // 获取积分商品
  const fetchPointsProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await fetch('/api/mall/items')

      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : (data.items || [])
        setPointsProducts(products.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          points: item.pointsCost || item.points || 0,
          category: item.category || '其他',
          image: item.image || "/placeholder.svg?height=200&width=200",
          stock: item.stock || 0,
          isAvailable: item.isAvailable !== false && item.stock > 0,
        })))
      } else {
        // 获取积分商品失败，设置为空数组
        setPointsProducts([])
      }
    } catch (error) {
      console.error('获取积分商品错误:', error)
      setPointsProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  // 获取统计数据 - 改为真实后端数据
  const fetchStatsData = async () => {
    if (!user?.id) return

    try {
      setStatsLoading(true)
      const response = await fetch('/api/mall/statistics/company?months=6', {
        headers: {
          'X-User-Id': String(user.id),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTimeRangeStats(data)
      } else {
        console.error('获取公司统计数据失败')
        // 如果获取失败，使用空数据
        setTimeRangeStats({})
      }
    } catch (error) {
      console.error('获取公司统计数据错误:', error)
      setTimeRangeStats({})
    } finally {
      setStatsLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchRedemptionRecords()
    fetchUserPoints()
    fetchPointsProducts()
    fetchStatsData()
  }, [user?.id, currentPage, pageSize])

	  // 获取人力资源部的第一个在职人员，作为密钥提交联系人
	  useEffect(() => {
	    const loadHrContact = async () => {
	      if (!user?.id) return;
	      try {
	        const deptRes = await unifiedApi.department.getAll(String(user.id), (user as any)?.companyId)
	        const depts = (deptRes as any)?.data || []
	        const hrDept = depts.find((d: any) => /人力|HR/i.test(d.name))
	        if (!hrDept) return
	        const memRes = await unifiedApi.department.getMembers(hrDept.id, String(user.id))
	        const members = (memRes as any)?.data || []
	        if (!members.length) return
	        const firstActive = members.find((m: any) => (m.performanceScore ?? m.overallPerformance ?? 0) > 0) || members[0]
	        setHrContact({ id: String(firstActive.id), name: firstActive.name, avatar: firstActive.avatar })
	      } catch (err) {
	        // 忽略联系人加载失败，不影响主流程
	      }
	    }
	    loadHrContact()
	  }, [user?.id, (user as any)?.companyId])


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

    // 标记当前商品为兑换中
    setRedeemingProducts(prev => new Set([...prev, product.id]));

    try {
      // 调用后端购买API
      const response = await fetch('/api/mall/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(user?.id || ''),
        },
        body: JSON.stringify({
          itemId: product.id,
          quantity: 1
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const redeemCode = data.redemptionCode || `GIFT${Date.now()}`;

        // 更新用户积分
        setUserPoints(prev => prev - product.points);

        // 刷新兑换记录（从后端获取最新数据）
        fetchRedemptionRecords();

        // 发送通知
        sendRedemptionNotification(redeemCode, product.name);

        toast({
          title: "兑换成功！",
          description: `您已成功兑换 ${product.name}`,
        });

        setSelectedProduct(null);
        setShowPointsMall(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "兑换失败",
          description: errorData.error || "兑换失败，请稍后重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "兑换失败",
        description: "系统错误，请稍后重试。",
        variant: "destructive",
      });
    } finally {
      // 移除兑换中状态
      setRedeemingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
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
          message: `您已成功兑换 ${productName}`,
          userId: user?.id || 1,
          data: {
            redeemCode,
            productName,
            points: selectedProduct?.points
          }
        }),
      });

      // 通知发送完成
    } catch (error) {
      // 通知发送失败，但不影响主流程
    }
  };

  // 过滤和分页逻辑 - 使用真实数据
  const filteredData = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return redemptionRecords.filter((record) => {
      const matchesSearch =
        record.userName.toLowerCase().includes(lowerSearchTerm) ||
        record.rewardName.toLowerCase().includes(lowerSearchTerm) ||
        record.redeemCode.toLowerCase().includes(lowerSearchTerm);

      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesType = rewardTypeFilter === "all" || record.rewardType === rewardTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [redemptionRecords, searchTerm, statusFilter, rewardTypeFilter]);

  // 分页计算 - 使用 useMemo 优化
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      totalPages,
      paginatedData: filteredData,
      startIndex,
      endIndex
    };
  }, [filteredData, currentPage, pageSize, totalRecords]);

  const { totalPages, paginatedData, startIndex, endIndex } = paginationData;

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

  // 验证并兑换密钥（合并功能）
  const handleRedeemKey = async () => {
    if (!redeemKey.trim()) {
      setKeyValidation({ isValid: false, message: "请输入兑换密钥" })
      return
    }

    if (isRedeeming) return // 防止重复点击

    try {
      setIsRedeeming(true)
      setKeyValidation({ isValid: null, message: "" })
      // 先验证密钥
      const verifyResponse = await fetch('/api/mall/verify-redemption-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(user?.id || ''),
        },
        body: JSON.stringify({
          redemption_code: redeemKey.trim()
        }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        setKeyValidation({
          isValid: false,
          message: error.error || "验证失败，请稍后重试",
        })
        return
      }

      const verifyData = await verifyResponse.json()
      if (!verifyData.valid) {
        setKeyValidation({
          isValid: false,
          message: verifyData.message || "密钥无效"
        })
        return
      }

      // 验证成功，直接执行兑换
      const redeemResponse = await fetch('/api/mall/redeem-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(user?.id || ''),
        },
        body: JSON.stringify({
          redemption_code: redeemKey.trim()
        }),
      })

      if (redeemResponse.ok) {
        const redeemData = await redeemResponse.json()
        toast({
          title: "兑换成功！",
          description: `成功兑换 ${verifyData.purchase_info?.itemName || "奖励"}`,
        })
        setRedeemKey("")
        setKeyValidation({ isValid: null, message: "" })
        // 刷新兑换记录
        fetchRedemptionRecords()
      } else {
        const error = await redeemResponse.json()
        toast({
          title: "兑换失败",
          description: error.error || "兑换失败，请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('兑换密钥失败:', error)
      setKeyValidation({
        isValid: false,
        message: "网络错误，请稍后重试",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const getTimeRangeKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  const getCurrentTimeRangeData = () => {
    const currentKey = getTimeRangeKey(new Date())
    return timeRangeStats[currentKey] || timeRangeStats["2024-06"] || {
      month: "当前月",
      totalRedemptions: 0,
      totalPoints: 0,
      totalUsers: 0
    }
  }

  const getTimeRangeStatsData = () => {
    const currentData = getCurrentTimeRangeData()
    const lastMonthKey = getTimeRangeKey(new Date(new Date().setMonth(new Date().getMonth() - 1)))
    const lastMonthData = timeRangeStats[lastMonthKey] || timeRangeStats["2024-05"] || {
      month: "上个月",
      totalRedemptions: 0,
      totalPoints: 0,
      totalUsers: 0
    }

    return {
      current: currentData,
      lastMonth: lastMonthData,
      growth: {
        totalRedemptions: lastMonthData.totalRedemptions > 0 ? (
          ((currentData.totalRedemptions - lastMonthData.totalRedemptions) / lastMonthData.totalRedemptions) *
          100
        ).toFixed(1) : currentData.totalRedemptions > 0 ? '100' : '0',
        totalPoints: lastMonthData.totalPoints > 0 ? (
          ((currentData.totalPoints - lastMonthData.totalPoints) / lastMonthData.totalPoints) *
          100
        ).toFixed(1) : currentData.totalPoints > 0 ? '100' : '0',
        totalUsers: lastMonthData.totalUsers > 0 ? (
          ((currentData.totalUsers - lastMonthData.totalUsers) / lastMonthData.totalUsers) * 100
        ).toFixed(1) : currentData.totalUsers > 0 ? '100' : '0',
      },
    }
  }

  const handleExport = () => {
    const selectedData = redemptionRecords.filter((record) => selectedRecords.includes(record.id))
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
          {!permChecked ? (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>













                  </CardTitle>
                  <CardDescription>


                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : !canRedemption ? (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>













                    无权限
                  </CardTitle>
                  <CardDescription>
                    仅超级管理员或已被授权的用户可访问兑奖管理。
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (

          <div className="p-6">
            {/* Page Title */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Gift className="h-6 w-6" style={{ color: "#B4A2FA" }} />
                  兑奖管理
                </h1>

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
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      id="redeemKey"
                      placeholder="请输入兑换密钥..."
                      value={redeemKey}
                      onChange={(e) => setRedeemKey(e.target.value)}
                      className="mt-1 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleRedeemKey}
                      disabled={isRedeeming || !redeemKey.trim()}
                      className="text-white disabled:opacity-50"
                      style={{ backgroundColor: "#B4A2FA" }}
                    >
                      {isRedeeming ? "兑换中..." : "兑换密钥"}
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
                      <p className="text-sm text-gray-600">奖品总数</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
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
                      {Object.entries(timeRangeStats).map(([key, data]: [string, any]) => (
                        <div key={key} className="text-center">
                          <div className="mb-2">
                            <div
                              className="rounded-t"
                              style={{
                                backgroundColor: "#B4A2FA",
                                height: `${((data?.totalRedemptions || 0) / 30) * 60}px`,
                                minHeight: "4px",
                              }}
                            ></div>
                            <div
                              className="rounded-b"
                              style={{
                                backgroundColor: "#A2E4FA",
                                height: `${((data?.totalPoints || 0) / 45000) * 40}px`,
                                minHeight: "4px",
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600">{data?.month?.split("年")[1] || key}</p>
                          <p className="text-xs font-medium">{data?.totalRedemptions || 0}</p>
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
                      {selectedRecords.length === filteredData.length ? "取消全选" : "全选"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-gray-600">加载兑换记录中...</p>
                    </div>
                  ) : paginatedData.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Gift className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">暂无兑换记录</p>
                      <p className="text-sm">当前筛选条件下没有找到相关记录</p>
                    </div>
                  ) : (
                    paginatedData.map((record) => (
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
                    ))
                  )}
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        显示 {startIndex + 1}-{Math.min(endIndex, filteredData.length)} 条
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
                          disabled={!product.isAvailable || userPoints < product.points || redeemingProducts.has(product.id)}
                          className="w-full"
                          variant={userPoints >= product.points ? "default" : "secondary"}
                        >
                          {redeemingProducts.has(product.id) ? '兑换中...' :
                           userPoints >= product.points ? '立即兑换' : '积分不足'}
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
                    disabled={selectedProduct && redeemingProducts.has(selectedProduct.id)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {selectedProduct && redeemingProducts.has(selectedProduct.id) ? (
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
          )}
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
