import { Search, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Member, DepartmentStats } from "@/lib/types"
import DepartmentHeader from "@/components/organization/DepartmentHeader"
import MembersGrid from "@/components/organization/MembersGrid"
import DepartmentSummary from "@/components/organization/DepartmentSummary"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import MemberCard from "@/components/organization/MemberCard"

// 基础模拟数据
const baseMembers: Member[] = [
  {
    id: "1",
    name: "张三",
    avatar: "/placeholder-user.jpg",
    initials: "ZS",
    title: "高级前端工程师",
    performanceScore: 95,
    kpis: { codeCommits: 156, codeReviews: 89, bugsFixed: 23, projectsLed: 3 },
    skills: ["React", "TypeScript", "Node.js", "Python"],
    recentWork: [
      { id: "w1", title: "用户界面重构", status: "已完成", date: "2024-01-15" },
      { id: "w2", title: "API性能优化", status: "进行中", date: "2024-01-10" },
      { id: "w3", title: "代码审查", status: "已完成", date: "2024-01-08" },
    ],
    overallPerformance: 95,
  },
  {
    id: "2",
    name: "李四",
    avatar: "/placeholder-user.jpg",
    initials: "LS",
    title: "后端工程师",
    performanceScore: 88,
    kpis: { codeCommits: 134, codeReviews: 67, bugsFixed: 18, projectsLed: 2 },
    skills: ["Java", "Spring Boot", "MySQL", "Redis"],
    recentWork: [
      { id: "w4", title: "数据库优化", status: "已完成", date: "2024-01-14" },
      { id: "w5", title: "微服务架构设计", status: "进行中", date: "2024-01-12" },
      { id: "w6", title: "单元测试编写", status: "已完成", date: "2024-01-09" },
    ],
    overallPerformance: 88,
  },
];

// 扩展模拟数据以支持分页
const mockMembers: Member[] = [
  ...baseMembers,
  { ...baseMembers[0], id: "3", name: "王五" },
  { ...baseMembers[1], id: "4", name: "赵六" },
  { ...baseMembers[0], id: "5", name: "孙七" },
  { ...baseMembers[1], id: "6", name: "周八" },
  { ...baseMembers[0], id: "7", name: "吴九" },
  { ...baseMembers[1], id: "8", name: "郑十" },
];

const mockDepartmentStats: DepartmentStats = {
  averageScore: 92,
  teamSize: mockMembers.length,
  outstandingEmployees: 1,
  totalSkills: 8,
};

// 页面组件
export default function DepartmentPage({
  params,
  searchParams,
}: {
  params: { departmentId: string };
  searchParams?: { search?: string };
}) {
  const departmentName = "研发部门"; // 模拟部门名称
  const stats = mockDepartmentStats;
  const searchTerm = searchParams?.search || '';

  // Filter members based on search term (simple case-insensitive name search)
  const filteredMembers = mockMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <DepartmentHeader departmentName={departmentName} memberCount={mockMembers.length} />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/org" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            研发部门 - 成员详情
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索成员..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => {
                const newUrl = new URL(window.location.href);
                if (e.target.value) {
                  newUrl.searchParams.set('search', e.target.value);
                } else {
                  newUrl.searchParams.delete('search');
                }
                window.history.pushState({}, '', newUrl.toString());
              }}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> <span>{filteredMembers.length} 名成员</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} departmentId={params.departmentId} isDetailedView={true} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>没有找到任何成员。</p>
          </div>
        )}
      </div>

      <DepartmentSummary stats={stats} departmentName={departmentName} />
    </div>
  )
} 