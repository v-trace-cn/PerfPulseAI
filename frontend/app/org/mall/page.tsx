"use client"

import React, { useEffect, useState } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Gift,
  Package,
  Warehouse,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Copy,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  Settings,
  History,
  AlertTriangle,
  TrendingUp,
  Zap,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

import { useAuth } from "@/lib/auth-context-rq"
import { useToast } from "@/components/ui/use-toast"
import { exportMallItems } from "@/lib/mall-hooks"
import {
  useMallAdminItems,
  useCreateMallItem,
  useUpdateMallItem,
  useDeleteMallItem,
  useUpdateStock,
  type CreateMallItemRequest,
  type UpdateStockRequest
} from "@/lib/mall-hooks"
import {
  useAdminMenuPermission,
  canAccessAdminMenu,
} from "@/hooks"

// 类型定义
interface MallProduct {
  id: string
  name: string
  category: string
  points_cost: number
  stock: number
  is_available: boolean
  sales?: number
  lastUpdated?: string
}

export default function MallManagement() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddPromotionOpen, setIsAddPromotionOpen] = useState(false)
  const [isBatchOperationOpen, setIsBatchOperationOpen] = useState(false)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false)
  const [isStockSettingsOpen, setIsStockSettingsOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [filterCategory, setFilterCategory] = useState("all")
  const [restockQuantities, setRestockQuantities] = useState<{[key: string]: number}>({})
  const [searchTerm, setSearchTerm] = useState("")

  // 新商品表单状态
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    points_cost: 0,
    stock: 0,
    description: '',
    is_available: true
  })

  const { user } = useAuth()
  const { toast } = useToast()

  // 使用React Query检查权限
  const { data: permissionData, isLoading: permissionLoading } = useAdminMenuPermission(user?.companyId?.toString())
  const canMall = canAccessAdminMenu(permissionData, 'mall')
  const permChecked = !permissionLoading

  // 使用极简 React Query hooks
  const { data: products = [], isLoading } = useMallAdminItems()
  const createMutation = useCreateMallItem()
  const updateMutation = useUpdateMallItem()
  const deleteMutation = useDeleteMallItem()
  const updateStockMutation = useUpdateStock()

  // 处理创建商品
  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.category || newProduct.points_cost <= 0) {
      toast({
        title: "表单验证失败",
        description: "请填写完整的商品信息",
        variant: "destructive"
      })
      return
    }

    createMutation.mutate(newProduct, {
      onSuccess: () => {
        setIsAddProductOpen(false)
        setNewProduct({
          name: '',
          category: '',
          points_cost: 0,
          stock: 0,
          description: '',
          is_available: true
        })
      }
    })
  }

  // 数据转换：将API数据转换为组件需要的格式
  const transformedProducts: MallProduct[] = products.map((item: any) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    points_cost: item.points_cost,
    stock: item.stock,
    is_available: item.is_available,
    sales: 0, // 暂时设为0，后续可以从API获取
    lastUpdated: item.updated_at || new Date().toISOString().split('T')[0]
  }))

  // TODO: 实现促销活动的React Query hooks
  const promotions: any[] = []

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    setSelectedProducts(selectedProducts.length === transformedProducts.length ? [] : transformedProducts.map((p: MallProduct) => p.id))
  }

  // 处理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // 处理导出数据 - 极简实现
  const handleExportData = async () => {
    try {
      await exportMallItems('csv')
      toast({
        title: "导出成功",
        description: "商品数据已导出到CSV文件",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出过程中发生错误",
        variant: "destructive",
      })
    }
  }

  // 处理批量导入 - 使用文件上传
  const handleBatchImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // TODO: 实现批量导入API
        toast({
          title: "功能开发中",
          description: "批量导入功能正在开发中",
        })
      }
    }
    input.click()
  }

  // 处理库存补货 - 极简实现
  const handleRestock = async (productId: string) => {
    const quantity = restockQuantities[productId] || 0
    if (quantity > 0) {
      updateStockMutation.mutate({
        itemId: productId,
        data: { stock_change: quantity, reason: '手动补货' }
      })
      setRestockQuantities(prev => ({ ...prev, [productId]: 0 }))
    }
  }

  // 更新补货数量
  const updateRestockQuantity = (productId: string, quantity: number) => {
    setRestockQuantities(prev => ({ ...prev, [productId]: quantity }))
  }

  // 处理刷新库存
  const handleRefreshStock = () => {
    console.log("刷新库存数据")
    // 这里可以实现从后端重新获取库存数据的逻辑
  }

  // 批量操作处理函数
  const handleBatchOperation = (operation: string) => {
    console.log(`执行批量操作: ${operation}，选中商品:`, selectedProducts)
    switch (operation) {
      case "上架":
        console.log("批量上架商品")
        break
      case "下架":
        console.log("批量下架商品")
        break
      case "编辑价格":
        console.log("批量编辑价格")
        break
      case "删除":
        console.log("批量删除商品")
        break
    }
    setIsBatchOperationOpen(false)
    setSelectedProducts([]) // 清空选择
  }

  // 过滤和排序商品
  const filteredProducts = transformedProducts.filter((product: MallProduct) => {
    const matchesCategory = filterCategory === "all" || product.category === filterCategory
    const matchesSearch = searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a: MallProduct, b: MallProduct) => {
    const aValue = a[sortBy as keyof MallProduct] || 0
    const bValue = b[sortBy as keyof MallProduct] || 0
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="flex flex-col min-h-screen bg-gray-50/90">
          {!permChecked ? (
            <div className="flex-1 p-8">加载中...</div>
          ) : !canMall ? (
            <div className="flex-1 p-8">
              <Card>
                <CardHeader>
                  <CardTitle>无权限</CardTitle>
                  <CardDescription>仅超级管理员或被授权用户可访问商城管理。</CardDescription>
                </CardHeader>
              </Card>
            </div>
          ) : (
          <main className="flex-1 p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/org">
                  <Button variant="outline" size="icon" aria-label="返回组织管理">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">商城管理</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleExportData}>
                  <Download className="mr-2 h-4 w-4" />
                  导出数据
                </Button>
                <Button variant="outline" size="sm" onClick={() => console.log("查看操作日志")}>
                  <History className="mr-2 h-4 w-4" />
                  操作日志
                </Button>
                <Button variant="outline" size="sm" onClick={() => console.log("打开系统设置")}>
                  <Settings className="mr-2 h-4 w-4" />
                  系统设置
                </Button>
              </div>
            </header>

            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  商品管理
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4" />
                  库存管理
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  限时福利
                </TabsTrigger>
              </TabsList>

              {/* 商品管理 */}
              <TabsContent value="products" className="space-y-6">
                {/* 操作工具栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="搜索商品..."
                        className="pl-10 w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="筛选分类" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="all">全部分类</SelectItem>
                        <SelectItem value="电子产品">电子产品</SelectItem>
                        <SelectItem value="餐饮券">餐饮券</SelectItem>
                        <SelectItem value="服装鞋帽">服装鞋帽</SelectItem>
                        <SelectItem value="购物卡">购物卡</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedProducts.length > 0 && (
                      <Button variant="outline" onClick={() => setIsBatchOperationOpen(true)}>
                        <CheckSquare className="w-4 h-4 mr-2" />
                        批量操作 ({selectedProducts.length})
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleBatchImport}>
                      <Upload className="w-4 h-4 mr-2" />
                      批量导入
                    </Button>
                    <Button onClick={() => setIsAddProductOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加商品
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>商品列表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedProducts.length === products.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>商品名称</TableHead>
                          <TableHead>分类</TableHead>
                          <TableHead>积分价格</TableHead>
                          <TableHead>库存</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>最后更新</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={() => handleSelectProduct(product.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.points.toLocaleString()} 积分</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.stock}
                                {product.stock < 10 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              {/* <Badge variant={product.is_available ? "default" : "secondary"}>
                                {product.is_available ? "上架" : "下架"}
                              </Badge> */}
                              <div className="flex items-center space-x-2">
                              <Switch id="quick-status" defaultChecked />
                              <Label htmlFor="quick-status">商品状态（上架/下架）</Label>
                             </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{product.lastUpdated}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {/* <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    查看详情
                                  </DropdownMenuItem> */}
                                  <DropdownMenuItem onClick={() => setIsQuickEditOpen(true)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    快速编辑
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    查看兑换数据
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    删除商品
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 库存管理 */}
              <TabsContent value="inventory" className="space-y-6">
                {/* 库存概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">总商品数</p>
                          <p className="text-xl font-bold">{products.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-600">库存不足</p>
                          <p className="text-xl font-bold text-red-600">{transformedProducts.filter((p: MallProduct) => p.stock < 10).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-600">库存充足</p>
                          <p className="text-xl font-bold text-green-600">{transformedProducts.filter((p: MallProduct) => p.stock >= 10).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600">总库存值</p>
                          <p className="text-xl font-bold">{transformedProducts.reduce((sum: number, p: MallProduct) => sum + p.stock, 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 库存操作工具栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleRefreshStock}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      刷新库存
                    </Button>
                    <Button variant="outline" onClick={() => setIsStockSettingsOpen(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      库存预警设置
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => console.log("导出库存报告")}>
                      <Download className="w-4 h-4 mr-2" />
                      导出库存报告
                    </Button>
                    <Button onClick={() => console.log("批量补货")}>
                      <Zap className="w-4 h-4 mr-2" />
                      批量补货
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>库存管理</CardTitle>
                    <CardDescription>监控和管理商品库存</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transformedProducts.map((product: MallProduct) => (
                        <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                            {product.stock < 10 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                库存不足
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">库存: {product.stock}</p>
                              <p className={`text-sm ${product.stock < 10 ? "text-red-500" : "text-green-500"}`}>
                                {product.stock < 10 ? "需要补货" : "库存充足"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="补货数量"
                                className="w-24"
                                min="1"
                                value={restockQuantities[product.id] || ""}
                                onChange={(e) => updateRestockQuantity(product.id, parseInt(e.target.value) || 0)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestock(product.id)}
                                disabled={!restockQuantities[product.id] || restockQuantities[product.id] <= 0}
                              >
                                补货
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 限时福利 */}
              <TabsContent value="promotions" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">限时福利管理</h3>
                    <p className="text-sm text-gray-500">创建和管理促销活动</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => console.log("打开活动模板")}>
                      <Copy className="w-4 h-4 mr-2" />
                      活动模板
                    </Button>
                    <Button variant="outline" onClick={() => console.log("查看效果分析")}>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      效果分析
                    </Button>
                    <Button onClick={() => setIsAddPromotionOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      创建福利
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6">
                  {promotions.map((promotion) => (
                    <Card key={promotion.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Gift className="w-5 h-5" />
                              {promotion.name}
                            </CardTitle>
                            <CardDescription>{promotion.type}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={promotion.status === "进行中" ? "default" : "secondary"}>
                              {promotion.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  编辑活动
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="w-4 h-4 mr-2" />
                                  复制活动
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <TrendingUp className="w-4 h-4 mr-2" />
                                  查看数据
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {promotion.status === "进行中" ? (
                                  <DropdownMenuItem>
                                    <Square className="w-4 h-4 mr-2" />
                                    暂停活动
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem>
                                    <Zap className="w-4 h-4 mr-2" />
                                    启动活动
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  删除活动
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">优惠力度</p>
                            <p className="font-medium">{promotion.discount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">开始时间</p>
                            <p className="font-medium">{promotion.startDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">结束时间</p>
                            <p className="font-medium">{promotion.endDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">适用商品</p>
                            <p className="font-medium">{promotion.appliedProducts} 个</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">总销量</p>
                            <p className="font-medium">{promotion.totalSales}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Package className="w-4 h-4 mr-1" />
                              管理商品
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* 添加商品对话框 */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>添加新商品</DialogTitle>
                  <DialogDescription>填写商品信息以添加到积分商城</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">商品名称</Label>
                      <Input
                        id="name"
                        placeholder="输入商品名称"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">商品分类</Label>
                      <Select value={newProduct.category} onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="电子产品">电子产品</SelectItem>
                          <SelectItem value="餐饮券">餐饮券</SelectItem>
                          <SelectItem value="服装鞋帽">服装鞋帽</SelectItem>
                          <SelectItem value="购物卡">购物卡</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="points">积分价格</Label>
                      <Input
                        id="points"
                        type="number"
                        placeholder="输入积分价格"
                        value={newProduct.points_cost || ''}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, points_cost: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">初始库存</Label>
                      <Input
                        id="stock"
                        type="number"
                        placeholder="输入库存数量"
                        value={newProduct.stock || ''}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">商品描述</Label>
                    <Textarea
                      id="description"
                      placeholder="输入商品描述"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="status"
                      checked={newProduct.is_available}
                      onCheckedChange={(checked) => setNewProduct(prev => ({ ...prev, is_available: checked }))}
                    />
                    <Label htmlFor="status">立即上架</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleCreateProduct}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? '创建中...' : '添加商品'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 批量操作对话框 */}
            <Dialog open={isBatchOperationOpen} onOpenChange={setIsBatchOperationOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>批量操作</DialogTitle>
                  <DialogDescription>对选中的 {selectedProducts.length} 个商品执行批量操作</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 bg-transparent"
                      onClick={() => handleBatchOperation("上架")}
                    >
                      <CheckSquare className="w-6 h-6" />
                      批量上架
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 bg-transparent"
                      onClick={() => handleBatchOperation("下架")}
                    >
                      <Square className="w-6 h-6" />
                      批量下架
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 bg-transparent"
                      onClick={() => handleBatchOperation("编辑价格")}
                    >
                      <Edit className="w-6 h-6" />
                      批量编辑价格
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex-col gap-2 bg-transparent text-red-600 hover:text-red-700"
                      onClick={() => handleBatchOperation("删除")}
                    >
                      <Trash2 className="w-6 h-6" />
                      批量删除
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBatchOperationOpen(false)}>
                    取消
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 快速编辑对话框 */}
            <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>快速编辑</DialogTitle>
                  <DialogDescription>快速修改商品的基本信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quick-name">商品名称</Label>
                      <Input id="quick-name" type="text" placeholder="输入商品名称" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick-category">分类</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="electronics">电子产品</SelectItem>
                          <SelectItem value="food">餐饮券</SelectItem>
                          <SelectItem value="clothing">服装鞋帽</SelectItem>
                          <SelectItem value="gift-card">购物卡</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick-points">积分价格</Label>
                      <Input id="quick-points" type="number" defaultValue="0" placeholder="输入积分价格" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quick-stock">初始库存数量</Label>
                      <Input id="quick-stock" type="number" defaultValue="0" placeholder="输入库存数量" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="quick-status" defaultChecked />
                    <Label htmlFor="quick-status">商品状态（上架/下架）</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsQuickEditOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setIsQuickEditOpen(false)}>保存修改</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 库存预警设置对话框 */}
            <Dialog open={isStockSettingsOpen} onOpenChange={setIsStockSettingsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>库存预警设置</DialogTitle>
                  <DialogDescription>设置库存预警规则和自动补货</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="warning-threshold">库存预警阈值</Label>
                    <Input id="warning-threshold" type="number" defaultValue="10" placeholder="当库存低于此数值时预警" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto-restock">自动补货数量</Label>
                    <Input id="auto-restock" type="number" defaultValue="50" placeholder="自动补货时的数量" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enable-auto-restock" />
                    <Label htmlFor="enable-auto-restock">启用自动补货</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enable-email-alert" />
                    <Label htmlFor="enable-email-alert">启用邮件提醒</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsStockSettingsOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setIsStockSettingsOpen(false)}>保存设置</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* 创建福利对话框 */}
            <Dialog open={isAddPromotionOpen} onOpenChange={setIsAddPromotionOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建限时福利</DialogTitle>
                  <DialogDescription>设置促销活动以吸引用户兑换</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-name">活动名称</Label>
                      <Input id="promo-name" placeholder="输入活动名称" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-type">活动类型</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="discount">限时折扣</SelectItem>
                          <SelectItem value="member">会员福利</SelectItem>
                          <SelectItem value="clearance">库存清理</SelectItem>
                          <SelectItem value="flash">闪购活动</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">开始时间</Label>
                      <Input id="start-date" type="datetime-local" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">结束时间</Label>
                      <Input id="end-date" type="datetime-local" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">优惠力度</Label>
                    <Input id="discount" placeholder="例如：8折、减500积分、买一送一" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-products">适用商品</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="选择适用商品范围" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="all">全部商品</SelectItem>
                        <SelectItem value="category">指定分类</SelectItem>
                        <SelectItem value="specific">指定商品</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promo-description">活动描述</Label>
                    <Textarea id="promo-description" placeholder="输入活动详细描述和规则" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-start" />
                    <Label htmlFor="auto-start">立即启动活动</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPromotionOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setIsAddPromotionOpen(false)}>创建活动</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main> 
        )}
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
