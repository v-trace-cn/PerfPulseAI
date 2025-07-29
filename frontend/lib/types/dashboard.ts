// Dashboard 相关类型定义

import { LucideIcon } from 'lucide-react';
import { PointTransaction, UserPointsSummary, MonthlyStats, WeeklyStats, RedemptionStats } from './points';

// 基础组件 Props 类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 加载状态类型
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// 分页相关类型
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

// 用户数据类型（扩展）
export interface ExtendedUserData {
  id?: string | number;
  name: string;
  email: string;
  department: string;
  position: string;
  phone: string;
  githubUrl: string;
  joinDate: string;
  points: number;
  level: number;
  companyName?: string;
  skills: string[];
  achievements?: Achievement[];
  // 可选的统计信息
  totalEarned?: number;
  totalSpent?: number;
  monthlyEarned?: number;
  monthlySpent?: number;
  progressPercentage?: number;
}

// 成就类型
export interface Achievement {
  id: string;
  title: string;
  icon: string;
  date: string;
  description?: string;
  category?: string;
}

// 积分概览数据类型
export interface PointsSummaryData {
  currentPoints: number;
  totalEarned: number;
  totalSpent: number;
  level: number;
  nextLevelPoints: number;
  redeemCount: number;
  progressPercentage: number;
  pointsRank?: number;
  totalUsers?: number;
}

// 兑换记录类型
export interface RedemptionRecord {
  id: number;
  item: string;
  points: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
  category: string;
  description?: string;
  orderId?: string;
}

// 积分历史记录类型（用于显示）
export interface PointsHistoryRecord {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  date: string;
  category: string;
  canDispute?: boolean;
  disputeTimeLeft?: number;
}

// 组件 Props 类型定义

// 积分概览卡片组件 Props
export interface PointsSummaryCardsProps extends LoadingState {
  data: PointsSummaryData;
}

// 积分标签页组件 Props
export interface PointsTabsProps extends LoadingState {
  currentPoints: number;
  userId?: string | number;
  redemptionHistory?: RedemptionRecord[];
}

// 积分历史组件 Props
export interface PointsHistoryProps extends LoadingState {
  userId?: string | number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

// 积分商城组件 Props
export interface PointsMallProps extends LoadingState {
  currentPoints: number;
  onRedeem?: (rewardId: string, points: number) => void;
}

// 个人资料卡片组件 Props
export interface ProfileCardProps extends LoadingState {
  userData: ExtendedUserData;
  setUserData: (userData: ExtendedUserData) => void;
  mounted: boolean;
  onEdit?: () => void;
}

// 个人资料编辑对话框 Props
export interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: ExtendedUserData;
  setUserData: (userData: ExtendedUserData) => void;
  selectedDepartment?: string;
  setSelectedDepartment: (departmentId: string | undefined) => void;
  departments: Department[];
  isLoadingDepartments: boolean;
  user?: { id?: number; companyId?: number };
  onSave: (e: React.FormEvent) => void;
}

// 部门类型
export interface Department {
  id: number;
  name: string;
  description?: string;
  memberCount?: number;
  companyId?: number;
}

// 个人成就组件 Props
export interface ProfileAchievementsProps extends LoadingState {
  userData: ExtendedUserData;
  achievements?: Achievement[];
}

// 同事对话框组件 Props
export interface ColleagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColleague: ExtendedUserData | null;
  mounted: boolean;
}

// Dashboard 标签页组件 Props
export interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// 完整的积分概览组件 Props
export interface PointsOverviewWithStatsProps {
  pointsSummary?: UserPointsSummary;
  pointsSummaryLoading: boolean;
  pointsTransactions?: { transactions: PointTransaction[]; totalCount: number };
  pointsTransactionsLoading: boolean;
  pointsTransactionsError?: Error;
  monthlyStats?: MonthlyStats;
  monthlyStatsLoading: boolean;
  weeklyStats?: WeeklyStats;
  weeklyStatsLoading: boolean;
  redemptionStats?: RedemptionStats;
  redemptionStatsLoading: boolean;
}

// 默认值常量
export const DEFAULT_USER_DATA: ExtendedUserData = {
  name: '',
  email: '',
  department: '',
  position: '',
  phone: '',
  githubUrl: '',
  joinDate: new Date().toLocaleDateString('zh-CN'),
  points: 0,
  level: 1,
  skills: [],
  achievements: [],
  totalEarned: 0,
  totalSpent: 0,
  monthlyEarned: 0,
  monthlySpent: 0,
  progressPercentage: 0,
};

export const DEFAULT_POINTS_SUMMARY: PointsSummaryData = {
  currentPoints: 0,
  totalEarned: 0,
  totalSpent: 0,
  level: 1,
  nextLevelPoints: 0,
  redeemCount: 0,
  progressPercentage: 0,
  pointsRank: 0,
  totalUsers: 0,
};

export const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalCount: 0,
};

// 工具函数类型
export type DataTransformer<T, R> = (data: T) => R;
export type EventHandler<T = void> = (data?: T) => void;
export type AsyncEventHandler<T = void> = (data?: T) => Promise<void>;

// 表单验证类型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'textarea';
  rules?: ValidationRule[];
  options?: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export interface FormErrors {
  [fieldName: string]: string;
}
