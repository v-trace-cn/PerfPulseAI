"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, SlidersHorizontal, ArrowUpDown } from "lucide-react"

interface Member {
  id: string
  name: string
  avatar: string
  role: string
  performance: number
  tasks: number
  status: "active" | "inactive" | "on-leave"
}

const allMembers: Member[] = [
  { id: "1", name: "张三", avatar: "/placeholder-user.jpg", role: "高级工程师", performance: 92, tasks: 5, status: "active" },
  { id: "2", name: "李四", avatar: "/placeholder-user.jpg", role: "前端工程师", performance: 88, tasks: 3, status: "active" },
  { id: "3", name: "王五", avatar: "/placeholder-user.jpg", role: "后端工程师", performance: 95, tasks: 6, status: "on-leave" },
  { id: "4", name: "赵六", avatar: "/placeholder-user.jpg", role: "UI/UX设计师", performance: 85, tasks: 2, status: "active" },
  { id: "5", name: "孙七", avatar: "/placeholder-user.jpg", role: "产品经理", performance: 90, tasks: 4, status: "inactive" },
  { id: "6", name: "周八", avatar: "/placeholder-user.jpg", role: "测试工程师", performance: 89, tasks: 7, status: "active" },
]

interface DepartmentMembersProps {
  departmentName: string
}

export function DepartmentMembers({ departmentName }: DepartmentMembersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Member; direction: "asc" | "desc" } | null>(null)
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
  })

  const handleSort = (key: keyof Member) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedMembers = [...allMembers]
    .filter((member) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        (member.name.toLowerCase().includes(searchLower) || member.role.toLowerCase().includes(searchLower)) &&
        (filters.role === "all" || member.role === filters.role) &&
        (filters.status === "all" || member.status === filters.status)
      )
    })
    .sort((a, b) => {
      if (!sortConfig) return 0
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

  const getStatusBadge = (status: Member["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">在岗</Badge>
      case "inactive":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">离职</Badge>
      case "on-leave":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">休假</Badge>
    }
  }

  const uniqueRoles = ["all", ...Array.from(new Set(allMembers.map(m => m.role)))]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{departmentName} - 成员管理</CardTitle>
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 md:space-x-2">
          <div className="relative w-full md:w-auto md:flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="搜索成员姓名或角色..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Select onValueChange={(value) => setFilters({ ...filters, role: value })} defaultValue="all">
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="所有角色" />
              </SelectTrigger>
              <SelectContent>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>{role === 'all' ? '所有角色' : role}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setFilters({ ...filters, status: value })} defaultValue="all">
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="active">在岗</SelectItem>
                <SelectItem value="inactive">离职</SelectItem>
                <SelectItem value="on-leave">休假</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            邀请新成员
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>成员</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("role")}
                >
                  角色
                  {sortConfig?.key === "role" && <ArrowUpDown className="inline-block ml-1 h-3 w-3" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center"
                  onClick={() => handleSort("performance")}
                >
                  绩效分
                  {sortConfig?.key === "performance" && <ArrowUpDown className="inline-block ml-1 h-3 w-3" />}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-center"
                  onClick={() => handleSort("tasks")}
                >
                  任务数
                  {sortConfig?.key === "tasks" && <ArrowUpDown className="inline-block ml-1 h-3 w-3" />}
                </TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar} alt="Avatar" />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">ID: {member.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-center">{member.performance}</TableCell>
                  <TableCell className="text-center">{member.tasks}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sortedMembers.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            没有找到匹配的成员。
          </div>
        )}
      </CardContent>
    </Card>
  )
} 