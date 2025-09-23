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
  usePointsOverview,
  usePointsTransactions,
  usePointsStats
} from './usePoints'
import { useNotifications } from './useNotifications'
import { useCurrentUserProfile } from './useUserManagement'

// ==================== 商城相关Hooks ====================
export {
  useMallItems,
  useRedeemItem
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
  useMallItems as useMallAdminItems
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
  usePointsOverview,
  usePointsTransactions,
  usePointsStats,
  usePointsLeaderboard,
  usePointsLedger,
  usePointsRules,
  useTransferPoints,
  useAccruePoints,
  useDeductPoints,
  useFreezePoints,
  useUnfreezePoints,
  useCheckPointsConsistency,
  useRecalculatePoints
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
// 角色权限功能暂未实现，相关函数已移除

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
  useRecentActivities,
  useActivity,
  useActivityByShowId,
  useActivities,
  useAnalyzePr,
  useCalculatePrPoints,
  useResetActivityPoints,
  useUpdateActivityStatus,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity
} from './useActivity'

export {
  useDepartments,
  useDepartment,
  useCurrentCompanyDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDepartmentMembers,
  useBatchAssociateDepartments,
  useJoinDepartment
} from './useDepartmentManagement'

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
  useBatchImportUsers
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
  const overview = usePointsOverview()
  const transactions = usePointsTransactions({ page: 1, pageSize: 10 })
  const stats = usePointsStats('week')

  return {
    overview,
    transactions,
    stats,
    isLoading: overview.isLoading || transactions.isLoading || stats.isLoading,
    error: overview.error || transactions.error || stats.error
  }
}

/**
 * 用户管理完整数据Hook - 组合多个用户相关Hook
 */
export function useUserComplete() {
  const profile = useCurrentUserProfile()
  const pointsOverview = usePointsOverview()
  const notifications = useNotifications()

  return {
    profile,
    pointsOverview,
    notifications,
    isLoading: profile.isLoading || pointsOverview.isLoading || notifications.loading,
    error: profile.error || pointsOverview.error || notifications.error
  }
}

// 导出类型
export type {
  CreateMallItemRequest,
  UpdateMallItemRequest,
  UpdateStockRequest
} from './useMallAdmin'
