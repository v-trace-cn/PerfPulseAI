"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Edit, Plus, Users, Shield, Settings } from "lucide-react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"

import { useAuth } from "@/lib/auth-context-rq"
import { useAdminMenuPermission, canAccessAdminMenu } from "@/lib/permission-utils"
import { 
  useRoles, 
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateUserRoles,
  useGrantDepartmentAdmin,
  useRevokeDepartmentAdmin,
  useDepartmentAdmins
} from "@/lib/queries/role-queries"
import { useDepartments } from "@/lib/queries/department-queries"
import { useCompanyMembers } from "@/lib/queries/user-queries"

export default function PermissionManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  // 权限检查
  const { data: permissionData, isLoading: permissionLoading } = useAdminMenuPermission(user?.companyId?.toString())
  const canOrg = canAccessAdminMenu(permissionData, 'org')
  const permChecked = !permissionLoading

  // Local state
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false)
  const [editRole, setEditRole] = useState<any>(null)
  const [roleToDelete, setRoleToDelete] = useState<any>(null)
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")

  // React Query hooks
  const { data: roles = [], isLoading: rolesLoading } = useRoles(user?.companyId?.toString())
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments()
  const { data: companyMembers, isLoading: membersLoading } = useCompanyMembers(
    user?.companyId?.toString() || '', 1, 1000
  )
  const { data: departmentAdmins = [], isLoading: adminsLoading } = useDepartmentAdmins(selectedDeptId || 0)

  // Mutations
  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()
  const grantAdminMutation = useGrantDepartmentAdmin()
  const revokeAdminMutation = useRevokeDepartmentAdmin()

  // Derived data
  const members = companyMembers?.items || []
  const adminUserIds = departmentAdmins.map((admin: any) => admin.id)

  // 权限检查
  if (!permChecked) {
    return (
      <AuthGuard>
        <CompanyGuard>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">检查权限中...</p>
            </div>
          </div>
        </CompanyGuard>
      </AuthGuard>
    )
  }

  if (!canOrg) {
    return (
      <AuthGuard>
        <CompanyGuard>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">访问受限</h2>
              <p className="text-gray-600">您没有权限访问权限管理页面</p>
            </div>
          </div>
        </CompanyGuard>
      </AuthGuard>
    )
  }

  // 角色管理函数
  const handleCreateRole = () => {
    if (!user?.companyId || !roleName.trim()) {
      toast({ variant: "destructive", title: "创建角色失败", description: "请填写角色名称" })
      return
    }
    
    createRoleMutation.mutate({
      companyId: user.companyId,
      name: roleName.trim(),
      description: roleDesc || "",
    }, {
      onSuccess: () => {
        toast({ title: "创建角色成功" })
        setIsAddRoleOpen(false)
        setRoleName("")
        setRoleDesc("")
      },
      onError: (error: any) => {
        const msg = error?.message || "创建角色失败"
        toast({ variant: "destructive", title: "创建角色失败", description: msg })
      }
    })
  }

  const handleUpdateRole = () => {
    if (!editRole?.id || !editRole?.name?.trim()) {
      toast({ variant: "destructive", title: "更新失败", description: "请填写角色名称" })
      return
    }

    updateRoleMutation.mutate({
      id: editRole.id,
      name: editRole.name.trim(),
      description: editRole.description || "",
    }, {
      onSuccess: () => {
        toast({ title: "更新成功" })
        setIsEditRoleOpen(false)
        setEditRole(null)
      },
      onError: (error: any) => {
        const msg = error?.message || "更新角色失败"
        toast({ variant: "destructive", title: "更新角色失败", description: msg })
      }
    })
  }

  const handleDeleteRole = () => {
    if (!roleToDelete?.id) return

    deleteRoleMutation.mutate({ id: roleToDelete.id }, {
      onSuccess: () => {
        toast({ title: "删除成功" })
        setIsDeleteRoleOpen(false)
        setRoleToDelete(null)
      },
      onError: (error: any) => {
        const msg = error?.message || "删除角色失败"
        toast({ variant: "destructive", title: "删除角色失败", description: msg })
      }
    })
  }

  // 部门管理员函数
  const handleGrantAdmin = (userId: number) => {
    if (!selectedDeptId) return

    grantAdminMutation.mutate({
      departmentId: selectedDeptId,
      userId
    }, {
      onSuccess: () => {
        toast({ title: "授权成功" })
      },
      onError: (error: any) => {
        const msg = error?.message || "授权失败"
        toast({ variant: "destructive", title: "授权失败", description: msg })
      }
    })
  }

  const handleRevokeAdmin = (userId: number) => {
    if (!selectedDeptId) return

    revokeAdminMutation.mutate({
      departmentId: selectedDeptId,
      userId
    }, {
      onSuccess: () => {
        toast({ title: "撤销成功" })
      },
      onError: (error: any) => {
        const msg = error?.message || "撤销失败"
        toast({ variant: "destructive", title: "撤销失败", description: msg })
      }
    })
  }

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">权限管理</h1>
              <p className="text-gray-600 mt-1">管理角色权限和部门管理员</p>
            </div>
          </div>

          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                角色管理
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                部门管理员
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>角色列表</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">管理公司角色和权限</p>
                  </div>
                  <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        添加角色
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>创建新角色</DialogTitle>
                        <DialogDescription>
                          为您的公司创建一个新的角色
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="role-name">角色名称</Label>
                          <Input
                            id="role-name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="输入角色名称"
                          />
                        </div>
                        <div>
                          <Label htmlFor="role-desc">角色描述</Label>
                          <Input
                            id="role-desc"
                            value={roleDesc}
                            onChange={(e) => setRoleDesc(e.target.value)}
                            placeholder="输入角色描述（可选）"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                            取消
                          </Button>
                          <Button 
                            onClick={handleCreateRole}
                            disabled={createRoleMutation.isPending}
                          >
                            {createRoleMutation.isPending ? "创建中..." : "创建"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {rolesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">加载角色中...</p>
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">暂无角色</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roles.map((role: any) => (
                        <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{role.name}</h3>
                            {role.description && (
                              <p className="text-sm text-gray-600">{role.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditRole(role)
                                setIsEditRoleOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRoleToDelete(role)
                                setIsDeleteRoleOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>部门管理员</CardTitle>
                  <p className="text-sm text-gray-600">管理各部门的管理员权限</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="department-select">选择部门</Label>
                      <Select value={selectedDeptId?.toString() || ""} onValueChange={(value) => setSelectedDeptId(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择部门" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDeptId && (
                      <div className="space-y-4">
                        <h3 className="font-medium">部门成员</h3>
                        {membersLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">加载成员中...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {members.map((member: any) => {
                              const isAdmin = adminUserIds.includes(member.id)
                              return (
                                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-medium">{member.name}</p>
                                      <p className="text-sm text-gray-600">{member.email}</p>
                                    </div>
                                    {isAdmin && (
                                      <Badge variant="secondary">管理员</Badge>
                                    )}
                                  </div>
                                  <div>
                                    {isAdmin ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRevokeAdmin(member.id)}
                                        disabled={revokeAdminMutation.isPending}
                                      >
                                        撤销管理员
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGrantAdmin(member.id)}
                                        disabled={grantAdminMutation.isPending}
                                      >
                                        设为管理员
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 编辑角色对话框 */}
          <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑角色</DialogTitle>
                <DialogDescription>
                  修改角色信息
                </DialogDescription>
              </DialogHeader>
              {editRole && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-role-name">角色名称</Label>
                    <Input
                      id="edit-role-name"
                      value={editRole.name || ""}
                      onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                      placeholder="输入角色名称"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role-desc">角色描述</Label>
                    <Input
                      id="edit-role-desc"
                      value={editRole.description || ""}
                      onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                      placeholder="输入角色描述（可选）"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleUpdateRole}
                      disabled={updateRoleMutation.isPending}
                    >
                      {updateRoleMutation.isPending ? "更新中..." : "更新"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* 删除角色确认对话框 */}
          <AlertDialog open={isDeleteRoleOpen} onOpenChange={setIsDeleteRoleOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  您确定要删除角色 "{roleToDelete?.name}" 吗？此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteRole}
                  disabled={deleteRoleMutation.isPending}
                >
                  {deleteRoleMutation.isPending ? "删除中..." : "删除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
