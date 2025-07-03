"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DetailedMember } from "@/lib/types"; // 假设 DetailedMember 已包含所有需要字段
import { 
  Briefcase, 
  Calendar, 
  ChevronDown,
  Star,
  Zap,
  Wrench,
  GitCommit,
  Plus,
  Rocket,
  ShieldCheck,
  Code
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const statusStyles: { [key: string]: { icon: React.ElementType, badgeClass: string } } = {
  "进行中": { icon: Zap, badgeClass: "bg-blue-100 text-blue-800" },
  "已完成": { icon: ShieldCheck, badgeClass: "bg-green-100 text-green-800" },
};

const kpiConfig: { key: keyof DetailedMember['kpis'], label: string, icon: React.ElementType, color: string }[] = [
  { key: 'leadTasks', label: '主导任务', icon: Star, color: 'text-yellow-500' },
  { key: 'newFeatures', label: '新增功能', icon: Rocket, color: 'text-purple-500' },
  { key: 'codeCommits', label: '代码提交', icon: GitCommit, color: 'text-blue-500' },
  { key: 'bugsFixed', label: '修复Bug', icon: Wrench, color: 'text-red-500' },
];

const gradientList = [
  'from-white to-[#e0e7ff]',   // 淡蓝紫
  'from-white to-[#bae6fd]',   // 淡天蓝
  'from-white to-[#ddd6fe]',   // 淡紫
];

interface MemberCardProps {
  member: DetailedMember;
  colorIndex: number;
}

export default function MemberCard({ member, colorIndex }: MemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const gradient = gradientList[colorIndex % gradientList.length];

  return (
    <Card className={`w-full bg-gradient-to-br ${gradient} rounded-2xl shadow-lg border-0 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.03]`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-8 py-6 cursor-pointer group">
            {/* 左侧头像+信息 */}
            <div className="flex items-center space-x-5">
              <Avatar className="h-14 w-14 border-4 border-white shadow-md">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-300 text-gray-600 font-bold">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-bold text-gray-900 mb-1">{member.name}</div>
                <div className="text-xs text-gray-400 font-medium">{member.title}</div>
              </div>
            </div>
            {/* 右侧积分和箭头 */}
            <div className="flex flex-col items-end min-w-[80px]">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-cyan-400 text-transparent bg-clip-text leading-none">
                {member.performanceScore}
              </span>
              <span className="text-xs text-gray-400 mt-1">积分总数</span>
            </div>
            <ChevronDown className={`ml-4 w-6 h-6 text-gray-400 transition-transform duration-300 group-hover:text-blue-500 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-6 pt-0">
            {/* KPIs Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">关键指标</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiConfig.map(kpi => (
                  <div key={kpi.key} className="bg-gray-50/80 p-4 rounded-lg flex items-center space-x-3 transition-colors hover:bg-gray-100">
                    <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{member.kpis[kpi.key]}</p>
                      <p className="text-xs text-gray-500">{kpi.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {/* Recent Work */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">最近工作</h4>
                <ul className="space-y-3">
                  {member.recentWork.slice(0, 3).map((work) => {
                    const StatusIcon = statusStyles[work.status]?.icon || Zap;
                    const badgeClass = statusStyles[work.status]?.badgeClass || "bg-gray-100 text-gray-800";
                    return (
                      <li key={work.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <StatusIcon className="w-4 h-4 mr-3 text-gray-500" />
                          <span>{work.title}</span>
                        </div>
                        <Badge variant="outline" className={`font-normal text-xs ${badgeClass}`}>{work.status}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {/* Skills */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-3">专业技能</h4>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer">
                      <Code className="w-3 h-3 mr-1.5" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
} 