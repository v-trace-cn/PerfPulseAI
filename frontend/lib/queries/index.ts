/**
 * 统一查询入口 - 纯 React Query 实现
 * 零 fetch，零 API 类，纯 React Query
 */

// 导出核心查询客户端
export { 
  queryKeys, 
  useApiQuery, 
  useApiMutation,
  type ApiResponse,
  type PaginatedResponse,
  type QueryConfig,
  type MutationConfig
} from '@/lib/query-client'

// 导出活动相关查询
export {
  useRecentActivities,
  useActivity,
  useActivityByShowId,
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useUpdateActivityStatus,
  usePrDetails,
  useAnalyzePr,
  useCalculatePrPoints,
  useResetActivityPoints,
  useScoringDimensions,
  type Activity,
  type ActivityCreate,
  type ActivityUpdate,
} from '@/lib/queries/activity-queries'

// 导出用户相关查询
export {
  useUserProfile,
  useCurrentUserProfile,
  useUserActivities,
  useUsers,
  useUserLeaderboard,
  useUpdateUserProfile,
  useUploadAvatar,
  useDeleteUser,
  useResetUserPassword,
  useBatchImportUsers,
  useJoinCompany,
  useLeaveCompany,
  useJoinDepartment,
  type User,
  type UserProfile,
  type Achievement,
  type UserStats,
  type UserUpdate,
} from '@/lib/queries/user-queries'

// 导出公司相关查询
export {
  useCompanies,
  useCompany,
  useCurrentCompany,
  useCompanyMembers,
  useCompanyStats,
  useSearchCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useUploadCompanyLogo,
  useInviteToCompany,
  useRemoveCompanyMember,
  useUpdateMemberRole,
  useBatchAssociateCompany,
  useUpdateCompanySettings,
  useAvailableCompanies,
  useUserCompanies,
  useCompanyByInviteCode,
  useVerifyInviteCode,
  type Company,
  type CompanyCreate,
  type CompanyUpdate,
  type CompanyMember,
} from '@/lib/queries/company-queries'

// 导出部门相关查询
export {
  useDepartments,
  useDepartment,
  useCompanyDepartments,
  useCurrentCompanyDepartments,
  useDepartmentMembers,
  useDepartmentHierarchy,
  useDepartmentStats,
  useSearchDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useMoveDepartment,
  useAddDepartmentMember,
  useRemoveDepartmentMember,
  useUpdateDepartmentMemberRole,
  useSetDepartmentManager,
  useBatchAssociateDepartments,
  type Department,
  type DepartmentCreate,
  type DepartmentUpdate,
  type DepartmentMember,
} from '@/lib/queries/department-queries'

// 导出积分相关查询
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
  useRecalculatePoints,
  type PointsBalance,
  type PointsTransaction,
  type PointsOverview,
  type TransferRequest,
  type PointsLedgerRecord,
} from '@/lib/queries/points-queries'

// 导出通知相关查询
export {
  useNotifications,
  useUnreadNotificationCount,
  useNotification,
  useNotificationStats,
  useSystemAnnouncements,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useBatchDeleteNotifications,
  useArchiveNotification,
  useCreateNotification,
  useSendSystemAnnouncement,
  useUpdateNotificationSettings,
  useNotificationSettings,
  type Notification,
  type NotificationCreate,
  type NotificationStats,
} from '@/lib/queries/notification-queries'

// 导出商城相关查询（保留现有的mall-hooks.ts实现）
export {
  useMallItems,
  usePublicMallItems,
  useMallItem,
  useMallAdminItems,
  useMyPurchases,
  useCreateMallItem,
  useUpdateMallItem,
  useDeleteMallItem,
  usePurchaseItem,
  useUpdateStock,
  useRedeemCode,
  useVerifyRedemptionCode,
  exportMallItems,
  type MallItem,
  type CreateMallItemRequest,
  type UpdateMallItemRequest,
  type PurchaseRequest,
  type UpdateStockRequest,
} from '@/lib/mall-hooks'

// ==================== 便捷的查询组合 ====================

/**
 * 获取用户完整信息（包括公司、部门、积分等）
 */
export function useUserCompleteInfo(userId?: string) {
  const profile = useUserProfile(userId)
  const pointsBalance = usePointsBalance()
  const company = useCurrentCompany()
  const departments = useCurrentCompanyDepartments()
  
  return {
    profile,
    pointsBalance,
    company,
    departments,
    isLoading: profile.isLoading || pointsBalance.isLoading || company.isLoading || departments.isLoading,
    error: profile.error || pointsBalance.error || company.error || departments.error,
  }
}

/**
 * 获取仪表板数据
 */
export function useDashboardData() {
  const { user } = useAuth()
  const recentActivities = useRecentActivities(1, 10)
  const pointsOverview = usePointsOverview()
  const unreadNotifications = useUnreadNotificationCount()
  const departments = useCurrentCompanyDepartments()
  
  return {
    user,
    recentActivities,
    pointsOverview,
    unreadNotifications,
    departments,
    isLoading: recentActivities.isLoading || pointsOverview.isLoading || unreadNotifications.isLoading || departments.isLoading,
    error: recentActivities.error || pointsOverview.error || unreadNotifications.error || departments.error,
  }
}

/**
 * 获取组织管理数据
 */
export function useOrganizationData() {
  const companies = useCompanies()
  const departments = useDepartments()
  const users = useUsers()
  
  return {
    companies,
    departments,
    users,
    isLoading: companies.isLoading || departments.isLoading || users.isLoading,
    error: companies.error || departments.error || users.error,
  }
}

// 导入认证上下文
import { useAuth } from '@/lib/auth-context-rq'
