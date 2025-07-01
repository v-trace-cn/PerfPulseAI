"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, X } from "lucide-react"
import Link from "next/link"
import DepartmentHeader from "@/components/organization/DepartmentHeader"
import DepartmentSummary from "@/components/organization/DepartmentSummary"
import MemberCard from "@/components/organization/MemberCard"
import { DetailedMember, DepartmentStats } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { directDepartmentApi } from "@/lib/direct-api"
import { useRouter } from "next/navigation"; // 引入 useRouter

// Mock data for members (will be replaced by fetched data)
const mockMembers: DetailedMember[] = [
  {
    id: "1",
    name: "张三",
    avatar: "/placeholder-user.jpg",
    initials: "ZS",
    title: "高级前端工程师",
    performanceScore: 95,
    kpis: { codeCommits: 156, leadTasks: 89, bugsFixed: 23, newFeatures: 3 },
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
    kpis: { codeCommits: 134, leadTasks: 67, bugsFixed: 18, newFeatures: 2 },
    skills: ["Java", "Spring Boot", "MySQL", "Redis"],
    recentWork: [
      { id: "w4", title: "数据库优化", status: "已完成", date: "2024-01-14" },
      { id: "w5", title: "微服务架构设计", status: "进行中", date: "2024-01-12" },
      { id: "w6", title: "单元测试编写", status: "已完成", date: "2024-01-09" },
    ],
    overallPerformance: 88,
  },
];

const mockDepartmentStats: DepartmentStats = {
  averageScore: 92,
  teamSize: 0, // This will be dynamically updated with fetched data
  outstandingEmployees: 1,
  totalSkills: 8,
};

// 渐变色数量
const gradientCount = 8;

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDepartmentId = localStorage.getItem('currentDepartmentId');
      if (storedDepartmentId) {
        setDepartmentId(storedDepartmentId);
      } else {
        // 如果 localStorage 中没有 departmentId，则重定向到 /org 页面
        router.push('/org');
      }
    }
  }, [router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["departmentMembers", departmentId],
    queryFn: () => {
      if (!departmentId) {
        return Promise.resolve([]); // 如果没有 departmentId，不发起请求
      }
      return directDepartmentApi.getDepartmentMembers(departmentId).then(res => res.data);
    },
    enabled: !!departmentId, // 只有当 departmentId 存在时才启用查询
  });

  // Use actual fetched data, or fallback to an empty array
  const allMembers: DetailedMember[] = data || [];

  const departmentName = "研发部门"; // Placeholder, ideally fetched from another API call or context
  const stats = { ...mockDepartmentStats, teamSize: allMembers.length }; // Dynamically update teamSize

  const filteredMembers = allMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!departmentId) {
    return <p className="text-center text-gray-500">正在加载部门信息...</p>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="cursor-pointer">
        <DepartmentHeader
          departmentName={departmentName}
          memberCount={stats.teamSize}
          departmentId={departmentId}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-center text-gray-500">加载成员数据...</p>
        ) : error ? (
          <p className="text-center text-red-500">加载成员数据失败: {error.message}</p>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            没有找到匹配的成员。
          </div>
        ) : (
          // 随机分配 colorIndex
          filteredMembers.map((member, idx) => {
            const colorIndex = Math.floor(Math.random() * gradientCount);
            return <MemberCard key={member.id} member={member} colorIndex={colorIndex} />;
          })
        )}
      </div>
    </div>
  );
} 