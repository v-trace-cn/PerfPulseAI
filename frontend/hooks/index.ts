/**
 * 统一Hooks入口 - 纯 React Query 实现
 * 零 fetch，零 API 类，纯 React Query
 */

// 导出新的纯 React Query 查询
export * from '@/lib/queries'

// 保留现有的商城hooks（已经是纯React Query实现）
export * from '@/lib/mall-hooks'

// 导入组合hooks需要的依赖
import { useMallItems } from './useMallRedemption'
import { useMallRecommendations } from './useMallSearch'
import { useMallAnalyticsOverview } from './useMallAnalytics'
import {
  usePointsSummary,
  usePointsTransactions,
  usePointsWeeklyStats
} from './usePoints'
import { useNotifications } from './useNotifications'
import { useCurrentUserProfile } from './useUserManagement'

// ==================== 商城相关Hooks ====================
export {
  useMallItems,
  useRedeemItem,
  useUserRedemptions
} from './useMallRedemption'

export {
  useMallSearch,
  useMallRecommendations,
  useSearchHistory,
  usePopularSearches
} from './useMallSearch'

export {
  useMallAnalyticsOverview,
  useMallTrends,
  processTrendsData,
  formatAnalyticsNumber,
  calculateGrowthRate,
  getTrendIndicator
} from './useMallAnalytics'

export {
  useCreateMallItem,
  useUpdateMallItem,
  useDeleteMallItem,
  useUpdateStock,
  useMallAdminItems
} from './useMallAdmin'

// ==================== 新的商城Query Hooks（极简React Query） ====================
export {
  // 查询hooks
  useMallItems as useMallItemsQuery,
  useMallItem,
  useMallAdminItems as useMallAdminItemsQuery,
  useMyPurchases,
  useMallAnalytics,

  // 变更hooks
  usePurchaseItem,
  useVerifyRedemptionCode,
  useRedeemCode,
  useCreateMallItem as useCreateMallItemQuery,
  useUpdateMallItem as useUpdateMallItemQuery,
  useDeleteMallItem as useDeleteMallItemQuery,
  useUpdateStock as useUpdateStockQuery,

  // 查询键和工具
  mallKeys,
  exportMallItems
} from '@/lib/mall-hooks'

// ==================== 积分相关Hooks ====================
export {
  usePointsBalance,
  usePointsSummary,
  usePointsUnified,
  usePointsTransactions,
  usePointsHistory,
  usePointsWeeklyStats,
  usePointsMonthlyStats,
  usePointsRedemptionStats,
  usePointsLevels,
  useUserLevel,
  useTransferPoints,
  useAccruePoints,
  useAdminUserBalance,
  useAdjustUserPoints,
  useBatchAccruePoints,
  useExportPointsData,
  useRefreshPointsData,
  POINTS_QUERY_KEYS
} from './usePoints'

// ==================== 管理相关Hooks ====================
export {
  useAvailableCompanies,
  useUserCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useJoinCompany,
  useLeaveCompany,
  useCompanyByInviteCode,
  useVerifyInviteCode
} from './useCompanyManagement'

// ==================== 角色权限相关Hooks ====================
export {
  useRoles,
  useRole,
  usePermissions,
  useUserRoles,
  usePermissionCheck,
  useCanViewAdminMenus,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRole,
  useRemoveRole,
  ROLE_QUERY_KEYS
} from './useRole'

// ==================== 权限工具和Hooks ====================
export {
  // 权限检查hooks
  usePermissionCheck as usePermissionCheckUtil,
  useAdminMenuPermission,
  usePermissionGuard,

  // 权限检查函数
  checkPermission,
  checkAdminMenuPermission,
  hasPermission,
  canAccessAdminMenu,
  getPermissionDeniedReason,

  // 权限常量
  PERMISSIONS,
  PERMISSION_QUERY_KEYS,

  // 类型
  type PermissionCheck,
  type AdminMenuPermission,
  type PermissionGuardProps,
  type PermissionCheckResult,
  type PermissionType
} from '@/lib/permission-utils'

// ==================== 活动相关Hooks ====================
export {
  useResetActivityPoints,
  useAnalyzePr,
  useCalculatePrPoints,
  useUpdateActivityStatus
} from './useActivity'

export {
  useDepartments,
  useDepartment,
  useDepartmentById,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useJoinDepartment,
  useLeaveDepartment,
  useDepartmentMembers,
  useDepartmentStats,
  useAssociateDepartmentsToCompany,
  useExportDepartmentData
} from './useDepartmentManagement'

export {
  useUser,
  useCurrentUserProfile,
  useUpdateUser,
  useUploadAvatar,
  useChangePassword,
  useResetPassword,
  useSearchUsers,
  useUserActivities,
  useUserAchievements,
  useUserLeaderboard,
  useUserStats,
  useAdminMenuPermissions
} from './useUserManagement'

// ==================== 通知相关Hooks ====================
export {
  useNotifications
} from './useNotifications'

export {
  useNotificationSSE
} from './useNotificationSSE'

// ==================== 工具Hooks ====================
export {
  usePagination
} from './usePagination'

export {
  useUserProfile
} from './useUserProfile'

export {
  useIsMobile as useMobile
} from './use-mobile'

// ==================== 基础管理Hooks ====================
// 基础管理功能已迁移到 @/lib/queries 中的通用查询系统

// ==================== 常用组合Hooks ====================

/**
 * 商城完整数据Hook - 组合多个商城相关Hook
 */
export function useMallComplete() {
  const items = useMallItems()
  const recommendations = useMallRecommendations(5)
  const analytics = useMallAnalyticsOverview()
  
  return {
    items,
    recommendations,
    analytics,
    isLoading: items.isLoading || recommendations.isLoading || analytics.isLoading,
    error: items.error || recommendations.error || analytics.error
  }
}

/**
 * 积分完整数据Hook - 组合多个积分相关Hook
 */
export function usePointsComplete() {
  const summary = usePointsSummary()
  const transactions = usePointsTransactions({ page: 1, page_size: 10 })
  const weeklyStats = usePointsWeeklyStats()
  
  return {
    summary,
    transactions,
    weeklyStats,
    isLoading: summary.isLoading || transactions.isLoading || weeklyStats.isLoading,
    error: summary.error || transactions.error || weeklyStats.error
  }
}

/**
 * 用户管理完整数据Hook - 组合多个用户相关Hook
 */
export function useUserComplete() {
  const profile = useCurrentUserProfile()
  const pointsSummary = usePointsSummary()
  const notifications = useNotifications()

  return {
    profile,
    pointsSummary,
    notifications,
    isLoading: profile.isLoading || pointsSummary.isLoading || notifications.loading,
    error: profile.error || pointsSummary.error || notifications.error
  }
}

// 导出类型
export type {
  CreateMallItemRequest,
  UpdateMallItemRequest,
  UpdateStockRequest
} from './useMallAdmin'
