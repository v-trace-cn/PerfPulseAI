"use client"

import React, { useState } from "react"
import {
  Shield,
  Search,
  ChevronDown,
  Edit,
  Settings,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useAuthDialog } from "@/lib/auth-dialog-context"
// 模拟权限数据
const permissionsData = [
  {
    id: 1,
    name: "用户管理",
    description: "创建、编辑、删除用户账户",
    category: "数据管理",
    manager: "张三",
    groupCount: 4,
    status: "启用"
  },
  {
    id: 2,
    name: "系统设置",
    description: "修改系统配置和参数",
    category: "数据管理",
    manager: "王五",
    groupCount: 2,
    status: "启用"
  },
  {
    id: 3,
    name: "审计日志",
    description: "查看系统操作日志",
    category: "数据管理",
    manager: "张三",
    groupCount: 3,
    status: "启用"
  },
  {
    id: 4,
    name: "数据备份",
    description: "查看业务数据备份",
    category: "数据管理",
    manager: "王五",
    groupCount: 2,
    status: "启用"
  },
  {
    id: 5,
    name: "数据导入",
    description: "创建和导入业务数据",
    category: "数据管理",
    manager: "王五",
    groupCount: 5,
    status: "启用"
  },
  {
    id: 6,
    name: "数据删除",
    description: "删除业务数据",
    category: "数据管理",
    manager: "张三",
    groupCount: 3,
    status: "启用"
  },
  {
    id: 7,
    name: "数据导出",
    description: "导出业务数据",
    category: "数据管理",
    manager: "张三",
    groupCount: 2,
    status: "启用"
  }
]

export default function PermissionsManagement() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { openLoginDialog } = useAuthDialog()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("全部分类")
  const [selectedStatus, setSelectedStatus] = useState("全部状态")
  const [selectedManager, setSelectedManager] = useState("全部管理人")

  // 如果正在加载认证状态，显示加载界面
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">正在验证用户身份...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <CardTitle>需要登录</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" onClick={openLoginDialog}>
                  前往登录
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // 过滤权限数据
  const filteredPermissions = permissionsData.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "全部分类" || permission.category === selectedDepartment
    const matchesStatus = selectedStatus === "全部状态" || permission.status === selectedStatus
    const matchesManager = selectedManager === "全部管理人" || permission.manager === selectedManager

    return matchesSearch && matchesDepartment && matchesStatus && matchesManager
  })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-8">
        {/* 页面标题 */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h3 className="text-3xl font-bold tracking-tight flex items-center">
              <Shield className="mr-3 h-8 w-8 text-gray-700" />
              权限管理
            </h3>
          </div>
        </header>

        {/* 搜索和筛选区域 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索权限名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 筛选下拉框 */}
              <div className="flex gap-2">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部分类">全部分类</SelectItem>
                    <SelectItem value="数据管理">数据管理</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部状态">全部状态</SelectItem>
                    <SelectItem value="启用">启用</SelectItem>
                    <SelectItem value="禁用">禁用</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部管理人">全部管理人</SelectItem>
                    <SelectItem value="张三">张三</SelectItem>
                    <SelectItem value="王五">王五</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 权限列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>权限名称</TableHead>
                  <TableHead>权限描述</TableHead>
                  <TableHead>权限分类</TableHead>
                  <TableHead>管理人</TableHead>
                  <TableHead>分配组数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell>{permission.category}</TableCell>
                    <TableCell>{permission.manager}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {permission.groupCount} 个组织
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={permission.status === "启用" ? "default" : "secondary"}
                        className={permission.status === "启用" ? "bg-green-100 text-green-800" : ""}
                      >
                        {permission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}