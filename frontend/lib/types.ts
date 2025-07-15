// frontend/lib/types.ts

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: {
    items?: T[];
    activities?: T[];
    rewards?: T[];
    members?: T[];
    total: number;
    page: number;
    perPage: number;
  };
  message: string;
  success: boolean;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  departmentId?: number;
  position?: string;
  phone?: string;
  githubUrl?: string;
  avatar?: string;
  joinDate?: string;
  points: number;
  total_points: number;
  level: number;
  completedTasks?: number;
  pendingTasks?: number;
  createdAt?: string;
  updatedAt?: string;
  skills?: string[];
  companyId?: number;
  companyName?: string;
}

export interface UserProfile extends User {
  completed_activities_count?: number;
}

export interface AuthResponse {
  userId: string;
  name: string;
  email: string;
}

// ============================================================================
// Activity & Work Item Types
// ============================================================================

export interface WorkItem {
  id: string;
  title: string;
  status: '已完成' | '进行中' | '待办' | '已取消' | '已暂停';
  date: string;
  points?: number;
}

export interface Activity {
  id: string;
  showId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  points?: number;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  activityType?: string;
  diffUrl?: string;
  user?: any;
  aiAnalysis?: string;
  aiAnalysisStartedAt?: string;
  aiAnalysisCompletedAt?: string;
  pointsCalculatedAt?: string;
}

export interface RecentActivity {
  id: string;
  showId: string;
  type: string;
  title: string;
  date: string;
  points?: number;
}

// ============================================================================
// Member & Team Types
// ============================================================================

export interface Member {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title: string;
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
  points?: number;
  level?: number;
}

export interface DetailedMember extends Member {
  joinDate?: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  githubUrl?: string;
}

// ============================================================================
// Department & Team Types
// ============================================================================

export interface Department {
  id: number;
  name: string;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStats {
  averageScore: number;
  teamSize: number;
  outstandingEmployees: number;
  totalSkills: number;
}

export interface Team {
  name: string;
  lead: string;
  members: number;
}

// ============================================================================
// Scoring & Performance Types
// ============================================================================

export interface ScoringDimension {
  [key: string]: string;
}

export interface ScoreEntry {
  id: string;
  user_id: string;
  activity_id?: string;
  score: number;
  factors?: any;
  notes?: string;
  created_at: string;
}

export interface PerformanceMetrics {
  governanceIndex: number;
  weeklyGoals: number;
  totalPoints: number;
  complianceStatus: number;
}

// ============================================================================
// Pull Request & Analysis Types
// ============================================================================

export interface PullRequestAnalysis {
  overall_score: number;
  dimensions: { [key: string]: number };
  suggestions: Array<{
    content: string;
    type: string;
  }>;
  points: {
    total_points: number;
    detailed_points: Array<{
      bonus?: number;
      innovation_bonus?: number;
      text: string;
    }>;
  };
  additions: number;
  deletions: number;
  summary: string;
  recommendation?: string;
  innovation_score?: number;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// ============================================================================
// Form & Input Types
// ============================================================================

export interface FormErrors {
  [key: string]: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ProfileUpdateData {
  name?: string;
  position?: string;
  phone?: string;
  githubUrl?: string;
  departmentId?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Export all types for easy importing
// ============================================================================

export type {
  // Re-export commonly used types
  ApiResponse,
  PaginatedResponse,
  User,
  UserProfile,
  Activity,
  Member,
  Department,
  PullRequestAnalysis,
};

// 部门数据结构
export interface Department {
  id: string;
  name: string;
  manager: string;
  memberCount: number;
  activeMembersCount: number;
  performance: number;
  projects: number;
  status: "active" | "archived";
  teams: Team[];
}

export interface DetailedMember {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title: string;
  joinDate?: string;
  performanceScore: number;
  kpis: {
    leadTasks: number;
    newFeatures: number;
    codeCommits: number;
    bugsFixed: number;
  };
  skills: string[];
  recentWork: {
    id: string;
    title: string;
    status: "已完成" | "进行中";
    date: string;
  }[];
  overallPerformance: number;
} 