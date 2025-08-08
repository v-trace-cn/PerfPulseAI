"use client"

import React, { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Shield, Settings, Plus, Edit, Trash2, Search, UserPlus, Key, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Mock data
const users = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    role: "管理员",
    status: "活跃",
    permissions: ["用户管理", "角色管理", "系统设置", "数据导出", "日志查看"]
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@example.com",
    role: "编辑",
    status: "活跃",
    permissions: ["内容编辑", "内容发布", "数据查看"]
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    role: "查看者",
    status: "禁用",
    permissions: ["数据查看"]
  },
  {
    id: 4,
    name: "赵六",
    email: "zhaoliu@example.com",
    role: "编辑",
    status: "活跃",
    permissions: ["内容编辑", "内容发布", "数据查看"]
  },
]

const roles = [
  {
    id: 1,
    name: "管理员",
    description: "拥有系统所有权限",
    userCount: 1,
    permissions: ["用户管理", "角色管理", "系统设置", "数据导出", "日志查看"],
  },
  {
    id: 2,
    name: "编辑",
    description: "可以编辑和发布内容",
    userCount: 2,
    permissions: ["内容编辑", "内容发布", "数据查看"],
  },
  {
    id: 3,
    name: "查看者",
    description: "只能查看内容",
    userCount: 1,
    permissions: ["数据查看"],
  },
]

const permissions = [
  { id: 1, name: "用户管理", category: "系统管理", description: "创建、编辑、删除用户" },
  { id: 2, name: "角色管理", category: "系统管理", description: "创建、编辑、删除角色" },
  { id: 3, name: "系统设置", category: "系统管理", description: "修改系统配置" },
  { id: 4, name: "内容编辑", category: "内容管理", description: "编辑内容" },
  { id: 5, name: "内容发布", category: "内容管理", description: "发布内容" },
  { id: 6, name: "数据查看", category: "数据管理", description: "查看数据" },
  { id: 7, name: "数据导出", category: "数据管理", description: "导出数据" },
  { id: 8, name: "日志查看", category: "系统管理", description: "查看系统日志" },
]

export default function PermissionManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false)

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setIsEditUserOpen(true)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="flex flex-col min-h-screen bg-gray-50/90">
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
            <Tabs defaultValue="users" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="users" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>用户管理</span>
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>角色管理</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>权限管理</span>
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>用户列表</CardTitle>
                        <CardDescription>管理系统用户和他们的权限</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="搜索用户..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="筛选角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">所有角色</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="editor">编辑</SelectItem>
                          <SelectItem value="viewer">查看者</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>权限</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.role === "管理员" ? "default" : "secondary"}>{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === "活跃" ? "default" : "destructive"}>{user.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {user.permissions.slice(0, 3).map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission}
                                  </Badge>
                                ))}
                                {user.permissions.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.permissions.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
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
              </TabsContent>

              {/* Edit User Dialog */}
              <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑用户</DialogTitle>
                    <DialogDescription>修改用户信息和权限设置</DialogDescription>
                  </DialogHeader>
                  {editingUser && (
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                          姓名
                        </Label>
                        <Input id="edit-name" defaultValue={editingUser.name} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">
                          邮箱
                        </Label>
                        <Input id="edit-email" type="email" defaultValue={editingUser.email} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-role" className="text-right">
                          角色
                        </Label>
                        <Select defaultValue={editingUser.role}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="管理员">管理员</SelectItem>
                            <SelectItem value="编辑">编辑</SelectItem>
                            <SelectItem value="查看者">查看者</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-status" className="text-right">
                          状态
                        </Label>
                        <Select defaultValue={editingUser.status}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="活跃">活跃</SelectItem>
                            <SelectItem value="禁用">禁用</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">当前权限</Label>
                        <div className="col-span-3">
                          <div className="flex flex-wrap gap-2">
                            {editingUser.permissions.map((permission: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={() => setIsEditUserOpen(false)}>保存修改</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>角色列表</CardTitle>
                        <CardDescription>管理系统角色和权限分配</CardDescription>
                      </div>
                      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>添加角色</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>创建新角色</DialogTitle>
                            <DialogDescription>定义角色名称、描述和权限</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="roleName" className="text-right">
                                角色名称
                              </Label>
                              <Input id="roleName" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="roleDesc" className="text-right">
                                描述
                              </Label>
                              <Input id="roleDesc" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right mt-2">权限</Label>
                              <div className="col-span-3 space-y-3">
                                {["系统管理", "内容管理", "数据管理"].map((category) => (
                                  <div key={category}>
                                    <h4 className="font-medium mb-2">{category}</h4>
                                    <div className="space-y-2 pl-4">
                                      {permissions
                                        .filter((p) => p.category === category)
                                        .map((permission) => (
                                          <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox id={`perm-${permission.id}`} />
                                            <Label htmlFor={`perm-${permission.id}`} className="text-sm">
                                              {permission.name}
                                            </Label>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                              取消
                            </Button>
                            <Button onClick={() => setIsAddRoleOpen(false)}>创建角色</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {roles.map((role) => (
                        <Card key={role.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              <Badge variant="secondary">{role.userCount} 用户</Badge>
                            </div>
                            <CardDescription>{role.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium mb-2">权限列表</h4>
                                <div className="flex flex-wrap gap-1">
                                  {role.permissions.map((permission) => (
                                    <Badge key={permission} variant="outline" className="text-xs">
                                      {permission}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center justify-end space-x-2 pt-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>权限列表</CardTitle>
                        <CardDescription>系统中所有可用的权限</CardDescription>
                      </div>
                      <Button className="flex items-center space-x-2" onClick={() => setIsAddPermissionOpen(true)}>
                        <Plus className="h-4 w-4" />
                        <span>添加权限</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {["系统管理", "内容管理", "数据管理"].map((category) => (
                        <div key={category}>
                          <h3 className="text-lg font-semibold mb-3">{category}</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            {permissions
                              .filter((p) => p.category === category)
                              .map((permission) => (
                                <Card key={permission.id}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{permission.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                                      </div>
                                      <Button variant="ghost" size="sm">
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Add Permission Dialog */}
              <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新权限</DialogTitle>
                    <DialogDescription>创建一个新的系统权限</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="permission-name" className="text-right">
                        权限名称
                      </Label>
                      <Input id="permission-name" className="col-span-3" placeholder="例如：数据导出" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="permission-category" className="text-right">
                        权限分类
                      </Label>
                      <Select>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="系统管理">系统管理</SelectItem>
                          <SelectItem value="内容管理">内容管理</SelectItem>
                          <SelectItem value="数据管理">数据管理</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="permission-description" className="text-right">
                        权限描述
                      </Label>
                      <Input id="permission-description" className="col-span-3" placeholder="描述该权限的具体功能" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddPermissionOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={() => setIsAddPermissionOpen(false)}>创建权限</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Tabs>
          </main>
        </div>
      </CompanyGuard>
    </AuthGuard>
  )
}
