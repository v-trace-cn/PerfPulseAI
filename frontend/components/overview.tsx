"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Blocks, Globe, Network, Award } from "lucide-react"

// 部门数据
const departmentData = [
  {
    name: "研发部门",
    合规性: 85,
    透明度: 78,
    责任制: 82,
    创新: 90,
    总分: 84,
    成员数: 24,
    完成任务: 156,
    color: "#4f46e5",
  },
  {
    name: "数据部门",
    合规性: 92,
    透明度: 85,
    责任制: 80,
    创新: 75,
    总分: 83,
    成员数: 18,
    完成任务: 132,
    color: "#06b6d4",
  },
  {
    name: "产品部门",
    合规性: 78,
    透明度: 82,
    责任制: 85,
    创新: 88,
    总分: 83,
    成员数: 20,
    完成任务: 145,
    color: "#10b981",
  },
  {
    name: "伦理部门",
    合规性: 95,
    透明度: 92,
    责任制: 94,
    创新: 70,
    总分: 88,
    成员数: 8,
    完成任务: 62,
    color: "#f59e0b",
  },
  {
    name: "合规部门",
    合规性: 98,
    透明度: 90,
    责任制: 96,
    创新: 65,
    总分: 87,
    成员数: 12,
    完成任务: 98,
    color: "#ec4899",
  },
]

// 公司整体趋势数据
const networkTrendData = [
  { month: "1月", 治理分数: 78, 完成任务: 320, 奖励积分: 980 },
  { month: "2月", 治理分数: 80, 完成任务: 332, 奖励积分: 1020 },
  { month: "3月", 治理分数: 82, 完成任务: 345, 奖励积分: 1080 },
  { month: "4月", 治理分数: 83, 完成任务: 360, 奖励积分: 1150 },
  { month: "5月", 治理分数: 85, 完成任务: 375, 奖励积分: 1200 },
  { month: "6月", 治理分数: 89, 完成任务: 395, 奖励积分: 1250 },
]

// 部门占比数据
const nodeDistribution = departmentData.map((dept) => ({
  name: dept.name,
  value: dept.成员数,
  color: dept.color,
}))

export function Overview() {
  const [viewMode, setViewMode] = useState("nodes")
  const [metricType, setMetricType] = useState("governance")

  const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs defaultValue="nodes" className="w-full sm:w-[400px]" onValueChange={setViewMode}>
          <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/30 rounded-lg">
            <TabsTrigger
              value="nodes"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
            >
              <Blocks className="mr-2 h-3.5 w-3.5" />
              <span>部门视图</span>
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary h-8 rounded-md"
            >
              <Globe className="mr-2 h-3.5 w-3.5" />
              <span>全局视图</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "nodes" && (
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted/30 border-white/10 dark:border-white/10 border-black/5">
              <SelectValue placeholder="选择指标" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 dark:border-white/10 border-black/5">
              <SelectItem value="governance">治理指标</SelectItem>
              <SelectItem value="performance">绩效指标</SelectItem>
              <SelectItem value="distribution">部门分布</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {viewMode === "nodes" && metricType === "governance" && (
        <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">部门治理指标</h3>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shadow-sm">
              <Network className="mr-1 h-3 w-3" />
              实时数据
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip
                formatter={(value) => [`${value}分`, ""]}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                  borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                }}
              />
              <Legend />
              <Bar dataKey="合规性" fill="#4f46e5" />
              <Bar dataKey="透明度" fill="#06b6d4" />
              <Bar dataKey="责任制" fill="#10b981" />
              <Bar dataKey="创新" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === "nodes" && metricType === "performance" && (
        <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">部门绩效指标</h3>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shadow-sm">
              <Network className="mr-1 h-3 w-3" />
              实时数据
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={departmentData}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                  borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="总分" fill="#4f46e5" />
              <Bar yAxisId="right" dataKey="完成任务" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === "nodes" && metricType === "distribution" && (
        <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">部门分布情况</h3>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shadow-sm">
              <Network className="mr-1 h-3 w-3" />
              实时数据
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={nodeDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {nodeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}人`, "成员数"]}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                  borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === "network" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">治理趋势</h3>
              <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 shadow-sm">
                <Network className="mr-1 h-3 w-3" />
                系统数据
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={networkTrendData}>
                <defs>
                  <linearGradient id="colorGov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                    borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="治理分数" stroke="#4f46e5" fillOpacity={1} fill="url(#colorGov)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">任务完成趋势</h3>
                <Badge variant="outline" className="border-secondary/30 text-secondary bg-secondary/10 shadow-sm">
                  <Blocks className="mr-1 h-3 w-3" />
                  任务数据
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={networkTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                      borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                    }}
                  />
                  <Bar dataKey="完成任务" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl p-4 chart-container border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">积分分配趋势</h3>
                <Badge variant="outline" className="border-accent/30 text-accent bg-accent/10 shadow-sm">
                  <Award className="mr-1 h-3 w-3" />
                  积分数据
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={networkTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, rgba(17, 24, 39, 0.8))",
                      borderColor: "var(--tooltip-border, rgba(255, 255, 255, 0.1))",
                    }}
                  />
                  <Line type="monotone" dataKey="奖励积分" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

