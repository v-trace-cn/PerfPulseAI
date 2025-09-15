import { useAuth } from '@/lib/auth-context';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, SUCCESS_MESSAGES } from './useApiMutation';
import { unifiedApi } from '@/lib/unified-api';

export interface User {
  id: number;
  name: string;
  email: string;
  githubUrl?: string;
  avatar?: string;
  department?: string;
  departmentId?: number;
  position?: string;
  phone?: string;
  joinDate?: string;
  points: number;
  total_points: number;
  level: number;
  completed_activities_count: number;
  pendingTasks?: number;
  createdAt?: string;
  updatedAt?: string;
  companyId?: number;
  companyName?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  position?: string;
  phone?: string;
  githubUrl?: string;
  departmentId?: number;
  password?: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: string;
}

/**
 * 获取用户信息的Hook
 */
export function useUser(userId: number) {
  return useApiQuery(
    ['user', userId],
    () => unifiedApi.user.getById(userId),
    {
      enabled: !!userId,
      staleTime: 300000, // 5分钟缓存
    }
  );
}

/**
 * 获取当前用户详细信息的Hook
 */
export function useCurrentUserProfile() {
  const { user } = useAuth();
  
  return useApiQuery(
    ['userProfile', user?.id],
    () => unifiedApi.user.getById(user?.id || 0),
    {
      enabled: !!user?.id,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 获取用户成就的Hook
 */
export function useUserAchievements(userId: number) {
  return useApiQuery(
    ['user-achievements', userId],
    () => unifiedApi.user.getAchievements(userId),
    {
      enabled: !!userId,
      staleTime: 300000, // 5分钟缓存
    }
  );
}

/**
 * 更新用户信息的Hook
 */
export function useUpdateUser() {
  const { refreshUser } = useAuth();
  
  return useApiMutation(
    ({ userId, data }: { userId: number; data: UserFormData }) =>
      unifiedApi.user.update(userId, data),
    {
      successMessage: SUCCESS_MESSAGES.UPDATE,
      invalidateQueries: ['user', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

/**
 * 上传用户头像的Hook
 */
export function useUploadAvatar() {
  const { refreshUser } = useAuth();
  
  return useApiMutation(
    ({ userId, file }: { userId: number; file: File }) =>
      unifiedApi.user.uploadAvatar(userId, file),
    {
      successMessage: "头像上传成功",
      invalidateQueries: ['user', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

/**
 * 获取用户统计数据的Hook
 */
export function useUserStats(userId: number, timeRange?: string) {
  return useApiQuery(
    ['user-stats', userId, timeRange],
    () => unifiedApi.user.getStats(userId, timeRange),
    {
      enabled: !!userId,
      staleTime: 300000, // 5分钟缓存
    }
  );
}

/**
 * 获取用户活动历史的Hook
 */
export function useUserActivities(userId: number, page = 1, limit = 10) {
  return useApiQuery(
    ['user-activities', userId, page, limit],
    () => unifiedApi.user.getActivities(userId, page, limit),
    {
      enabled: !!userId,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 获取用户排行榜的Hook
 */
export function useUserLeaderboard(type: 'points' | 'activities' | 'contributions' = 'points', limit = 10) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['user-leaderboard', type, limit, user?.companyId],
    () => unifiedApi.user.getLeaderboard(type, limit, user?.companyId),
    {
      enabled: !!user?.companyId,
      staleTime: 300000, // 5分钟缓存
    }
  );
}

/**
 * 搜索用户的Hook
 */
export function useSearchUsers(query: string, filters?: {
  departmentId?: number;
  companyId?: number;
  role?: string;
}) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['search-users', query, filters, user?.companyId],
    () => unifiedApi.user.search(query, {
      ...filters,
      companyId: filters?.companyId || user?.companyId,
    }),
    {
      enabled: !!query.trim() && query.length >= 2,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 重置用户密码的Hook
 */
export function useResetPassword() {
  return useApiMutation(
    (email: string) => unifiedApi.user.resetPassword(email),
    {
      successMessage: "密码重置邮件已发送",
      showSuccessToast: true,
    }
  );
}

/**
 * 更改用户密码的Hook
 */
export function useChangePassword() {
  return useApiMutation(
    ({ userId, oldPassword, newPassword }: { 
      userId: number; 
      oldPassword: string; 
      newPassword: string; 
    }) => unifiedApi.user.changePassword(userId, oldPassword, newPassword),
    {
      successMessage: "密码修改成功",
      showSuccessToast: true,
    }
  );
}

/**
 * 检查用户管理菜单权限的Hook
 */
export function useAdminMenuPermissions(companyId: number, userId: string) {
  return useApiQuery(
    ['admin-menu-permissions', companyId, userId],
    () => unifiedApi.permission.canViewAdminMenus(companyId, userId),
    {
      enabled: !!companyId && !!userId,
      staleTime: 300000, // 5分钟缓存
    }
  );
}
