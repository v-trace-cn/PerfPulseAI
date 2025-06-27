import { DepartmentStats } from "@/lib/types";

interface DepartmentSummaryProps {
  stats: DepartmentStats;
  departmentName: string;
}

export default function DepartmentSummary({ stats, departmentName }: DepartmentSummaryProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">{departmentName} 整体表现</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold text-primary">{stats.averageScore}</p>
          <p className="text-sm text-muted-foreground">平均绩效</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{stats.teamSize}</p>
          <p className="text-sm text-muted-foreground">团队规模</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-green-500">{stats.outstandingEmployees}</p>
          <p className="text-sm text-muted-foreground">优秀员工</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{stats.totalSkills}</p>
          <p className="text-sm text-muted-foreground">技能总数</p>
        </div>
      </div>
    </div>
  );
} 