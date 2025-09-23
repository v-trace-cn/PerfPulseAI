"use client"

import React, { useState } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Building, Plus, Search, Settings, Gift, LogOut, Link as LinkIcon, ChevronDown, Shield, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DataLoader } from "@/components/ui/data-loader"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context-rq"
import {
  useAdminMenuPermission,
  canAccessAdminMenu,
} from "@/hooks"
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useBatchAssociateDepartments,
  Department,
  DepartmentFormData
} from "@/hooks/useDepartmentManagement"
import { DepartmentTable } from "@/components/department/DepartmentTable"
import { DepartmentForm } from "@/components/department/DepartmentForm"
import { DepartmentSettings } from "@/components/organization/DepartmentSettings"
import Link from "next/link"

export default function OrganizationManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [leaveDepartmentDialogOpen, setLeaveDepartmentDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [selectedDepartmentForMembers, setSelectedDepartmentForMembers] = useState<Department | null>(null)

  const { user } = useAuth()

  // 权限检查 - 使用真实的权限验证
  const { data: permissionData, isLoading: permissionLoading } = useAdminMenuPermission(user?.companyId?.toString())
  const canMenus = {
    canView: true, // 基础查看权限
    canOrg: canAccessAdminMenu(permissionData, 'org'),
    canMall: canAccessAdminMenu(permissionData, 'mall'),
    canRedemption: canAccessAdminMenu(permissionData, 'redemption')
  }

  // API hooks
  const { data: departments, isLoading, error } = useDepartments()
  const createDepartmentMutation = useCreateDepartment()
  const updateDepartmentMutation = useUpdateDepartment()
  const deleteDepartmentMutation = useDeleteDepartment()
  const associateCompanyMutation = useBatchAssociateDepartments()

  // Filter departments based on search term
  const filteredDepartments = (departments || []).filter((dept: Department) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Event handlers
  const handleCreateDepartment = (data: DepartmentFormData) => {
    createDepartmentMutation.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false)
      }
    })
  }

  const handleUpdateDepartment = (data: DepartmentFormData) => {
    if (!selectedDepartment) return
    updateDepartmentMutation.mutate({ id: selectedDepartment.id, ...data }, {
      onSuccess: () => {
        setEditDialogOpen(false)
        setSelectedDepartment(null)
      }
    })
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setEditDialogOpen(true)
  }

  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department)
    setDeleteDialogOpen(true)
  }

  const handleViewMembers = (department: Department) => {
    setSelectedDepartmentForMembers(department)
    setMembersDialogOpen(true)
  }

  const confirmDeleteDepartment = () => {
    if (departmentToDelete) {
      deleteDepartmentMutation.mutate(departmentToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setDepartmentToDelete(null)
        }
      })
    }
  }


  const handleAssociateCompany = () => {
    if (user?.companyId) {
      associateCompanyMutation.mutate(user.companyId)
    }
  }

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="flex flex-col min-h-screen bg-gray-50/90">
          <main className="flex-1 p-4 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">组织管理</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-gray-600">
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-gray-600">
                      管理中心
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/companies" className="flex items-center w-full">
                        <LinkIcon className="mr-2 h-4 w-4" />
                        关联公司
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/companies" className="flex items-center w-full">
                        <Building className="mr-2 h-4 w-4" />
                        公司管理
                      </Link>
                    </DropdownMenuItem>
                    {canMenus.canOrg && (
                      <DropdownMenuItem asChild>
                        <Link href="/org/permissions" className="flex items-center w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          权限管理
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canMenus.canMall && (
                      <DropdownMenuItem asChild>
                        <Link href="/org/mall" className="flex items-center w-full">
                          <Package className="mr-2 h-4 w-4" />
                          商城管理
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canMenus.canRedemption && (
                      <DropdownMenuItem asChild>
                        <Link href="/org/redemption" className="flex items-center w-full">
                          <Gift className="mr-2 h-4 w-4" />
                          兑奖管理
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* 部门列表 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {user?.departmentId ? '所有部门' : '选择部门加入'}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="搜索部门名称或描述..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <DataLoader
                  data={filteredDepartments}
                  isLoading={isLoading}
                  error={error}
                  loadingComponent={
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">加载部门信息中...</p>
                      </div>
                    </div>
                  }
                  emptyComponent={
                    <div className="text-center py-12">
                      <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">暂无部门</h3>
                      <p className="text-gray-500 mb-6">还没有创建任何部门，点击上方按钮创建第一个部门</p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        创建部门
                      </Button>
                    </div>
                  }
                >
                  {(data) => (
                    <DepartmentTable
                      departments={data}
                      currentUserDepartmentId={user?.departmentId}
                      onEditDepartment={handleEditDepartment}
                      onDeleteDepartment={handleDeleteDepartment}
                      onViewMembers={handleViewMembers}
                    />
                  )}
                </DataLoader>
              </CardContent>
            </Card>

            {/* 对话框组件 */}
            <DepartmentForm
              open={isCreateDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onSubmit={handleCreateDepartment}
              mode="create"
              isLoading={createDepartmentMutation.isPending}
            />

            <DepartmentForm
              open={isEditDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSubmit={handleUpdateDepartment}
              department={selectedDepartment}
              mode="edit"
              isLoading={updateDepartmentMutation.isPending}
            />

            {/* 删除确认对话框 */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要删除部门 "{departmentToDelete?.name}" 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteDepartment}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* 退出部门确认对话框 */}
            <AlertDialog open={leaveDepartmentDialogOpen} onOpenChange={setLeaveDepartmentDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认退出部门</AlertDialogTitle>
                  <AlertDialogDescription>
                    您确定要退出当前部门吗？退出后您将无法访问部门相关的数据和功能。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {/* 离开部门功能暂未实现 */}}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    退出
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* 部门成员对话框 */}
            {selectedDepartmentForMembers && (
              <DepartmentSettings
                open={membersDialogOpen}
                onOpenChange={setMembersDialogOpen}
                department={selectedDepartmentForMembers}
              />
            )}
          </main>
        </div>
      </CompanyGuard>
    </AuthGuard>
  );
}
