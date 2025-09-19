"use client"

import React, { useEffect, useState } from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useInfoDialog } from "@/components/ui/info-dialog"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Shield, Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

import { useAuth } from "@/lib/auth-context-rq"
import { useCanViewAdminMenus } from "@/hooks"

// 后端数据
export default function PermissionManagement() {
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)

  const { user } = useAuth()
  const { showSuccess, showError, showInfo, DialogComponent } = useInfoDialog()
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [adminUserIds, setAdminUserIds] = useState<number[]>([])
  const [qMember, setQMember] = useState("")
  const [loading, setLoading] = useState(false)

  const [canOrg, setCanOrg] = useState<boolean>(false)
  const [permChecked, setPermChecked] = useState<boolean>(false)

  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : null

  // 编辑部门管理员的“用户角色”对话框
  const [isEditUserRolesOpen, setIsEditUserRolesOpen] = useState(false)
  const [editRolesUserId, setEditRolesUserId] = useState<number | null>(null)
  const [editUserRoleIds, setEditUserRoleIds] = useState<number[]>([])
  const [editRolesLoading, setEditRolesLoading] = useState(false)
  const [editRoleMembersMap, setEditRoleMembersMap] = useState<Record<number, number[]>>({})

  const openEditUserRoles = async (uid: number) => {
    setEditRolesUserId(uid)
    setIsEditUserRolesOpen(true)
    setEditRolesLoading(true)
    try {
      // 获取用户当前的角色
      const userRolesRes = await fetch(`/api/roles/users/${uid}/roles`, { headers })
      const userRolesJson = await userRolesRes.json()

      // 获取所有角色的成员信息（用于显示"已拥有"标注）
      const entries = await Promise.all(
        roles.map(async (r: any) => {
          try {
            const res = await fetch(`/api/roles/${r.id}/members`, { headers })
            const json = await res.json().catch(() => ({}))
            const ids: number[] = json?.data?.items?.map((m: any) => m.id) ?? []
            return [r.id, ids] as [number, number[]]
          } catch {
            return [r.id, []] as [number, number[]]
          }
        }),
      )

      const map: Record<number, number[]> = {}
      for (const [rid, ids] of entries) {
        map[rid] = ids
      }
      setEditRoleMembersMap(map)

      // 设置用户当前拥有的角色
      if (userRolesJson?.success) {
        const currentRoleIds = userRolesJson.data.roles.map((r: any) => r.id)
        setEditUserRoleIds(currentRoleIds)
      } else {
        setEditUserRoleIds([])
      }
    } finally {
      setEditRolesLoading(false)
    }
  }

  const toggleUserRole = (rid: number, checked: boolean) => {
    setEditUserRoleIds((prev) => (checked ? Array.from(new Set([...prev, rid])) : prev.filter((id) => id !== rid)))
  }

  const saveEditUserRoles = async () => {
    if (!editRolesUserId) return
    setEditRolesLoading(true)
    try {
      // 使用新的用户角色更新接口
      const response = await fetch(`/api/roles/users/${editRolesUserId}/roles`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ roleIds: editUserRoleIds }),
      })

      const result = await response.json()
      if (result.success) {
        showSuccess("操作成功", "用户角色更新成功")
        setIsEditUserRolesOpen(false)
        setEditRolesUserId(null)
        // 重新加载数据以更新UI
        await loadRoles()
      } else {
        showError("更新失败", result.message || "未知错误")
      }
    } catch (e) {
      console.error('更新用户角色失败', e)
      showError("更新失败", "网络错误，请稍后重试")
    } finally {
      setEditRolesLoading(false)
    }
  }

  const headers: Record<string, string> = token ? { "X-User-Id": token, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  // 角色与权限（列表与新增表单）
  const [roles, setRoles] = useState<any[]>([])
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")







	// 角色编辑/删除弹窗状态
	const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
	const [editRole, setEditRole] = useState<any>(null)
	const [editRoleName, setEditRoleName] = useState("")
	const [editRoleDesc, setEditRoleDesc] = useState("")
	const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false)
	const [roleToDelete, setRoleToDelete] = useState<any>(null)

		const openEditRole = (r: any) => {
			setEditRole(r)
			setEditRoleName(r?.name || "")
			setEditRoleDesc(r?.description || "")
			setIsEditRoleOpen(true)
		}

		const openDeleteRole = (r: any) => {
			setRoleToDelete(r)
			setIsDeleteRoleOpen(true)
		}


	// 通知
	const { toast } = useToast()




  const loadRoles = async () => {
    if (!user?.companyId) return
    try {
      const res = await fetch(`/api/roles?companyId=${user.companyId}`, { headers })
      const json = await res.json()
      if (json?.success) setRoles(json.data || [])
    } catch (e) {
      console.error("加载角色失败", e)
    }
  }

  useEffect(() => { loadRoles() }, [user?.companyId])



  const handleCreateRole = async () => {
    if (!user?.companyId || !roleName.trim()) {
      toast({ variant: "destructive", title: "创建角色失败", description: "请填写角色名称" })
      return
    }
    try {
      const res = await fetch(`/api/roles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          companyId: user.companyId,
          name: roleName.trim(),
          description: roleDesc || "",
        }),
      })
      let json: any = null
      try { json = await res.json() } catch {}
      if (!res.ok || !json?.success) {
        const msg = json?.detail || json?.message || `创建角色失败 (${res.status})`
        toast({ variant: "destructive", title: "创建角色失败", description: msg })
        return
      }
      toast({ title: "创建角色成功" })
      setIsAddRoleOpen(false)
      setRoleName(""); setRoleDesc("")
      await loadRoles()
    } catch (e) {
      console.error("创建角色失败", e)
      toast({ variant: "destructive", title: "创建角色失败", description: "请稍后再试" })
    }
  }





  const onConfirmEditRole = async () => {
    if (!editRole) return
    const name = editRoleName.trim()
    const description = editRoleDesc || ""
    if (!name) {
      toast({ variant: "destructive", title: "保存失败", description: "请填写角色名称" })
      return
    }
    try {
      const res = await fetch(`/api/roles/${editRole.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name, description })
      })
      let json: any = null
      try { json = await res.json() } catch {}
      if (!res.ok || !json?.success) {
        const msg = json?.detail || json?.message || `更新角色失败 (${res.status})`
        toast({ variant: "destructive", title: "更新角色失败", description: msg })
        return
      }

      toast({ title: "更新成功" })
      setIsEditRoleOpen(false)
      setEditRole(null)
      await loadRoles()
    } catch (e) {
      console.error("更新角色失败", e)
      toast({ variant: "destructive", title: "更新角色失败", description: "请稍后再试" })
    }
  }

  const onConfirmDeleteRole = async () => {
    if (!roleToDelete) return
    try {
      const res = await fetch(`/api/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers,
      })
      let json: any = null
      try { json = await res.json() } catch {}
      if (!res.ok || !json?.success) {
        const msg = json?.detail || json?.message || `删除角色失败 (${res.status})`
        toast({ variant: "destructive", title: "删除角色失败", description: msg })
        return
      }
      toast({ title: "删除成功" })
      setIsDeleteRoleOpen(false)
      setRoleToDelete(null)
      await loadRoles()
    } catch (e) {
      console.error("删除角色失败", e)
      toast({ variant: "destructive", title: "删除角色失败", description: "请稍后再试" })
    }
  }





  // 权限页可见性校验（仅超级管理员或被授权者可见）
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`/api/roles/permissions/can_view_admin_menus?companyId=${user?.companyId ?? ''}`, { headers })
        const json = await res.json()
        setCanOrg(Boolean(json?.data?.canOrg))
      } catch (_) {
        setCanOrg(false)
      } finally {
        setPermChecked(true)
      }
    }
    if (user?.companyId) check()
  }, [user?.companyId])

  // 加载部门列表
  useEffect(() => {
    const loadDepts = async () => {
      if (!user?.companyId) return
      try {
        const res = await fetch(`/api/departments?company_id=${user.companyId}`, { headers })
        const json = await res.json()
        if (json?.success) {
          setDepartments(json.data || [])
          if (!selectedDeptId && (json.data || []).length > 0) {
            setSelectedDeptId(json.data[0].id)
          }
        }
      } catch (e) {
        console.error("加载部门失败", e)
      }
    }
    loadDepts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId])

  // 加载成员和部门管理员
  useEffect(() => {
    const loadMembersAndAdmins = async () => {
      if (!user?.companyId || !selectedDeptId) return
      setLoading(true)
      try {
        // 加载公司成员
        const memRes = await fetch(`/api/users/company-members?companyId=${user.companyId}&page=1&pageSize=1000`, { headers })
        const memJson = await memRes.json()
        if (memJson?.success) {
          setMembers(memJson.data?.items || [])
        }

        // 加载部门管理员
        const adminRes = await fetch(`/api/departments/${selectedDeptId}/admins`, { headers })
        const adminJson = await adminRes.json()
        if (adminJson?.success) {
          const adminIds = adminJson.data.map((admin: any) => admin.id)
          setAdminUserIds(adminIds)
        } else {
          setAdminUserIds([])
        }
      } catch (e) {
        console.error("加载成员/管理员失败", e)
        showError("加载失败", "无法加载成员和管理员信息，请稍后重试")
      } finally {
        setLoading(false)
      }
    }
    loadMembersAndAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId, selectedDeptId])



  const grantDeptAdmin = async (targetUserId: number) => {
    if (!user?.companyId || !selectedDeptId) return
    try {
      const res = await fetch(`/api/departments/${selectedDeptId}/admins`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: targetUserId }),
      })

      const json = await res.json()
      if (json?.success) {
        setAdminUserIds((prev) => Array.from(new Set([...prev, targetUserId])))
      } else {
        showError("分配失败", json?.message || "未知错误")
      }
    } catch (e) {
      console.error("授权失败", e)
      showError("分配失败", "网络错误，请稍后重试")
    }
  }

  const revokeDeptAdmin = async (targetUserId: number) => {
    if (!user?.companyId || !selectedDeptId) return
    try {
      const res = await fetch(`/api/departments/${selectedDeptId}/admins/${targetUserId}`, {
        method: "DELETE",
        headers,
      })

      const json = await res.json()
      if (json?.success) {
        setAdminUserIds((prev) => prev.filter((id) => id !== targetUserId))
      } else {
        showError("撤销失败", json?.message || "未知错误")
      }
    } catch (e) {
      console.error("撤销失败", e)
      showError("撤销失败", "网络错误，请稍后重试")
    }
  }



  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="flex flex-col min-h-screen bg-gray-50/90">
          {!permChecked ? (
            <div className="flex-1 p-8">加载中...</div>
          ) : !canOrg ? (
            <div className="flex-1 p-8">
              <Card>
                <CardHeader>
                  <CardTitle>无权限</CardTitle>
                  <CardDescription>仅超级管理员或被授权用户可访问此页面。</CardDescription>
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
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">权限管理</h1>
                </div>
              </div>
            </header>
            <Tabs defaultValue="deptPerms" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-xl">
                <TabsTrigger value="deptPerms" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>部门权限</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>角色管理</span>
                </TabsTrigger>
              </TabsList>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>角色管理</CardTitle>
                      <Button size="sm" onClick={() => setIsAddRoleOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" /> 新建角色
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((r) => (
                        <div key={r.id} className="p-3 border rounded">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-2">{r.description || ''}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" aria-label="编辑角色" onClick={() => openEditRole(r)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label="删除角色" onClick={() => openDeleteRole(r)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">成员：{r.userCount || 0} | 权限：{(r.permissions || []).length}</div>
                        </div>
                      ))}
                      {roles.length === 0 && <div className="text-sm text-gray-500">暂无角色</div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Department Permissions Tab */}
              <TabsContent value="deptPerms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>部门管理</CardTitle>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label>选择部门</Label>
                        <Select value={String(selectedDeptId ?? '')} onValueChange={(v) => setSelectedDeptId(Number(v))}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="请选择部门" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={String(d.id)}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">当前管理员</h3>
                        <div className="space-y-2">
                          {adminUserIds.length === 0 && <div className="text-sm text-gray-500">暂无管理员</div>}
                          {adminUserIds.map((uid) => {
                            const u = members.find((m) => m.id === uid)
                            return (
                              <div key={uid} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{u?.name || `用户 ${uid}`}</div>
                                  <div className="text-xs text-gray-500">{u?.email || ""}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" aria-label="编辑用户角色" onClick={() => openEditUserRoles(uid)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => revokeDeptAdmin(uid)} disabled={loading}>
                                    取消管理员
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-3">添加管理员</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Input placeholder="搜索成员（姓名/邮箱）" value={qMember} onChange={(e) => setQMember(e.target.value)} />
                        </div>
                        <div className="space-y-2 max-h-[420px] overflow-auto">
                          {members
                            .filter((m) => !adminUserIds.includes(m.id))
                            .filter((m) => !selectedDeptId || m.departmentId === selectedDeptId)
                            .filter((m) =>
                              qMember
                                ? (m.name || "").toLowerCase().includes(qMember.toLowerCase()) || (m.email || "").toLowerCase().includes(qMember.toLowerCase())
                                : true,
                            )
                            .map((m) => (
                              <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{m.name}</div>
                                  <div className="text-xs text-gray-500">{m.email}</div>
                                </div>
                                <Button variant="default" size="sm" onClick={() => grantDeptAdmin(m.id)} disabled={loading || !selectedDeptId}>
                                  设为管理员


                                </Button>
                              </div>
                            ))}
                          {members.filter((m) => !adminUserIds.includes(m.id) && (!selectedDeptId || m.departmentId === selectedDeptId)).length === 0 && (
                            <div className="text-sm text-gray-500">没有可添加的成员</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>




            </Tabs>
          </main>
          )}
        </div>
      </CompanyGuard>

    {/* Edit Role Dialog */}
    <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>修改角色基础信息</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">角色名称</Label>
            <Input className="col-span-3" value={editRoleName} onChange={(e) => setEditRoleName(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">描述</Label>
            <Input className="col-span-3" value={editRoleDesc} onChange={(e) => setEditRoleDesc(e.target.value)} />
          </div>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>取消</Button>
          <Button onClick={onConfirmEditRole}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Role Confirm */}
    <AlertDialog open={isDeleteRoleOpen} onOpenChange={setIsDeleteRoleOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除角色</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除角色“{roleToDelete?.name || roleToDelete?.id}”？该操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDeleteRole}>删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Add Role Dialog (global) */}
    <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建新角色</DialogTitle>
          <DialogDescription>定义角色名称、描述</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="mb-1 block">角色名称</Label>
            <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block">描述</Label>
            <Input value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>取消</Button>
          <Button onClick={handleCreateRole}>创建角色</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


    {/* Edit User Roles Dialog */}
    <Dialog open={isEditUserRolesOpen} onOpenChange={setIsEditUserRolesOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>设置用户角色</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[420px] overflow-auto border rounded p-2">
          {roles.map((r) => {
            const isCurrentlyAssigned = editUserRoleIds.includes(r.id);
            const wasOriginallyAssigned = editRoleMembersMap[r.id]?.includes(editRolesUserId || 0) || false;
            const isNewlyAdded = isCurrentlyAssigned && !wasOriginallyAssigned;
            const isBeingRemoved = !isCurrentlyAssigned && wasOriginallyAssigned;

            return (
              <label
                key={r.id}
                className={`flex items-center gap-2 text-sm p-2 rounded transition-colors ${
                  isNewlyAdded ? 'bg-green-50 border border-green-200' :
                  isBeingRemoved ? 'bg-red-50 border border-red-200' :
                  wasOriginallyAssigned ? 'bg-blue-50 border border-blue-200' :
                  'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isCurrentlyAssigned}
                  onChange={(e) => toggleUserRole(r.id, e.target.checked)}
                  className="rounded"
                />
                <span className="flex-1 flex items-center justify-between">
                  <span>
                    {r.name}
                    <span className="text-xs text-gray-500 ml-2">{r.description || ''}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {wasOriginallyAssigned && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        已拥有
                      </span>
                    )}
                    {isNewlyAdded && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        新增
                      </span>
                    )}
                    {isBeingRemoved && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        将移除
                      </span>
                    )}
                  </div>
                </span>
              </label>
            );
          })}
          {roles.length === 0 && <div className="text-sm text-gray-500">暂无角色</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditUserRolesOpen(false)} disabled={editRolesLoading}>取消</Button>
          <Button onClick={saveEditUserRoles} disabled={editRolesLoading}>{editRolesLoading ? '保存中…' : '保存'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 统一信息弹窗 */}
    <DialogComponent />

    </AuthGuard>
  )
}
