"use client"

import React, { useState, useEffect } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import {
  Building,
  Users,
  BarChart2,
  Settings,
  MoreVertical,
  Plus,
  Search,
  Users2,
  Briefcase,
  Star,
  TrendingUp,
  Trash2,
  Link as LinkIcon,
  LogOut,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { unifiedApi } from "@/lib/unified-api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Department } from "@/lib/types" // 导入 Department 类型
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useAuthDialog } from "@/lib/auth-dialog-context"

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

  // 所有hooks必须在组件顶层调用
  const [isAddDeptDialogOpen, setAddDeptDialogOpen] = useState(false)
  const [newDeptName, setNewDeptName] = useState("")
  const [isAssociateCompanyDialogOpen, setAssociateCompanyDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [isChangeCompanyDialogOpen, setChangeCompanyDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<any>(null)
  const [inviteCodeDialogOpen, setInviteCodeDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [inviteCodeVerified, setInviteCodeVerified] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { openLoginDialog } = useAuthDialog()

  // 邀请码验证函数
  const handleInviteCodeVerification = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "错误",
        description: "请输入邀请码",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await unifiedApi.auth.verifyInviteCode(inviteCode);
      if (response.success && response.data?.valid) {
        setInviteCodeVerified(true);
        setInviteCodeDialogOpen(false);
        toast({
          title: "验证成功",
          description: "邀请码验证通过，您现在可以访问组织管理功能",
          variant: "default",
        });
      } else {
        toast({
          title: "验证失败",
          description: "邀请码无效，请检查后重试",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "验证错误",
        description: error.message || "验证邀请码时发生错误",
        variant: "destructive",
      });
    }
  };

  // 使用 useQuery 获取组织数据 - 只有在用户登录且有公司ID时才执行
  const { data, isLoading, error } = useQuery({
    queryKey: ['departments', user?.id, user?.companyId],
    queryFn: () => {
      console.log('🏢 组织管理 - 准备调用API');
      console.log('🏢 用户信息:', {
        userId: user?.id,
        companyId: user?.companyId,
        authLoading,
        userExists: !!user,
        isAuthenticated
      });

      if (!user?.id) {
        console.error('🏢 用户ID不存在，无法调用API');
        throw new Error('用户ID不存在');
      }

      console.log('🏢 开始调用 department.getAll API，用户ID:', user.id);
      return unifiedApi.department.getAll(user.id.toString());
    },
    enabled: !authLoading, // 简化条件：只要认证完成就尝试调用
    retry: 1, // 减少重试次数便于调试
  });

  // 获取用户创建的公司列表
  const { data: companiesData } = useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: () => unifiedApi.company.getAll(user?.id || ''),
    enabled: !!user?.id && isAuthenticated,
  })

  const userCreatedCompanies = companiesData?.data || []

  // 调试信息
  console.log('🏢 公司数据调试:', {
    companiesData,
    userCreatedCompanies,
    userInfo: { id: user?.id, companyId: user?.companyId }
  })

  // 新增部门的 mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (departmentData: { name: string }) => {
      console.log('🏗️ 创建部门，数据:', departmentData);
      console.log('🏗️ 用户信息:', { userId: user?.id, companyId: user?.companyId });

      // 检查用户是否加入了公司
      if (!user?.companyId) {
        throw new Error('您必须先加入公司才能创建组织');
      }

      // 部门必须关联到用户当前的公司
      const departmentWithCompany = {
        ...departmentData,
        companyId: user.companyId
      };

      return unifiedApi.department.create(departmentWithCompany, user?.id || '');
    },
    onSuccess: (res) => {
      console.log('🏗️ 创建部门成功:', res);
      if (res.success) {
        toast({
          title: "成功",
          description: res.message || "组织创建成功",
          variant: "default",
        });
        setNewDeptName("");
        setAddDeptDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['departments'] });
      } else {
        toast({
          title: "错误",
          description: res.message || "创建组织失败",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('🏗️ 创建部门失败:', error);
      toast({
        title: "错误",
        description: error.message || "创建组织失败",
        variant: "destructive",
      });
    },
  });

  // 删除部门的 mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => unifiedApi.department.delete(id, user?.id ? user.id.toString() : ''),
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
    onError: (error) => {
      console.error("删除部门失败:", error);
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后重试。",
        variant: "destructive",
      });
    },
  });

  // 更换部门公司的 mutation
  const changeDepartmentCompanyMutation = useMutation({
    mutationFn: ({ departmentId, companyId }: { departmentId: string; companyId: number }) => {
      return unifiedApi.department.update(departmentId, { companyId }, user?.id || '');
    },
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: "组织公司关联已更新",
          variant: "default",
        });
        setChangeCompanyDialogOpen(false);
        setSelectedDepartment(null);
        setSelectedCompanyId(null);
        queryClient.invalidateQueries({ queryKey: ['departments'] });
      } else {
        toast({
          title: "错误",
          description: res.message || "更新失败",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('更换公司失败:', error);
      toast({
        title: "错误",
        description: error.message || "更换公司失败",
        variant: "destructive",
      });
    },
  });

  // 批量关联所有组织到公司的 mutation
  const batchAssociateDepartmentsMutation = useMutation({
    mutationFn: async ({ companyId }: { companyId: number }) => {
      const departments = data?.data || [];
      const promises = departments.map(dept =>
        unifiedApi.department.update(dept.id.toString(), { companyId }, user?.id || '')
      );
      return Promise.all(promises);
    },
    onSuccess: async (results) => {
      const successCount = results.filter(res => res.success).length;
      const totalCount = results.length;
      const targetCompany = userCreatedCompanies.find(c => c.id === selectedCompanyId);
      const companyName = targetCompany?.name || '公司';

      if (successCount === totalCount) {
        toast({
          title: "批量关联成功",
          description: `已成功将 ${successCount} 个组织关联到 ${companyName}`,
          variant: "default",
        });
      } else {
        toast({
          title: "部分关联成功",
          description: `成功关联 ${successCount}/${totalCount} 个组织到 ${companyName}`,
          variant: "default",
        });
      }

      setAssociateCompanyDialogOpen(false);
      setSelectedCompanyId(null);
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: any) => {
      console.error('批量关联公司失败:', error);
      toast({
        title: "批量关联失败",
        description: error.message || "网络错误，请检查连接后重试",
        variant: "destructive",
      });
    },
  });

  // 处理查询结果
  useEffect(() => {
    // 添加调试信息
    console.log('组织管理页面 - 查询状态:', {
      data,
      isLoading,
      error,
      user: user?.id,
      companyId: user?.companyId,
      authLoading,
      userObject: user
    });

    if (error) {
      console.error('组织管理页面 - 查询错误:', error);
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
      console.error('组织管理页面 - API返回错误:', data);
      toast({
        title: "错误",
        description: data && data.message ? data.message : "获取部门数据失败",
        variant: "destructive",
      });
    }
  }, [data, isLoading, error, toast, user]); // 确保所有依赖项都包含在内

  // 处理数据转换和函数定义
  const departments = data && data.data ? data.data.map((d: any) => ({
    id: String(d.id),
    name: d.name,
    manager: "",                                   // 假设后端不返回经理信息，或者根据实际情况调整
    members: d.memberCount || 0,                   // 使用后端返回的 memberCount 作为 members
    memberCount: d.memberCount || 0,               // 使用后端返回的 memberCount
    activeMembersCount: d.activeMembersCount || 0, // 使用后端返回的 activeMembersCount
    performance: 0,                                // 假设后端不返回绩效分，或者根据实际情况调整
    projects: 0,                                   // 假设后端不返回项目数，或者根据实际情况调整
    status: "active",                              // 假设新创建的部门默认为活跃状态
    teams: [],                                     // 假设后端不返回团队信息，或者根据实际情况调整
  })) : [];

  const handleAddNewDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        title: "错误",
        description: "部门名称不能为空！",
        variant: "destructive",
      });
      return;
    }
    createDepartmentMutation.mutate({ name: newDeptName });
  };

  const handleDeleteDepartment = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (department) {
      setDepartmentToDelete(department);
      setDeleteConfirmDialogOpen(true);
    }
  };

  const confirmDeleteDepartment = () => {
    if (departmentToDelete) {
      deleteDepartmentMutation.mutate(departmentToDelete.id);
      setDeleteConfirmDialogOpen(false);
      setDepartmentToDelete(null);
    }
  };

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
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <CardTitle>需要登录</CardTitle>
                <CardDescription>
                  您需要登录后才能访问组织管理功能
                </CardDescription>
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

  // 检查用户是否加入了公司
  if (!user.companyId) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <CardTitle>需要加入公司</CardTitle>
                <CardDescription>
                  您需要先加入公司才能访问组织管理功能
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full" onClick={() => { window.location.href = '/companies' }}>
                  前往公司管理
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // 如果用户已登录但未加入公司，显示邀请码验证界面
  if (isAuthenticated && !user?.companyId && !inviteCodeVerified) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <CardTitle>需要邀请码</CardTitle>
                <CardDescription>
                  访问组织管理功能需要先加入公司，请输入邀请码
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="inviteCode">邀请码</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="请输入邀请码"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleInviteCodeVerification();
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleInviteCodeVerification}
                  disabled={!inviteCode.trim()}
                >
                  验证邀请码
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AuthGuard>
      <CompanyGuard>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssociateCompanyDialogOpen(true)}
              disabled={!userCreatedCompanies.length || !data?.data?.length}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              关联公司
            </Button>
            <Link href="/companies">
              <Button variant="outline" size="sm">
                <Building className="mr-2 h-4 w-4" />
                公司管理
              </Button>
            </Link>
            <Link href="/permissions">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                权限管理
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总组织数</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
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
              <CardHeader>
                <div className="flex flex-row items-center justify-start space-x-4">
                <CardTitle className="text-2xl font-bold">组织列表</CardTitle>
                <div className="flex gap-2">

                  <Dialog open={isAddDeptDialogOpen} onOpenChange={setAddDeptDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-7 px-2" onClick={() => console.log("新增组织按钮被点击")}>
                        <Plus className="mr-1 h-3 w-3" />
                        新增组织
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader className="text-center pb-4">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <DialogTitle className="text-xl font-semibold">创建新组织</DialogTitle>
                      <DialogDescription className="text-gray-600 mt-2">
                        {user?.companyId ?
                          `新组织将自动关联到您当前的公司` :
                          "您需要先加入公司才能创建组织"
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* 组织名称输入 */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          组织名称 *
                        </Label>
                        <Input
                          id="name"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          placeholder="请输入组织名称"
                          className="w-full"
                        />
                      </div>

                      {/* 当前公司信息 */}
                      {user?.companyId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">关联公司信息</h4>
                          <p className="text-sm text-gray-600">
                            将自动关联到：{user?.companyName || '当前公司'}
                          </p>
                        </div>
                      )}

                      {/* 没有公司的提醒 */}
                      {!user?.companyId && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-red-600 text-xs font-bold">!</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-red-800 mb-2">无法创建组织</h4>
                              <ul className="text-sm text-red-700 space-y-1">
                                <li>• 您尚未加入任何公司</li>
                                <li>• 请先前往公司管理页面加入公司</li>
                                <li>• 组织必须关联到公司才能创建</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex space-x-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="flex-1">取消</Button>
                      </DialogClose>
                      <Button
                        onClick={handleAddNewDepartment}
                        disabled={createDepartmentMutation.isPending || !user?.companyId || !newDeptName.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {createDepartmentMutation.isPending ? "创建中..." : "创建组织"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>组织名称</TableHead>
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
                        <TableCell colSpan={7} className="h-24 text-center">
                          加载组织数据...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-red-500">
                          加载组织数据失败: {error.message}
                        </TableCell>
                      </TableRow>
                    ) : departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                          没有找到组织。
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((department) => (
                        <React.Fragment key={department.id}>
                          <TableRow>
                            <TableCell className="font-medium">
                              <Link
                                href={`/org/details`}
                                onClick={() => {
                                  localStorage.setItem('currentDepartmentId', department.id);
                                  localStorage.setItem('currentDepartmentName', department.name);
                                }}
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
                                  onClick={() => {
                                    localStorage.setItem('currentDepartmentId', department.id);
                                    localStorage.setItem('currentDepartmentName', department.name);
                                  }}
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const originalDept = data?.data?.find((d: any) => d.id.toString() === department.id);
                                      if (originalDept) {
                                        setSelectedDepartment(originalDept);
                                        setChangeCompanyDialogOpen(true);
                                      }
                                    }}
                                    disabled={!userCreatedCompanies.length}
                                  >
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    更换公司
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteDepartment(department.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    删除
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
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

      {/* 批量关联公司对话框 */}
      <Dialog open={isAssociateCompanyDialogOpen} onOpenChange={setAssociateCompanyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <LinkIcon className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">确认批量关联公司</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              将所有组织关联到新公司后，原有关联将被替换。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 当前组织信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">当前组织信息</h4>
              <p className="text-sm text-gray-600">
                共有 {data?.data?.length || 0} 个组织将被关联
              </p>
            </div>

            {/* 新公司信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">目标公司</h4>
              <Select value={selectedCompanyId?.toString() || ""} onValueChange={(value) => setSelectedCompanyId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择目标公司" />
                </SelectTrigger>
                <SelectContent>
                  {userCreatedCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 重要提醒 - 只在有组织已关联公司时显示 */}
            {data?.data?.some(dept => dept.companyId) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">重要提醒</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 所有组织将从当前公司中移除</li>
                      <li>• 组织的所有权限和角色将被重置</li>
                      <li>• 部门关联将被重新建立</li>
                      <li>• 此操作不可撤销</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">取消</Button>
            </DialogClose>
            <Button
              onClick={() => selectedCompanyId && batchAssociateDepartmentsMutation.mutate({ companyId: selectedCompanyId })}
              disabled={!selectedCompanyId || batchAssociateDepartmentsMutation.isPending}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {batchAssociateDepartmentsMutation.isPending ? "关联中..." : "确认加入新公司"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更换公司对话框 */}
      <Dialog open={isChangeCompanyDialogOpen} onOpenChange={setChangeCompanyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <LinkIcon className="w-6 h-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">确认更换公司</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              您当前已经是其他公司的成员，加入新公司将会：
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 当前组织信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">当前组织信息</h4>
              <p className="text-sm text-gray-600">
                组织名称：{selectedDepartment?.name}
              </p>
              {selectedDepartment?.companyId && (
                <p className="text-sm text-gray-600 mt-1">
                  当前公司：{userCreatedCompanies.find(c => c.id === selectedDepartment.companyId)?.name || '未知公司'}
                </p>
              )}
            </div>

            {/* 新公司信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">新公司信息</h4>
              <Select value={selectedCompanyId?.toString() || ""} onValueChange={(value) => setSelectedCompanyId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="即将加入：请选择公司" />
                </SelectTrigger>
                <SelectContent>
                  {userCreatedCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 重要提醒 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-red-800 mb-2">重要提醒</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 组织将从当前公司中移除</li>
                    <li>• 组织的所有权限和角色将被重置</li>
                    <li>• 部门关联将被重新建立</li>
                    <li>• 此操作不可撤销</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">取消</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (selectedDepartment && selectedCompanyId) {
                  changeDepartmentCompanyMutation.mutate({
                    departmentId: selectedDepartment.id.toString(),
                    companyId: selectedCompanyId
                  });
                }
              }}
              disabled={!selectedCompanyId || changeDepartmentCompanyMutation.isPending}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {changeDepartmentCompanyMutation.isPending ? "更换中..." : "确认加入新公司"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            {/* 图标 */}
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            {/* 标题 */}
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                确认删除组织
              </DialogTitle>
              <DialogDescription className="text-center text-gray-600">
                您确定要删除组织 "{departmentToDelete?.name}" 吗？
              </DialogDescription>
            </DialogHeader>

            {/* 组织信息 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">组织信息</h4>
              <p className="text-sm text-gray-600">
                组织名称：{departmentToDelete?.name}
              </p>
              <p className="text-sm text-gray-600">
                成员数量：{departmentToDelete?.members || 0} 人
              </p>
            </div>

            {/* 重要提醒 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-red-800 mb-2">重要提醒</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• 删除后无法恢复</li>
                    <li>• 如果组织内有成员，需要先移除所有成员</li>
                    <li>• 相关的权限和角色将被清除</li>
                    <li>• 此操作不可撤销</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDeleteDepartment}
              disabled={deleteDepartmentMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleteDepartmentMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
