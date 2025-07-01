// frontend/lib/types.ts

// 单个工作项
export interface WorkItem {
  id: string;
  title: string;
  status: '已完成' | '进行中' | '待办' | '已取消' | '已暂停';
  date: string;
}

// 成员数据结构
export interface Member {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  initials: string; // e.g., "ZS" for "张三"
  title: string; // e.g., "高级前端工程师"
  performanceScore: number;
  kpis: {
    codeCommits: number;
    codeReviews: number;
    bugsFixed: number;
    projectsLed: number;
  };
  skills: string[];
  recentWork: WorkItem[];
  overallPerformance: number; // 0-100
}

// 部门整体数据
export interface DepartmentStats {
  averageScore: number;
  teamSize: number;
  outstandingEmployees: number;
  totalSkills: number;
}

// 团队数据结构
export interface Team {
  name: string;
  lead: string;
  members: number;
}

// 部门数据结构
export interface Department {
  id: string;
  name: string;
  manager: string;
  members: number;
  performance: number;
  projects: number;
  status: "active" | "archived";
  teams: Team[];
} 