"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Member } from "@/lib/types";
import { Eye, Calendar, ChevronsUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";

interface MemberCardProps {
  member: Member;
  departmentId: string;
}

const statusBadgeVariant = {
  "已完成": "secondary",
  "进行中": "default",
  "待办": "outline",
  "已取消": "destructive",
  "已暂停": "secondary",
} as const;

export default function MemberCard({ member, departmentId }: MemberCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-card rounded-lg border p-6 shadow-sm transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {member.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">绩效评分</p>
            <p className="text-2xl font-bold text-green-500">{member.performanceScore}</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle Details</span>
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="space-y-4 pt-4">
        <div>
          <h4 className="font-semibold text-sm mb-3">关键指标</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-primary">{member.kpis.codeCommits}</p>
              <p className="text-xs text-muted-foreground">代码提交</p>
            </div>
            <div>
              <p className="text-xl font-bold">{member.kpis.codeReviews}</p>
              <p className="text-xs text-muted-foreground">代码审查</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-500">{member.kpis.bugsFixed}</p>
              <p className="text-xs text-muted-foreground">修复Bug</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-500">{member.kpis.projectsLed}</p>
              <p className="text-xs text-muted-foreground">主导项目</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-sm mb-3">专业技能</h4>
          <div className="flex flex-wrap gap-2">
            {member.skills.map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold text-sm mb-3">最近工作</h4>
          <ul className="space-y-2">
            {member.recentWork.map((item) => (
              <li key={item.id} className="flex justify-between items-center text-sm">
                <span>{item.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant[item.status] || "outline"}>{item.status}</Badge>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />

        <div>
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-semibold text-sm">整体表现</h4>
            <span className="text-sm font-bold">{member.overallPerformance}/100</span>
          </div>
          <Progress value={member.overallPerformance} className="h-2" />
        </div>

        <Separator />

        <div className="flex gap-4">
          <Button asChild variant="outline" className="w-full flex items-center gap-2">
            <Link href={`/org/${departmentId}/${member.id}`}>
              <Eye className="h-4 w-4" /> 查看详情
            </Link>
          </Button>
          <Button className="w-full flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 安排会议
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 