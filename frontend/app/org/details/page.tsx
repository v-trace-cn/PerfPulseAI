"use client"

import { useState, useEffect } from "react"
import React from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Users,
  X,
  GitPullRequest,
  Trophy,
  Code,
  Star,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart3,
  TrendingUp
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { unifiedApi } from "@/lib/unified-api"
import { useAuth } from "@/lib/auth-context"

// 扩展的研发部成员数据
const mockDevelopmentMembers = [
  {
    id: "1",
    name: "关键先生",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "GJ",
    title: "高级架构师",
    level: "P7",
    performanceScore: 98,
    prCount: 45,
    points: 98,
    codeCommits: 234,
    bugsFixed: 12,
    newFeatures: 8,
    codeReviews: 67,
    skills: ["React", "TypeScript", "Node.js", "Python", "Docker", "Kubernetes"],
    recentWork: [
      { id: "w1", title: "微服务架构重构", status: "已完成", date: "2024-01-15", priority: "high" },
      { id: "w2", title: "性能监控系统", status: "进行中", date: "2024-01-10", priority: "medium" },
      { id: "w3", title: "代码规范制定", status: "已完成", date: "2024-01-08", priority: "low" },
    ],
    monthlyStats: {
      "2024-01": { prCount: 8, points: 85, commits: 45 },
      "2024-02": { prCount: 12, points: 92, commits: 52 },
      "2024-03": { prCount: 15, points: 98, commits: 67 },
    },
    status: "active",
    joinDate: "2022-03-15",
    lastActive: "2024-01-15T14:30:00Z"
  },
  {
    id: "2",
    name: "全栈工程师",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "QZ",
    title: "全栈开发工程师",
    level: "P6",
    performanceScore: 92,
    prCount: 52,
    points: 92,
    codeCommits: 189,
    bugsFixed: 8,
    newFeatures: 6,
    codeReviews: 43,
    skills: ["Vue.js", "Java", "Spring Boot", "MySQL", "Redis", "AWS"],
    recentWork: [
      { id: "w4", title: "用户管理系统", status: "已完成", date: "2024-01-14", priority: "high" },
      { id: "w5", title: "API网关优化", status: "进行中", date: "2024-01-12", priority: "medium" },
      { id: "w6", title: "单元测试覆盖", status: "计划中", date: "2024-01-09", priority: "low" },
    ],
    monthlyStats: {
      "2024-01": { prCount: 10, points: 78, commits: 38 },
      "2024-02": { prCount: 14, points: 85, commits: 45 },
      "2024-03": { prCount: 18, points: 92, commits: 52 },
    },
    status: "active",
    joinDate: "2022-08-20",
    lastActive: "2024-01-15T16:45:00Z"
  },
  {
    id: "3",
    name: "前端专家",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "QD",
    title: "高级前端工程师",
    level: "P6",
    performanceScore: 89,
    prCount: 38,
    points: 89,
    codeCommits: 156,
    bugsFixed: 15,
    newFeatures: 5,
    codeReviews: 32,
    skills: ["React", "Vue.js", "TypeScript", "Webpack", "Sass", "Jest"],
    recentWork: [
      { id: "w7", title: "组件库重构", status: "进行中", date: "2024-01-13", priority: "high" },
      { id: "w8", title: "移动端适配", status: "已完成", date: "2024-01-11", priority: "medium" },
      { id: "w9", title: "性能优化", status: "已完成", date: "2024-01-07", priority: "high" },
    ],
    monthlyStats: {
      "2024-01": { prCount: 7, points: 72, commits: 32 },
      "2024-02": { prCount: 11, points: 81, commits: 41 },
      "2024-03": { prCount: 14, points: 89, commits: 48 },
    },
    status: "active",
    joinDate: "2023-01-10",
    lastActive: "2024-01-15T11:20:00Z"
  },
  {
    id: "4",
    name: "后端架构师",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "HD",
    title: "后端架构师",
    level: "P7",
    performanceScore: 94,
    prCount: 41,
    points: 94,
    codeCommits: 198,
    bugsFixed: 6,
    newFeatures: 7,
    codeReviews: 55,
    skills: ["Java", "Spring Cloud", "MySQL", "Redis", "Kafka", "Elasticsearch"],
    recentWork: [
      { id: "w10", title: "分布式缓存设计", status: "已完成", date: "2024-01-14", priority: "high" },
      { id: "w11", title: "消息队列优化", status: "进行中", date: "2024-01-12", priority: "medium" },
      { id: "w12", title: "数据库分片", status: "计划中", date: "2024-01-08", priority: "high" },
    ],
    monthlyStats: {
      "2024-01": { prCount: 9, points: 82, commits: 42 },
      "2024-02": { prCount: 13, points: 88, commits: 48 },
      "2024-03": { prCount: 16, points: 94, commits: 55 },
    },
    status: "active",
    joinDate: "2021-11-05",
    lastActive: "2024-01-15T13:15:00Z"
  }
];



export default function DepartmentDetailsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("研发部");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState("本周"); // 时间段选择

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDepartmentId = localStorage.getItem('currentDepartmentId');
      const storedDepartmentName = localStorage.getItem('currentDepartmentName');
      if (storedDepartmentId) {
        setDepartmentId(storedDepartmentId);
        if (storedDepartmentName) {
          setDepartmentName(storedDepartmentName);
        }
      } else {
        router.push('/org');
      }
    }
  }, [router]);

  // 使用 useQuery 获取部门成员数据
  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ["departmentMembers", departmentId, user?.id],
    queryFn: () => {
      if (!departmentId || !user?.id) {
        return Promise.resolve([]);
      }
      return unifiedApi.department.getMembers(departmentId, user.id.toString()).then(res => res.data);
    },
    enabled: !!departmentId && !!user?.id,
  });

  // 转换后台数据为前端需要的格式
  const transformMemberData = (backendMember: any) => {
    return {
      id: backendMember.id,
      name: backendMember.name,
      avatar: backendMember.avatar,
      initials: backendMember.initials,
      title: backendMember.title || "开发工程师",
      level: `P${Math.floor(Math.random() * 3) + 5}`, // P5-P7
      performanceScore: backendMember.performanceScore || 85,
      prCount: backendMember.kpis?.codeCommits || Math.floor(Math.random() * 50) + 20,
      points: backendMember.performanceScore || Math.floor(Math.random() * 100) + 50,
      codeCommits: backendMember.kpis?.codeCommits || Math.floor(Math.random() * 200) + 100,
      bugsFixed: backendMember.kpis?.bugsFixed || Math.floor(Math.random() * 20) + 5,
      newFeatures: backendMember.kpis?.newFeatures || Math.floor(Math.random() * 10) + 2,
      codeReviews: Math.floor(Math.random() * 50) + 20,
      skills: backendMember.skills || ["React", "TypeScript", "Node.js"],
      recentWork: backendMember.recentWork || [
        { id: "w1", title: "功能开发", status: "进行中", date: "2024-01-15", priority: "high" },
        { id: "w2", title: "代码审查", status: "已完成", date: "2024-01-10", priority: "medium" },
      ],
      monthlyStats: {
        "2024-01": { prCount: Math.floor(Math.random() * 15) + 5, points: Math.floor(Math.random() * 30) + 70, commits: Math.floor(Math.random() * 50) + 30 },
        "2024-02": { prCount: Math.floor(Math.random() * 15) + 5, points: Math.floor(Math.random() * 30) + 70, commits: Math.floor(Math.random() * 50) + 30 },
        "2024-03": { prCount: Math.floor(Math.random() * 15) + 5, points: Math.floor(Math.random() * 30) + 70, commits: Math.floor(Math.random() * 50) + 30 },
      },
      status: "active",
      joinDate: backendMember.joinDate || "2023-01-01",
      lastActive: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // 最近7天内
    };
  };

  // 使用后台数据或回退到模拟数据
  const allMembers = membersData && membersData.length > 0
    ? membersData.map(transformMemberData)
    : mockDevelopmentMembers;

  // 过滤成员
  const filteredMembers = allMembers.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || member.level === levelFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  // 获取级别列表
  const levels = [...new Set(allMembers.map(member => member.level))];

  // 计算实际统计数据
  const actualStats = {
    totalMembers: allMembers.length,
    averageScore: allMembers.length > 0 ? Math.round(allMembers.reduce((sum, member) => sum + member.performanceScore, 0) / allMembers.length) : 0,
    totalPRs: allMembers.reduce((sum, member) => sum + member.prCount, 0),
    totalPoints: allMembers.reduce((sum, member) => sum + member.points, 0),
    totalCommits: allMembers.reduce((sum, member) => sum + member.codeCommits, 0),
    totalBugsFixed: allMembers.reduce((sum, member) => sum + member.bugsFixed, 0),
    totalFeatures: allMembers.reduce((sum, member) => sum + member.newFeatures, 0),
    totalCodeReviews: allMembers.reduce((sum, member) => sum + member.codeReviews, 0),
    monthlyGrowth: {
      prCount: 12.5,
      points: 8.3,
      commits: 15.2
    }
  };

  // 处理成员选择
  const handleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(member => member.id));
    }
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 处理成员详情展开/收起
  const toggleMemberExpansion = (memberId: string) => {
    setExpandedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 导出数据功能
  const handleExportData = () => {
    const selectedData = allMembers.filter(member => selectedMembers.includes(member.id));
    const dataToExport = selectedData.length > 0 ? selectedData : filteredMembers;

    // 创建CSV内容
    const csvContent = [
      [`${departmentName}成员数据导出 - ${timePeriod}`, `导出时间: ${new Date().toLocaleString()}`],
      [],
      ["姓名", "职位", "级别", "绩效分", "PR数量", "积分", "代码提交", "修复Bug", "新功能", "代码审查", "状态"],
      ...dataToExport.map(member => [
        member.name,
        member.title,
        member.level,
        member.performanceScore,
        member.prCount,
        member.points,
        member.codeCommits,
        member.bugsFixed,
        member.newFeatures,
        member.codeReviews,
        member.status === "active" ? "在职" : "离职"
      ])
    ].map(row => row.join(",")).join("\n");

    // 下载CSV文件
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${departmentName}_成员数据_${timePeriod}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <AuthGuard>
      <CompanyGuard>
        <div className="min-h-screen bg-gray-50/50">
      <div className="p-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" />
                研发部成员详情
              </h1>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">团队成员</p>
                  <p className="text-2xl font-bold text-gray-900">{actualStats.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总PR数</p>
                  <p className="text-2xl font-bold text-gray-900">{actualStats.totalPRs}</p>
                  <p className="text-xs text-green-600">+{actualStats.monthlyGrowth.prCount}%</p>
                </div>
                <GitPullRequest className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总积分</p>
                  <p className="text-2xl font-bold text-gray-900">{actualStats.totalPoints}</p>
                  <p className="text-xs text-green-600">+{actualStats.monthlyGrowth.points}%</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均积分</p>
                  <p className="text-2xl font-bold text-gray-900">{actualStats.averageScore}</p>
                  <p className="text-xs text-blue-600">优秀水平</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Period Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                时间段统计
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="本周">本周</SelectItem>
                    <SelectItem value="上周">上周</SelectItem>
                    <SelectItem value="本月">本月</SelectItem>
                    <SelectItem value="上月">上月</SelectItem>
                    <SelectItem value="本季度">本季度</SelectItem>
                    <SelectItem value="上季度">上季度</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExportData}
                  disabled={filteredMembers.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出数据 ({selectedMembers.length > 0 ? selectedMembers.length : filteredMembers.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600">本期PR提交</p>
                  <p className="text-2xl font-bold text-blue-900">{actualStats.totalPRs}</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    较上期 +{actualStats.monthlyGrowth.prCount}%
                  </p>
                </div>
                <GitPullRequest className="h-8 w-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-600">本期积分获得</p>
                  <p className="text-2xl font-bold text-green-900">{actualStats.totalPoints}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    较上期 +{actualStats.monthlyGrowth.points}%
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-purple-600">本期代码提交</p>
                  <p className="text-2xl font-bold text-purple-900">{actualStats.totalCommits}</p>
                  <p className="text-xs text-purple-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    较上期 +{actualStats.monthlyGrowth.commits}%
                  </p>
                </div>
                <Code className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Member List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>人员列表</CardTitle>
                  <CardDescription>{departmentName}成员详细信息 ({filteredMembers.length} 人)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    已选择 {selectedMembers.length} 人
                  </Badge>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索成员姓名或职位..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="级别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部级别</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">在职</SelectItem>
                      <SelectItem value="inactive">离职</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleSelectAll} className="w-full md:w-auto">
                    {selectedMembers.length === filteredMembers.length ? "取消全选" : "全选"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium mb-2">加载中...</p>
                  <p className="text-sm">正在获取成员数据</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-500">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">加载失败</p>
                  <p className="text-sm">无法获取成员数据，请稍后重试</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">暂无成员</p>
                  <p className="text-sm">当前筛选条件下没有找到相关成员</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <DevelopmentMemberCard
                    key={member.id}
                    member={member}
                    isSelected={selectedMembers.includes(member.id)}
                    isExpanded={expandedMembers.includes(member.id)}
                    onSelect={handleSelectMember}
                    onToggleExpansion={toggleMemberExpansion}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      </CompanyGuard>
    </AuthGuard>
  );
}

// 研发部成员卡片组件
function DevelopmentMemberCard({
  member,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpansion
}: {
  member: any
  isSelected: boolean
  isExpanded: boolean
  onSelect: (id: string) => void
  onToggleExpansion: (id: string) => void
}) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "已完成": return "bg-green-100 text-green-800";
      case "进行中": return "bg-blue-100 text-blue-800";
      case "计划中": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {/* 成员基本信息 - 始终显示 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => onToggleExpansion(member.id)}
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar} alt={member.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {member.initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900">{member.name}</h3>
              <Badge variant="outline" className="text-xs">
                研发部
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{member.title}</p>
          </div>

          {/* 右侧数据 - 收起状态显示 */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-900">{member.prCount}</p>
              <p className="text-xs text-gray-600">PR提交</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-purple-600">{member.points}</p>
              <p className="text-xs text-gray-600">积分</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">本月</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(member.id);
            }}
          >
            {isSelected ? "已选择" : "选择"}
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 展开状态下的详细信息 */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* 详细信息 */}
          <div className="pt-4 mb-4">
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              <span>入职时间: {new Date(member.joinDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>最后活跃: {formatTime(member.lastActive)}</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {member.level}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {member.status === "active" ? "在职" : "离职"}
              </Badge>
            </div>
          </div>

          {/* 绩效指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{member.prCount}</div>
              <div className="text-xs text-gray-600">PR提交</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{member.points}</div>
              <div className="text-xs text-gray-600">积分</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{member.codeCommits}</div>
              <div className="text-xs text-gray-600">代码提交</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{member.performanceScore}</div>
              <div className="text-xs text-gray-600">绩效评分</div>
            </div>
          </div>

          {/* 技能标签 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">技能栈</h4>
            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* 最近工作 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">最近工作</h4>
            <div className="space-y-2">
              {member.recentWork.slice(0, 3).map((work: any) => (
                <div key={work.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{work.title}</p>
                    <p className="text-xs text-gray-500">{work.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(work.priority)}`}
                    >
                      {work.priority === 'high' ? '高' : work.priority === 'medium' ? '中' : '低'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(work.status)}`}
                    >
                      {work.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
  );
}