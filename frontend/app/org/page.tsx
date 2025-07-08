"use client"

import React, { useState, useEffect } from "react"
import {
  Building,
  Users,
  BarChart2,
  Settings,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Users2,
  Briefcase,
  Star,
  TrendingUp,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DepartmentSettings } from "@/components/organization/DepartmentSettings"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { unifiedApi } from "@/lib/unified-api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Department } from "@/lib/types" // 导入 Department 类型
import Link from "next/link"

const employees = [
  {
    id: "e1",
    name: "关键先生",
    role: "首席架构师",
    department: "研发部",
    performance: 98,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "e2",
    name: "增长黑客",
    role: "增长负责人",
    department: "市场部",
    performance: 97,
    avatar: "/placeholder-user.jpg",
  },
  {
    id: "e3",
    name: "像素魔术师",
    role: "高级UI/UX设计师",
    department: "产品部",
    performance: 96,
    avatar: "/placeholder-user.jpg",
  },
]

export default function OrganizationManagement() {
  console.log("OrganizationManagement component rendered."); // 新增：组件渲染日志
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [isAddDeptDialogOpen, setAddDeptDialogOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient();

  // 使用 useQuery 获取部门数据
  const { data, isLoading, error } = useQuery<{ data: Department[]; message: string; success: boolean }>({
    queryKey: ['departments'],
    queryFn: unifiedApi.department.getAll,
  });

  // 新增：打印 useQuery 的状态和数据
  useEffect(() => {
    console.log("useQuery data:", data);
    console.log("useQuery isLoading:", isLoading);
    console.log("useQuery error:", error);

    if (error) {
      toast({
        title: "错误",
        description: error.message || "获取部门数据失败",
        variant: "destructive",
      });
    } else if (
      data &&
      typeof data === 'object' && // 确保 data 是一个对象
      'success' in data &&        // 确保 'success' 属性存在
      !data.success               // 检查 success 是否为 false
    ) {
      toast({
        title: "错误",
        description: data.message || "获取部门数据失败",
        variant: "destructive",
      });
    }
  }, [data, isLoading, error, toast]); // 确保所有依赖项都包含在内

  const departments = data?.data?.map(d => ({
    id: String(d.id),
    name: d.name,
    manager: "", // 假设后端不返回经理信息，或者根据实际情况调整
    memberCount: d.memberCount || 0, // 使用后端返回的 memberCount
    activeMembersCount: d.activeMembersCount || 0, // 使用后端返回的 activeMembersCount
    performance: 0, // 假设后端不返回绩效分，或者根据实际情况调整
    projects: 0, // 假设后端不返回项目数，或者根据实际情况调整
    status: "active", // 假设新创建的部门默认为活跃状态
    teams: [], // 假设后端不返回团队信息，或者根据实际情况调整
  })) || [];

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // 新增部门的 mutation
  const createDepartmentMutation = useMutation({
    mutationFn: unifiedApi.department.create,
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        });
        setNewDeptName("");
        setAddDeptDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['departments'] }); // 触发部门列表重新获取
      } else {
        toast({
          title: "错误",
          description: res.message || "创建部门失败",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("创建部门失败:", error);
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后重试。",
        variant: "destructive",
      });
    },
  });

  const handleAddNewDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        title: "错误",
        description: "部门名称不能为空！",
        variant: "destructive",
      });
      return;
    }
    createDepartmentMutation.mutate(newDeptName);
  };

  // 删除部门的 mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: unifiedApi.department.delete,
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['departments'] }); // 触发部门列表重新获取
      } else {
        toast({
          title: "错误",
          description: res.message || "删除部门失败",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("删除部门失败:", error);
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后重试。",
        variant: "destructive",
      });
    },
  });

  const handleDeleteDepartment = (departmentId: string) => {
    deleteDepartmentMutation.mutate(departmentId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h3 className="text-3xl font-bold tracking-tight flex items-center">
              <Building className="mr-3 h-8 w-8 text-gray-700" />
              组织管理
            </h3>
          </div>
          <div className="flex items-center space-x-2">
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总部门数</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-xs text-muted-foreground">+2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总员工数</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.reduce((sum, d) => sum + d.memberCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均绩效</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  departments.reduce((sum, d) => sum + d.performance, 0) /
                  (departments.length || 1) // 避免除以零
                ).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">+19% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃项目</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {departments.reduce((sum, d) => sum + d.projects, 0)}
              </div>
              <p className="text-xs text-muted-foreground">+201 since last hour</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-4">
          <div className="lg:col-span-2 xl:col-span-3">
            <Card>
              <div className="flex flex-row items-center justify-start p-6 space-x-4">
                <CardTitle className="text-2xl font-bold">部门列表</CardTitle>
                <Dialog open={isAddDeptDialogOpen} onOpenChange={setAddDeptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-7 px-2" onClick={() => console.log("新增部门按钮被点击")} >
                      <Plus className="mr-1 h-3 w-3" />
                      新增部门
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新增部门</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          部门名称
                        </Label>
                        <Input
                          id="name"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                      </DialogClose>
                      <Button onClick={handleAddNewDepartment} disabled={createDepartmentMutation.isPending}>
                        {createDepartmentMutation.isPending ? "创建中..." : "创建"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]"></TableHead>
                      <TableHead>部门名称</TableHead>
                      <TableHead>经理</TableHead>
                      <TableHead>成员数</TableHead>
                      <TableHead>活跃员工</TableHead>
                      <TableHead>绩效分</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          加载部门数据...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-red-500">
                          加载部门数据失败: {error.message}
                        </TableCell>
                      </TableRow>
                    ) : departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                          没有找到部门。
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((department) => (
                        <React.Fragment key={department.id}>
                          <TableRow>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(department.id)}
                                className="h-8 w-8 p-0"
                              >
                                {expanded[department.id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                href={`/org/details`}
                                onClick={() => localStorage.setItem('currentDepartmentId', department.id)}
                                className="hover:underline"
                              >
                                {department.name}
                              </Link>
                            </TableCell>
                            <TableCell>{department.manager || "N/A"}</TableCell>
                            <TableCell>{department.memberCount}</TableCell>
                            <TableCell>{department.activeMembersCount}</TableCell>
                            <TableCell>{department.performance}</TableCell>
                            <TableCell>
                              <Badge variant={department.status === "active" ? "default" : "secondary"}>
                                {department.status === "active" ? "活跃" : "归档"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/org/details`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="mr-2"
                                  onClick={() => localStorage.setItem('currentDepartmentId', department.id)}
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="mr-2">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DepartmentSettings department={department} />
                                </DialogContent>
                              </Dialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDepartment(department.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          {expanded[department.id] && (
                            <TableRow>
                              <TableCell colSpan={8} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {department.teams.length > 0 ? (
                                    department.teams.map((team, index) => (
                                      <Card key={index}>
                                        <CardHeader>
                                          <CardTitle>{team.name}</CardTitle>
                                          <CardDescription>负责人: {team.lead}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                          <p>成员: {team.members}</p>
                                        </CardContent>
                                      </Card>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">暂无团队信息。</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>明星员工</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{employee.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {employee.performance}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
