import { Search, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface DepartmentHeaderProps {
  departmentName: string;
  memberCount: number;
}

export default function DepartmentHeader({ departmentName, memberCount }: DepartmentHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Link href="/org">
          <Button variant="outline" size="icon" aria-label="返回">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{departmentName} - 成员详情</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="搜索成员..." className="pl-8 w-48" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{memberCount} 名成员</span>
        </Button>
      </div>
    </div>
  );
} 