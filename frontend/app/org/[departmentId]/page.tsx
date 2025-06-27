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
  averageScore: 90,
  teamSize: mockMembers.length,
  outstandingEmployees: 3,
  totalSkills: 12,
};

// 页面组件
export default function DepartmentPage({
  params,
  searchParams,
}: {
  params: { departmentId: string };
  searchParams?: { page?: string };
}) {
  const departmentName = "研发部门"; // 模拟部门名称
  const stats = mockDepartmentStats;
  
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(mockMembers.length / ITEMS_PER_PAGE);

  const paginatedMembers = mockMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageUrl = (page: number) => {
    if (page < 1 || page > totalPages) return "#";
    return `/org/${params.departmentId}?page=${page}`;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <DepartmentHeader departmentName={departmentName} memberCount={mockMembers.length} />
      
      <div className="mb-8">
        <MembersGrid members={paginatedMembers} departmentId={params.departmentId} />
      </div>

      <div className="mb-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={getPageUrl(currentPage - 1)} />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink href={getPageUrl(index + 1)} isActive={currentPage === index + 1}>
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href={getPageUrl(currentPage + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <DepartmentSummary stats={stats} departmentName={departmentName} />
    </div>
  )
} 