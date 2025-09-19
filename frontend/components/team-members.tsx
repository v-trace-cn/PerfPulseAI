"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown, Users, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context-rq"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"

// 团队成员类型定义
interface TeamMember {
  id: number
  name: string
  email: string
  avatar?: string
  companyId?: number
  departmentId?: number
  // 模拟的评分数据 - 后续可以从其他API获取
  complianceScore?: number
  transparencyScore?: number
  accountabilityScore?: number
  totalScore?: number
  status?: string
  role?: string
  department?: string
}

// 获取公司成员的API函数
const fetchCompanyMembers = async (companyId: number): Promise<TeamMember[]> => {
  const response = await fetch(`/api/users/company-members?companyId=${companyId}`)
  if (!response.ok) {
    throw new Error('获取团队成员失败')
  }
  const data = await response.json()
  return data.success ? data.data.items : []
}

// 生成模拟评分数据的函数
const generateMockScores = (id: number) => {
  const base = 80 + (id % 20) // 80-99 的基础分
  return {
    complianceScore: base + Math.floor(Math.random() * 10),
    transparencyScore: base + Math.floor(Math.random() * 10),
    accountabilityScore: base + Math.floor(Math.random() * 10),
    status: Math.random() > 0.8 ? "休假" : "活跃",
    role: ["AI 研究员", "数据科学家", "产品经理", "前端工程师", "后端工程师"][id % 5],
    department: ["研发部", "数据部", "产品部", "技术部"][id % 4]
  }
}

const teamMembers = [
  {
    id: 1,
    name: "张明",
    role: "AI 研究员",
    department: "研发部",
    complianceScore: 92,
    transparencyScore: 88,
    accountabilityScore: 90,
    totalScore: 90,
    status: "活跃",
  },
  {
    id: 2,
    name: "李华",
    role: "数据科学家",
    department: "数据部",
    complianceScore: 95,
    transparencyScore: 85,
    accountabilityScore: 92,
    totalScore: 91,
    status: "活跃",
  },
  {
    id: 3,
    name: "王芳",
    role: "伦理专家",
    department: "伦理委员会",
    complianceScore: 98,
    transparencyScore: 96,
    accountabilityScore: 97,
    totalScore: 97,
    status: "活跃",
  },
  {
    id: 4,
    name: "赵伟",
    role: "产品经理",
    department: "产品部",
    complianceScore: 85,
    transparencyScore: 82,
    accountabilityScore: 88,
    totalScore: 85,
    status: "休假",
  },
  {
    id: 5,
    name: "刘洋",
    role: "治理专员",
    department: "合规部",
    complianceScore: 97,
    transparencyScore: 94,
    accountabilityScore: 96,
    totalScore: 96,
    status: "活跃",
  },
]

export function TeamMembers() {
  const [sortColumn, setSortColumn] = useState("totalScore")
  const [sortDirection, setSortDirection] = useState("desc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const sortedMembers = [...teamMembers].sort((a, b) => {
    // @ts-ignore
    const aValue = a[sortColumn]
    // @ts-ignore
    const bValue = b[sortColumn]

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return (
    <div className="rounded-md border transition-colors duration-300 dark:border-white/10">
      <Table>
        <TableHeader>
          <TableRow className="transition-colors duration-300 dark:border-white/10">
            <TableHead>成员</TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("complianceScore")}>
                合规性
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("transparencyScore")}>
                透明度
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("accountabilityScore")}>
                责任制
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("totalScore")}>
                总分
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMembers.map((member) => (
            <TableRow key={member.id} className="transition-colors duration-300 dark:border-white/10">
              <TableCell className="font-medium">
                <div>
                  <div>{member.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.role} · {member.department}
                  </div>
                </div>
              </TableCell>
              <TableCell>{member.complianceScore}</TableCell>
              <TableCell>{member.transparencyScore}</TableCell>
              <TableCell>{member.accountabilityScore}</TableCell>
              <TableCell className="font-bold">{member.totalScore}</TableCell>
              <TableCell>
                <Badge variant={member.status === "活跃" ? "default" : "secondary"}>{member.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">打开菜单</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-white/10">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    <DropdownMenuItem>查看详情</DropdownMenuItem>
                    <DropdownMenuItem>查看活动历史</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>添加奖励</DropdownMenuItem>
                    <DropdownMenuItem>添加额外分数</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

