"use client"

import React, { useState } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import {
  Building,
  Users,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  MapPin,
  Calendar,
  Settings,
  Search,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { unifiedApi } from "@/lib/unified-api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"
import { useAuthDialog } from "@/lib/auth-dialog-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Company {
  id: number
  name: string
  description?: string
  domain?: string
  inviteCode?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  userCount: number
  departmentCount: number
}

export default function CompanyManagement() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domain: "",
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [confirmJoinDialogOpen, setConfirmJoinDialogOpen] = useState(false)
  const [joinConflictInfo, setJoinConflictInfo] = useState<{
    currentCompany: string
    newCompany: string
    inviteCode: string
  } | null>(null)
  const [leaveCompanyDialogOpen, setLeaveCompanyDialogOpen] = useState(false)
  const [inviteCodeDialogOpen, setInviteCodeDialogOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [inviteCodeVerified, setInviteCodeVerified] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth()
  const { openLoginDialog } = useAuthDialog()
  const router = useRouter()

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
          description: "邀请码验证通过，您现在可以访问公司管理功能",
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

  // 获取所有可用的公司列表（供新用户加入）
  const { data: availableCompaniesData, isLoading: availableCompaniesLoading, error } = useQuery<{ data: Company[]; message: string; success: boolean }>({
    queryKey: ['available-companies', user?.id, searchTerm],
    queryFn: () => unifiedApi.company.getAvailable(user?.id || '', searchTerm || undefined),
    enabled: !!user?.id,
  })


  const availableCompanies = availableCompaniesData?.data || []
  const isLoading = availableCompaniesLoading

  // 创建公司
  const createCompanyMutation = useMutation({
    mutationFn: (companyData: any) => unifiedApi.company.create({
      ...companyData,
      creatorUserId: user?.id
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        setFormData({ name: "", description: "", domain: "" })
        setCreateDialogOpen(false)
        // 刷新可用公司列表
        queryClient.invalidateQueries({ queryKey: ['available-companies'] })
      } else {
        toast({
          title: "错误",
          description: res.message,
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "错误",
        description: error.message || "创建公司失败",
        variant: "destructive",
      })
    },
  })

  // 加入公司
  const joinCompanyMutation = useMutation({
    mutationFn: ({ inviteCode, forceJoin = false }: { inviteCode: string; forceJoin?: boolean }) =>
      unifiedApi.company.joinByInviteCode(inviteCode, user?.id, forceJoin),
    onSuccess: async (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        setConfirmJoinDialogOpen(false)
        setJoinConflictInfo(null)

        // 刷新可用公司列表
        queryClient.invalidateQueries({ queryKey: ['available-companies'] })

        // 刷新用户状态以更新个人中心的公司信息
        await refreshUser()

        // 刷新用户相关的查询缓存
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['user', user.id] })
          queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] })
          // 刷新组织管理页面的数据
          queryClient.invalidateQueries({ queryKey: ['departments'] })
        }

        // 自动跳转到组织管理页面
        setTimeout(() => {
          router.push('/org')
        }, 1500) // 延迟1.5秒让用户看到成功提示
      } else {
        toast({
          title: "错误",
          description: res.message,
          variant: "destructive",
        })
      }
    },
    onError: (error: any, variables: any) => {
      // 处理加入公司失败

      // 检查是否是冲突错误（用户已属于其他公司）
      if (error.status === 409 && error.detail?.requireConfirmation) {
        setJoinConflictInfo({
          currentCompany: error.detail.currentCompany,
          newCompany: error.detail.newCompany,
          inviteCode: variables.inviteCode || ""
        })
        setConfirmJoinDialogOpen(true)
      } else {
        toast({
          title: "错误",
          description: error.message || error.detail?.message || error.detail || "加入公司失败",
          variant: "destructive",
        })
      }
    },
  })

  // 退出公司
  const leaveCompanyMutation = useMutation({
    mutationFn: () => unifiedApi.company.leaveCompany(user?.id),
    onSuccess: async (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        setLeaveCompanyDialogOpen(false)

        // 刷新可用公司列表
        queryClient.invalidateQueries({ queryKey: ['available-companies'] })

        // 刷新用户状态以更新个人中心的公司信息
        await refreshUser()

        // 刷新用户相关的查询缓存
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['user', user.id] })
          queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] })
          // 刷新组织管理页面的数据
          queryClient.invalidateQueries({ queryKey: ['departments'] })
        }
      } else {
        toast({
          title: "错误",
          description: res.message,
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "错误",
        description: error.message || error.detail || "退出公司失败",
        variant: "destructive",
      })
    },
  })

  // 更新公司
  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      unifiedApi.company.update(id, { ...data, userId: user?.id }),
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        setEditDialogOpen(false)
        setSelectedCompany(null)
        queryClient.invalidateQueries({ queryKey: ['available-companies'] })
      } else {
        toast({
          title: "错误",
          description: res.message || "更新公司失败",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      console.error("更新公司失败:", error)
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后重试。",
        variant: "destructive",
      })
    },
  })

  // 删除公司
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => unifiedApi.company.delete(id, user?.id || ''),
    onSuccess: (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        queryClient.invalidateQueries({ queryKey: ['available-companies'] })
      } else {
        toast({
          title: "错误",
          description: res.message || "删除公司失败",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      console.error("删除公司失败:", error)
      toast({
        title: "错误",
        description: error.message || "连接服务器失败，请稍后重试。",
        variant: "destructive",
      })
    },
  })



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
                  您需要登录后才能访问公司管理功能
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

  // 如果用户已登录但未验证邀请码，显示邀请码验证界面
  if (isAuthenticated && user && !inviteCodeVerified) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <CardTitle>需要邀请码</CardTitle>
                <CardDescription>
                  访问公司管理功能需要输入邀请码
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





  const handleCreateCompany = () => {
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "公司名称不能为空！",
        variant: "destructive",
      })
      return
    }
    createCompanyMutation.mutate(formData)
  }

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      description: company.description || "",
      domain: company.domain || "",
    })
    setEditDialogOpen(true)
  }

  const handleUpdateCompany = () => {
    if (!selectedCompany) return
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "公司名称不能为空！",
        variant: "destructive",
      })
      return
    }
    updateCompanyMutation.mutate({
      id: selectedCompany.id,
      data: formData
    })
  }



  const handleJoinCompanyByCode = (inviteCode: string) => {
    if (!inviteCode || !inviteCode.trim()) {
      toast({
        title: "错误",
        description: "邀请码无效！",
        variant: "destructive",
      })
      return
    }

    joinCompanyMutation.mutate({ inviteCode: inviteCode.trim() })
  }

  const handleConfirmJoinCompany = () => {
    if (joinConflictInfo) {
      joinCompanyMutation.mutate({
        inviteCode: joinConflictInfo.inviteCode,
        forceJoin: true
      })
    }
  }

  const handleDeleteCompany = (company: Company) => {
    setCompanyToDelete(company)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCompany = () => {
    if (companyToDelete) {
      deleteCompanyMutation.mutate(companyToDelete.id)
      setDeleteDialogOpen(false)
      setCompanyToDelete(null)
    }
  }





  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h3 className="text-3xl font-bold tracking-tight flex items-center">
              <Building className="mr-3 h-8 w-8 text-gray-700" />
              公司管理
            </h3>
          </div>
          <div className="flex space-x-2">
            <Link href="/org">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                组织管理
              </Button>
            </Link>
            {user?.companyId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeaveCompanyDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出公司
              </Button>
            )}
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建公司
            </Button>
          </div>
        </header>

        {/* 公司列表 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>
                  {user?.companyId ? '所有公司' : '选择公司加入'}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索公司名称、描述或域名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司名称</TableHead>
                  <TableHead>域名</TableHead>
                  <TableHead>加入公司</TableHead>
                  <TableHead>员工数</TableHead>
                  <TableHead>部门数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      加载公司数据...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-red-500">
                      加载公司数据失败: {error.message}
                    </TableCell>
                  </TableRow>
                ) : availableCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                      没有找到公司。点击"添加公司"创建第一个公司。
                    </TableCell>
                  </TableRow>
                ) : (
                  availableCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {company.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.description && (
                              <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                {company.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.domain ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{company.domain}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.inviteCode && company.inviteCode.trim() && user?.companyId !== company.id ? (
                          <Button
                            size="sm"
                            onClick={() => handleJoinCompanyByCode(company.inviteCode!)}
                            disabled={joinCompanyMutation.isPending}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            加入公司
                          </Button>
                        ) : user?.companyId === company.id ? (
                          <Badge variant="secondary">已加入</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span>{company.userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3 text-gray-400" />
                          <span>{company.departmentCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.isActive ? "default" : "secondary"}>
                          {company.isActive ? "活跃" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(company.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteCompany(company)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 创建公司对话框 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新公司</DialogTitle>
              <DialogDescription>
                填写公司基本信息，创建后您将成为该公司的超级管理员。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-name" className="text-right">
                  公司名称 *
                </Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="请输入公司名称"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-domain" className="text-right">
                  公司域名
                </Label>
                <Input
                  id="create-domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="col-span-3"
                  placeholder="例如：example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="create-description" className="text-right pt-2">
                  公司描述
                </Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="请输入公司描述"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button
                onClick={handleCreateCompany}
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending ? "创建中..." : "创建公司"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑公司对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑公司信息</DialogTitle>
              <DialogDescription>
                修改公司的基本信息。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  公司名称 *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="请输入公司名称"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-domain" className="text-right">
                  公司域名
                </Label>
                <Input
                  id="edit-domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="col-span-3"
                  placeholder="例如：example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2">
                  公司描述
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="请输入公司描述"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button
                onClick={handleUpdateCompany}
                disabled={updateCompanyMutation.isPending}
              >
                {updateCompanyMutation.isPending ? "保存中..." : "保存更改"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* 加入公司确认对话框 */}
        <Dialog open={confirmJoinDialogOpen} onOpenChange={setConfirmJoinDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-amber-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                确认更换公司
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                您当前已经是其他公司的成员，加入新公司将会：
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">当前公司信息</h4>
                <p className="text-sm text-amber-700">
                  您目前属于：<span className="font-semibold">{joinConflictInfo?.currentCompany}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">新公司信息</h4>
                <p className="text-sm text-blue-700">
                  即将加入：<span className="font-semibold">{joinConflictInfo?.newCompany}</span>
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">⚠️ 重要提醒</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 您将从当前公司中移除</li>
                  <li>• 当前公司的所有权限和角色将被清除</li>
                  <li>• 部门关联将被重置</li>
                  <li>• 此操作不可撤销</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmJoinDialogOpen(false)
                  setJoinConflictInfo(null)
                }}
                disabled={joinCompanyMutation.isPending}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmJoinCompany}
                disabled={joinCompanyMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {joinCompanyMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    加入中...
                  </>
                ) : (
                  <>
                    <Building className="mr-2 h-4 w-4" />
                    确认加入新公司
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <Trash2 className="mr-2 h-5 w-5" />
                删除公司确认
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                此操作将永久删除公司及其所有相关数据，包括：
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 mb-2">
                  即将删除：{companyToDelete?.name}
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 所有公司成员数据</li>
                  <li>• 所有部门和组织架构</li>
                  <li>• 所有活动和绩效记录</li>
                  <li>• 所有权限和角色设置</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>警告：</strong>此操作不可撤销！请确保您真的要删除这个公司。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteCompanyMutation.isPending}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteCompany}
                disabled={deleteCompanyMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteCompanyMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    确认删除
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 退出公司确认对话框 */}
        <Dialog open={leaveCompanyDialogOpen} onOpenChange={setLeaveCompanyDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-amber-600">
                <LogOut className="mr-2 h-5 w-5" />
                退出公司
              </DialogTitle>
              <DialogDescription>
                您确定要退出当前公司吗？
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-800">
                      <strong>注意：</strong>退出公司后，您将失去该公司的所有权限和组织关联。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setLeaveCompanyDialogOpen(false)}
                disabled={leaveCompanyMutation.isPending}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => leaveCompanyMutation.mutate()}
                disabled={leaveCompanyMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {leaveCompanyMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    退出中...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    确认退出
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      </div>
    </AuthGuard>
  )
}
