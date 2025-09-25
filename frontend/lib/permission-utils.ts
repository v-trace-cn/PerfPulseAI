/**
 * 权限检查相关的工具函数和hooks
 */
import {
  useApiQuery,
  request
} from '@/lib/query-client'

// ==================== 类型定义 ====================

export interface PermissionCheck {
  hasPermission: boolean
  permission: string
  userId?: string
  companyId?: string
}

export interface AdminMenuPermission {
  success: boolean
  data: {
    canView: boolean
    canOrg: boolean
    canMall: boolean
    canRedemption: boolean
    reason: string
  }
  message: string
}

// ==================== 权限API函数 ====================

/**
 * 检查通用权限
 */
export const checkPermission = async (params: {
  permission: string
  companyId?: string
  userId?: string
}): Promise<PermissionCheck> => {
  const searchParams = new URLSearchParams()
  searchParams.append('permission', params.permission)
  if (params.companyId) searchParams.append('companyId', params.companyId)
  if (params.userId) searchParams.append('userId', params.userId)

  return request(`/api/roles/permissions/check?${searchParams.toString()}`)
}

/**
 * 检查管理菜单权限
 */
export const checkAdminMenuPermission = async (companyId?: string): Promise<AdminMenuPermission> => {
  const params = companyId ? { companyId } : undefined
  return request('/api/roles/permissions/can_view_admin_menus', { params })
}



// ==================== 查询键常量 ====================

export const PERMISSION_QUERY_KEYS = {
  permission: (permission: string, companyId?: string, userId?: string) =>
    ['permission', permission, 'check', { companyId, userId }],
  adminMenus: (companyId?: string) =>
    ['permission', 'admin-menus', 'check', { companyId }],
}

// ==================== React Query Hooks ====================

/**
 * 检查通用权限的Hook
 */
export function usePermissionCheck(
  permission: string, 
  companyId?: string, 
  userId?: string,
  enabled: boolean = true
) {
  return useApiQuery<PermissionCheck>({
    queryKey: PERMISSION_QUERY_KEYS.permission(permission, companyId, userId),
    queryFn: () => checkPermission({ permission, companyId, userId }),
    enabled: enabled && !!permission,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 检查管理菜单权限的Hook
 */
export function useAdminMenuPermission(companyId?: string, enabled: boolean = true) {
  return useApiQuery<AdminMenuPermission>({
    queryKey: PERMISSION_QUERY_KEYS.adminMenus(companyId),
    url: '/api/roles/permissions/can_view_admin_menus',
    params: companyId ? { companyId } : undefined,
    enabled: enabled && !!companyId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// ==================== 权限检查工具函数 ====================

/**
 * 检查用户是否有特定权限
 */
export const hasPermission = (
  permissionData: PermissionCheck | undefined,
  fallback: boolean = false
): boolean => {
  return permissionData?.hasPermission ?? fallback
}

/**
 * 检查用户是否可以访问管理菜单
 */
export const canAccessAdminMenu = (
  permissionData: AdminMenuPermission | undefined,
  menuType: 'org' | 'mall' | 'redemption' = 'org'
): boolean => {
  if (!permissionData?.success || !permissionData?.data) {
    return false
  }
  
  const { canView, canOrg, canMall, canRedemption } = permissionData.data
  
  if (!canView) return false
  
  switch (menuType) {
    case 'org':
      return canOrg
    case 'mall':
      return canMall
    case 'redemption':
      return canRedemption
    default:
      return false
  }
}

/**
 * 获取权限拒绝的原因
 */
export const getPermissionDeniedReason = (
  permissionData: AdminMenuPermission | undefined
): string => {
  if (!permissionData?.success || !permissionData?.data) {
    return '权限检查失败'
  }
  
  if (!permissionData.data.canView) {
    return permissionData.data.reason || '无访问权限'
  }
  
  return '权限不足'
}

// ==================== 权限守卫组件工具 ====================

export interface PermissionGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  permission?: string
  companyId?: string
  userId?: string
  adminMenuType?: 'org' | 'mall' | 'redemption'
  requireAdminMenu?: boolean
}

/**
 * 权限检查结果类型
 */
export interface PermissionCheckResult {
  hasAccess: boolean
  isLoading: boolean
  reason?: string
}

/**
 * 通用权限检查逻辑
 */
export const usePermissionGuard = (props: Omit<PermissionGuardProps, 'children' | 'fallback'>): PermissionCheckResult => {
  const {
    permission,
    companyId,
    userId,
    adminMenuType = 'org',
    requireAdminMenu = false
  } = props
  
  // 检查通用权限
  const { data: permissionData, isLoading: permissionLoading } = usePermissionCheck(
    permission || '',
    companyId,
    userId,
    !!permission
  )
  
  // 检查管理菜单权限
  const { data: adminMenuData, isLoading: adminMenuLoading } = useAdminMenuPermission(
    companyId,
    requireAdminMenu
  )
  
  const isLoading = permissionLoading || adminMenuLoading
  
  // 计算访问权限
  let hasAccess = true
  let reason = ''
  
  if (permission && !hasPermission(permissionData)) {
    hasAccess = false
    reason = '缺少必要权限'
  }
  
  if (requireAdminMenu && !canAccessAdminMenu(adminMenuData, adminMenuType)) {
    hasAccess = false
    reason = getPermissionDeniedReason(adminMenuData)
  }
  
  return {
    hasAccess,
    isLoading,
    reason
  }
}

// ==================== 常用权限常量 ====================

export const PERMISSIONS = {
  // 组织管理
  ORG_VIEW: 'org:view',
  ORG_CREATE: 'org:create',
  ORG_UPDATE: 'org:update',
  ORG_DELETE: 'org:delete',
  
  // 商城管理
  MALL_VIEW: 'mall:view',
  MALL_CREATE: 'mall:create',
  MALL_UPDATE: 'mall:update',
  MALL_DELETE: 'mall:delete',
  
  // 兑奖管理
  REDEMPTION_VIEW: 'redemption:view',
  REDEMPTION_MANAGE: 'redemption:manage',
  
  // 用户管理
  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
  
  // 角色管理
  ROLE_VIEW: 'role:view',
  ROLE_MANAGE: 'role:manage',
} as const

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS]
