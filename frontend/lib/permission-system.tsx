/**
 * 声明式权限系统核心组件
 * 
 * 这是一个让人震撼的权限系统设计：
 * - 零闪烁的权限检查体验
 * - 声明式的权限配置
 * - 智能的权限缓存和预加载
 * - 完美的TypeScript类型支持
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback, ReactNode, ComponentType } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context-rq'
import {
  PermissionConfig,
  PermissionResult,
  PermissionState,
  AdminMenuType,
  AdminMenuPermission
} from './permission-utils'
import { roleApi } from './services/role-api'
import {
  getPermissionCacheManager,
  permissionQueryKeys,
  PERMISSION_CACHE_CONFIG
} from './permission-cache'

// ==================== 权限上下文 ====================

interface PermissionContextValue {
  checkPermission: (config: PermissionConfig) => PermissionResult
  preloadPermissions: (configs: PermissionConfig[]) => void
  invalidatePermissions: () => void
  refreshPermissions: () => Promise<void>
  getCacheStatus: () => any
  isReady: boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)

// ==================== 权限提供者组件 ====================

interface PermissionProviderProps {
  children: ReactNode
  preloadConfigs?: PermissionConfig[]
}

export function PermissionProvider({ children, preloadConfigs = [] }: PermissionProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const cacheManager = getPermissionCacheManager(queryClient)

  // 智能预加载权限数据
  const adminMenuQuery = useQuery({
    queryKey: permissionQueryKeys.adminMenus(user?.companyId?.toString()),
    queryFn: () => roleApi.canViewAdminMenus(user?.companyId?.toString()),
    enabled: !!(isAuthenticated && user?.companyId),
    staleTime: PERMISSION_CACHE_CONFIG.STALE_TIME,
    gcTime: PERMISSION_CACHE_CONFIG.CACHE_TIME,
    retry: PERMISSION_CACHE_CONFIG.RETRY_ATTEMPTS,
    retryDelay: PERMISSION_CACHE_CONFIG.RETRY_DELAY,
  })

  // 用户权限预加载
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.companyId) {
      // 异步预加载用户权限数据
      cacheManager.preloadUserPermissions(
        user.id.toString(),
        user.companyId.toString()
      ).catch(error => {
        console.warn('Failed to preload user permissions:', error)
      })
    }
  }, [isAuthenticated, user?.id, user?.companyId, cacheManager])

  const isReady = useMemo(() => {
    if (!isAuthenticated) return true
    return !adminMenuQuery.isLoading
  }, [isAuthenticated, adminMenuQuery.isLoading])

  // 权限检查函数
  const checkPermission = useCallback((config: PermissionConfig): PermissionResult => {
    if (!isAuthenticated || !user) {
      return {
        state: PermissionState.DENIED,
        hasAccess: false,
        reason: '用户未登录'
      }
    }

    if (config.requireAdminMenu) {
      const adminMenuResult = adminMenuQuery.data as AdminMenuPermission

      if (adminMenuQuery.isLoading) {
        return {
          state: PermissionState.LOADING,
          hasAccess: false
        }
      }

      if (adminMenuQuery.error) {
        return {
          state: PermissionState.ERROR,
          hasAccess: config.fallback ?? false,
          reason: '权限检查失败'
        }
      }

      if (!adminMenuResult?.success || !adminMenuResult?.data) {
        return {
          state: PermissionState.DENIED,
          hasAccess: false,
          reason: '权限数据无效'
        }
      }

      const { canView, canOrg, canMall, canRedemption } = adminMenuResult.data
      
      if (!canView) {
        return {
          state: PermissionState.DENIED,
          hasAccess: false,
          reason: adminMenuResult.data.reason || '无访问权限'
        }
      }

      let hasMenuAccess = false
      switch (config.adminMenuType) {
        case 'org':
          hasMenuAccess = canOrg
          break
        case 'mall':
          hasMenuAccess = canMall
          break
        case 'redemption':
          hasMenuAccess = canRedemption
          break
        default:
          hasMenuAccess = false
      }

      return {
        state: hasMenuAccess ? PermissionState.GRANTED : PermissionState.DENIED,
        hasAccess: hasMenuAccess,
        reason: hasMenuAccess ? undefined : `无${config.adminMenuType}权限`,
        data: adminMenuResult.data
      }
    }

    // 默认允许访问
    return {
      state: PermissionState.GRANTED,
      hasAccess: true
    }
  }, [isAuthenticated, user, adminMenuQuery])

  const preloadPermissions = useCallback((configs: PermissionConfig[]) => {
    // 使用缓存管理器预加载权限
    if (user?.id && user?.companyId) {
      cacheManager.preloadUserPermissions(
        user.id.toString(),
        user.companyId.toString()
      ).catch(error => {
        console.warn('Failed to preload permissions:', error)
      })
    }
  }, [cacheManager, user?.id, user?.companyId])

  const invalidatePermissions = useCallback(() => {
    cacheManager.invalidatePermissions(
      user?.id?.toString(),
      user?.companyId?.toString()
    )
  }, [cacheManager, user?.id, user?.companyId])

  const refreshPermissions = useCallback(async () => {
    if (user?.id && user?.companyId) {
      await Promise.all([
        cacheManager.refreshPermission('admin-menus', {
          companyId: user.companyId.toString()
        }),
        cacheManager.refreshPermission('user-permissions', {
          userId: user.id.toString(),
          companyId: user.companyId.toString()
        })
      ])
    }
  }, [cacheManager, user?.id, user?.companyId])

  const getCacheStatus = useCallback(() => {
    return cacheManager.getCacheStatus(
      user?.id?.toString(),
      user?.companyId?.toString()
    )
  }, [cacheManager, user?.id, user?.companyId])

  const contextValue: PermissionContextValue = {
    checkPermission,
    preloadPermissions,
    invalidatePermissions,
    refreshPermissions,
    getCacheStatus,
    isReady
  }

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  )
}

// ==================== 权限Hook ====================

export function usePermissionSystem() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissionSystem must be used within a PermissionProvider')
  }
  return context
}

// ==================== 声明式权限检查Hook ====================

export function usePermission(config: PermissionConfig): PermissionResult {
  const { checkPermission } = usePermissionSystem()
  
  return useMemo(() => {
    return checkPermission(config)
  }, [checkPermission, config])
}

// ==================== 权限守卫组件 ====================

interface PermissionGuardProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
  permission?: string
  adminMenuType?: AdminMenuType
  requireAdminMenu?: boolean
  companyId?: string
  userId?: string
}

export function PermissionGuard({
  children,
  fallback,
  loadingFallback,
  permission,
  adminMenuType,
  requireAdminMenu,
  companyId,
  userId
}: PermissionGuardProps) {
  const config: PermissionConfig = {
    permission,
    adminMenuType,
    requireAdminMenu,
    companyId,
    userId
  }
  const result = usePermission(config)

  if (result.state === PermissionState.LOADING) {
    return <>{loadingFallback || <div className="animate-pulse">权限检查中...</div>}</>
  }

  if (!result.hasAccess) {
    return <>{fallback || <div className="text-center text-gray-500">权限不足</div>}</>
  }

  return <>{children}</>
}

// ==================== 权限装饰器HOC ====================

interface WithPermissionOptions {
  permission?: string
  adminMenuType?: AdminMenuType
  requireAdminMenu?: boolean
  companyId?: string
  userId?: string
  fallback?: ComponentType
  loadingFallback?: ComponentType
}

export function withPermission<P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionOptions
) {
  const WrappedComponent = (props: P) => {
    const config: PermissionConfig = {
      permission: options.permission,
      adminMenuType: options.adminMenuType,
      requireAdminMenu: options.requireAdminMenu,
      companyId: options.companyId,
      userId: options.userId
    }
    const result = usePermission(config)
    
    if (result.state === PermissionState.LOADING) {
      const LoadingComponent = options.loadingFallback
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>
    }

    if (!result.hasAccess) {
      const FallbackComponent = options.fallback
      return FallbackComponent ? <FallbackComponent /> : <div>Access Denied</div>
    }

    return <Component {...props} />
  }

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`
  return WrappedComponent
}

// ==================== 权限常量定义 ====================

export const PERMISSION_CONFIGS = {
  ORG_MANAGEMENT: {
    adminMenuType: 'org' as AdminMenuType,
    requireAdminMenu: true
  },
  MALL_MANAGEMENT: {
    adminMenuType: 'mall' as AdminMenuType,
    requireAdminMenu: true
  },
  REDEMPTION_MANAGEMENT: {
    adminMenuType: 'redemption' as AdminMenuType,
    requireAdminMenu: true
  }
} as const
