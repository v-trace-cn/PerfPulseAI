"use client"

import { useState, useEffect, Suspense } from "react"
import React from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MemberListAvatar } from "@/components/ui/unified-avatar"
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
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
// 迁移到新的纯 React Query 实现
import { useDepartment, useDepartmentMembers } from "@/lib/queries"
import { useAuth } from "@/lib/auth-context"
import NotFoundPage from "@/components/common/NotFoundPage"


function DepartmentDetailsViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("研发部");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState("本周");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setIsValidToken(false);
      return;
    }

    // 验证令牌并获取部门ID
    fetch(`/api/department-access?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDepartmentId(data.departmentId.toString());
          setIsValidToken(true);
        } else {
          // 如果令牌过期且需要新令牌，尝试重定向到组织管理页面
          if (data.needsNewToken) {
            // 延迟重定向，给用户看到错误信息的时间
            setTimeout(() => {
              window.location.href = '/org';
            }, 2000);
          }
          setIsValidToken(false);
        }
      })
      .catch(() => {
        setIsValidToken(false);
      });
  }, [searchParams]);

  // 使用 useQuery 获取部门成员数据
  const { data: membersData, isLoading, error } = useQuery({
    queryKey: ["departmentMembers", departmentId, user?.id],
    queryFn: async () => {
      if (!departmentId || !user?.id) {
        return [];
      }
      const response = await fetch(`/api/departments/${departmentId}/members?userId=${user.id}`).then(res => res.json());
      return response.data || [];
    },
    enabled: !!departmentId && !!user?.id && isValidToken === true,
  });

  // 如果令牌无效，显示404页面
  if (isValidToken === false) {
    return (
      <AuthGuard>
        <CompanyGuard>
          <NotFoundPage
            title="访问被拒绝"
            message="您的访问令牌无效或已过期。正在为您重定向到组织管理页面，请稍候..."
            backUrl="/org"
            backText="立即返回组织管理"
          />
        </CompanyGuard>
      </AuthGuard>
    );
  }

  // 如果还在验证令牌，显示加载状态
  if (isValidToken === null) {
    return (
      <AuthGuard>
        <CompanyGuard>
          <div className="flex flex-col min-h-screen bg-gray-50/90">
            <main className="flex-1 p-4 md:p-8 space-y-8">
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">验证访问权限中...</p>
              </div>
            </main>
          </div>
        </CompanyGuard>
      </AuthGuard>
    );
  }

  // 转换后台数据为前端需要的格式
  const transformMemberData = (backendMember: any) => {
    const baseScore = backendMember.performanceScore || 0;
    const commits = backendMember.kpis?.codeCommits || 0;

    return {
      id: backendMember.id,
      name: backendMember.name,
      email: backendMember.email,
      avatar: backendMember.avatar,
      initials: backendMember.initials,
      title: backendMember.title || "开发工程师",
      level: `P${Math.floor(baseScore / 200) + 5}`, // 根据积分计算等级
      performanceScore: baseScore,
      prCount: commits,
      points: baseScore,
      codeCommits: commits,
      bugsFixed: backendMember.kpis?.bugsFixed || 0,
      newFeatures: backendMember.kpis?.newFeatures || 0,
      codeReviews: Math.floor(commits * 0.3), // 代码审查约为提交数的30%
      skills: backendMember.skills || ["React", "TypeScript", "Node.js"],
      recentWork: backendMember.recentWork || [
        { id: "w1", title: "功能开发", status: "进行中", date: "2024-01-15", priority: "high" },
        { id: "w2", title: "代码审查", status: "已完成", date: "2024-01-10", priority: "medium" },
      ],
      monthlyStats: {
        "2024-01": { prCount: Math.floor(commits * 0.3), points: Math.floor(baseScore * 0.3), commits: Math.floor(commits * 0.3) },
        "2024-02": { prCount: Math.floor(commits * 0.4), points: Math.floor(baseScore * 0.4), commits: Math.floor(commits * 0.4) },
        "2024-03": { prCount: Math.floor(commits * 0.3), points: Math.floor(baseScore * 0.3), commits: Math.floor(commits * 0.3) },
      },
      status: "active",
      joinDate: backendMember.joinDate || "2023-01-01",
      lastActive: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    };
  };



  // 使用后台数据，如果没有数据则使用空数组而不是模拟数据
  const allMembers = membersData && Array.isArray(membersData) && membersData.length > 0
    ? membersData.map(transformMemberData)
    : [];

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
                    <div className="space-y-4">
                      {filteredMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => handleSelectMember(member.id)}
                            />
                            <MemberListAvatar
                              name={member.name}
                              email={member.email}
                              emailFirst={true}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900">{member.email || member.name}</h3>
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  {member.level}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{member.title}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-8 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900">{member.codeCommits}</div>
                              <div className="text-gray-500">PR提交</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-blue-600">{member.points}</div>
                              <div className="text-gray-500">积分</div>
                            </div>
                            <div className="text-center text-gray-400">
                              <div className="text-xs">本月</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default function DepartmentDetailsView() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-gray-50/90">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </main>
      </div>
    }>
      <DepartmentDetailsViewContent />
    </Suspense>
  );
}
