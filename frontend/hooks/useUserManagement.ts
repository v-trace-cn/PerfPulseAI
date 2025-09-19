/**
 * 用户管理 Hooks - 纯 React Query 实现
 */
export {
  useUserProfile,
  useCurrentUserProfile,
  useUpdateUserProfile,
  useUploadAvatar,
  useUsers,
  useUserActivities,
  useUserLeaderboard,
  useDeleteUser,
  useResetUserPassword,
  useBatchImportUsers,
  useJoinCompany,
  useLeaveCompany,
  useJoinDepartment,
  type User,
  type UserProfile,
  type UserUpdate
} from '@/lib/queries';

// 兼容性类型别名
export type UserFormData = UserUpdate;
export type { Achievement as UserAchievement } from '@/lib/queries';
