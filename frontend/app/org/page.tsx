"use client"

import React, { useState } from "react"
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
import { DepartmentMembers } from "@/components/organization/DepartmentMembers"
import { DepartmentSettings } from "@/components/organization/DepartmentSettings"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const departments = [
  {
    id: "d1",
    name: "研发部",
    manager: "张三",
    members: 25,
    performance: 92,
    projects: 8,
    status: "active",
    teams: [
      { name: "核心后端组", lead: "李四", members: 8 },
      { name: "创新前端组", lead: "王五", members: 6 },
      { name: "数据科学组", lead: "赵六", members: 5 },
      { name: "质量保障组", lead: "孙七", members: 6 },
    ],
  },
  {
    id: "d2",
    name: "产品部",
    manager: "周八",
    members: 15,
    performance: 88,
    projects: 5,
    status: "active",
    teams: [
      { name: "用户体验组", lead: "吴九", members: 7 },
      { name: "商业化组", lead: "郑十", members: 8 },
    ],
  },
  {
    id: "d3",
    name: "市场部",
    manager: "冯十一",
    members: 18,
    performance: 95,
    projects: 12,
    status: "active",
    teams: [
      { name: "内容营销组", lead: "陈十二", members: 10 },
      { name: "渠道合作组", lead: "楚十三", members: 8 },
    ],
  },
  {
    id: "d4",
    name: "行政部",
    manager: "魏十四",
    members: 10,
    performance: 85,
    projects: 2,
    status: "archived",
    teams: [{ name: "综合支持组", lead: "蒋十五", members: 10 }],
  },
]

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

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
                {departments.reduce((sum, d) => sum + d.members, 0)}
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
                  departments.length
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
                <CardTitle>部门列表</CardTitle>
                {/* <Button className="text-sm px-2 py-1">
                  <Plus className="mr-1 h-3 w-3" />
                  添加新部门
                </Button> */}
                </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]"></TableHead>
                      <TableHead>部门名称</TableHead>
                      <TableHead>经理</TableHead>
                      <TableHead className="text-center">成员数</TableHead>
                      <TableHead className="text-center">绩效分</TableHead>
                      <TableHead className="text-center">状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department) => (
                      <React.Fragment key={department.id}>
                        <TableRow key={department.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(department.id)}
                            >
                              {expanded[department.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {department.name}
                          </TableCell>
                          <TableCell>{department.manager}</TableCell>
                          <TableCell className="text-center">
                            {department.members}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                department.performance > 90
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {department.performance}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                department.status === "active"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {department.status === "active" ? "活跃" : "归档"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="mr-2">
                                  <Users className="h-4 w-4"/>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DepartmentMembers departmentName={department.name} />
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="mr-2">
                                  <Settings className="h-4 w-4"/>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                  <DepartmentSettings department={department} />
                              </DialogContent>
                            </Dialog>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <BarChart2 className="mr-2 h-4 w-4" />
                                  查看分析
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  删除部门
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {expanded[department.id] && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4 bg-gray-50">
                                <h4 className="font-semibold text-md mb-3 ml-2">团队列表</h4>
                                <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>团队名称</TableHead>
                                          <TableHead>负责人</TableHead>
                                          <TableHead className="text-right">成员数</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {department.teams.map((team) => (
                                      <TableRow key={team.name}>
                                        <TableCell>{team.name}</TableCell>
                                        <TableCell>{team.lead}</TableCell>
                                        <TableCell className="text-right">{team.members}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
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
