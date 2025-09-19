/**
 * 权限缓存管理系统
 * 
 * 这是一个智能的权限缓存系统：
 * - 预加载用户权限数据
 * - 智能缓存失效策略
 * - 权限数据的本地存储
 * - 权限变更的实时同步
 */

import { QueryClient } from '@tanstack/react-query'
import { roleApi } from './services/role-api'
import { AdminMenuPermission } from './permission-utils'

// ==================== 缓存配置 ====================

export const PERMISSION_CACHE_CONFIG = {
  // 缓存时间配置
  STALE_TIME: 5 * 60 * 1000,      // 5分钟数据新鲜期
  CACHE_TIME: 15 * 60 * 1000,     // 15分钟缓存保留期
  RETRY_ATTEMPTS: 3,               // 重试次数
  RETRY_DELAY: 1000,              // 重试延迟(ms)
  
  // 本地存储配置
  LOCAL_STORAGE_KEY: 'permission_cache',
  LOCAL_STORAGE_VERSION: '1.0',
  LOCAL_STORAGE_TTL: 10 * 60 * 1000, // 10分钟本地缓存
} as const

// ==================== 权限查询键生成器 ====================

export const permissionQueryKeys = {
  all: ['permissions'] as const,
  
  adminMenus: (companyId?: string) => [
    ...permissionQueryKeys.all, 
    'admin-menus', 
    companyId
  ] as const,
  
  userPermissions: (userId: string, companyId?: string) => [
    ...permissionQueryKeys.all,
    'user-permissions',
    userId,
    companyId
  ] as const,
  
  rolePermissions: (roleId: string) => [
    ...permissionQueryKeys.all,
    'role-permissions',
    roleId
  ] as const,
}

// ==================== 本地存储管理 ====================

interface CachedPermissionData {
  data: any
  timestamp: number
  version: string
  companyId?: string
  userId?: string
}

class PermissionLocalStorage {
  private getStorageKey(key: string): string {
    return `${PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_KEY}_${key}`
  }

  set(key: string, data: any, companyId?: string, userId?: string): void {
    if (typeof window === 'undefined') return

    const cachedData: CachedPermissionData = {
      data,
      timestamp: Date.now(),
      version: PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_VERSION,
      companyId,
      userId
    }

    try {
      localStorage.setItem(this.getStorageKey(key), JSON.stringify(cachedData))
    } catch (error) {
      console.warn('Failed to cache permission data:', error)
    }
  }

  get(key: string, companyId?: string, userId?: string): any | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.getStorageKey(key))
      if (!stored) return null

      const cachedData: CachedPermissionData = JSON.parse(stored)
      
      // 检查版本
      if (cachedData.version !== PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_VERSION) {
        this.remove(key)
        return null
      }

      // 检查过期时间
      if (Date.now() - cachedData.timestamp > PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_TTL) {
        this.remove(key)
        return null
      }

      // 检查上下文匹配
      if (companyId && cachedData.companyId !== companyId) {
        return null
      }

      if (userId && cachedData.userId !== userId) {
        return null
      }

      return cachedData.data
    } catch (error) {
      console.warn('Failed to read cached permission data:', error)
      this.remove(key)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.getStorageKey(key))
  }

  clear(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_KEY)) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const permissionStorage = new PermissionLocalStorage()

// ==================== 权限缓存管理器 ====================

export class PermissionCacheManager {
  private queryClient: QueryClient

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * 预加载用户权限数据
   */
  async preloadUserPermissions(userId: string, companyId?: string): Promise<void> {
    if (!companyId) return

    const preloadTasks = [
      // 预加载管理菜单权限
      this.preloadAdminMenuPermissions(companyId),
      
      // 预加载用户角色权限
      this.preloadUserRolePermissions(userId, companyId),
    ]

    try {
      await Promise.allSettled(preloadTasks)
    } catch (error) {
      console.warn('Permission preload failed:', error)
    }
  }

  /**
   * 预加载管理菜单权限
   */
  private async preloadAdminMenuPermissions(companyId: string): Promise<AdminMenuPermission> {
    const queryKey = permissionQueryKeys.adminMenus(companyId)
    
    // 检查本地缓存
    const cached = permissionStorage.get('admin-menus', companyId)
    if (cached) {
      this.queryClient.setQueryData(queryKey, cached)
      return cached
    }

    // 预取数据
    const data = await this.queryClient.fetchQuery({
      queryKey,
      queryFn: () => roleApi.canViewAdminMenus(companyId),
      staleTime: PERMISSION_CACHE_CONFIG.STALE_TIME,
      gcTime: PERMISSION_CACHE_CONFIG.CACHE_TIME,
      retry: PERMISSION_CACHE_CONFIG.RETRY_ATTEMPTS,
      retryDelay: PERMISSION_CACHE_CONFIG.RETRY_DELAY,
    })

    // 缓存到本地存储
    permissionStorage.set('admin-menus', data, companyId)
    
    return data
  }

  /**
   * 预加载用户角色权限
   */
  private async preloadUserRolePermissions(userId: string, companyId: string): Promise<any> {
    const queryKey = permissionQueryKeys.userPermissions(userId, companyId)

    // 检查本地缓存
    const cached = permissionStorage.get('user-permissions', companyId, userId)
    if (cached) {
      this.queryClient.setQueryData(queryKey, cached)
      return cached
    }

    try {
      // 预取数据
      const response = await this.queryClient.fetchQuery({
        queryKey,
        queryFn: () => roleApi.getUserRoles(userId, companyId),
        staleTime: PERMISSION_CACHE_CONFIG.STALE_TIME,
        gcTime: PERMISSION_CACHE_CONFIG.CACHE_TIME,
        retry: PERMISSION_CACHE_CONFIG.RETRY_ATTEMPTS,
        retryDelay: PERMISSION_CACHE_CONFIG.RETRY_DELAY,
      })

      // 提取实际数据（后端返回格式：{ success: boolean, data: { roles: [], roleCount: number }, message: string }）
      const data = response?.data?.roles || []

      // 缓存到本地存储
      permissionStorage.set('user-permissions', data, companyId, userId)

      return data
    } catch (error) {
      console.warn('预加载用户角色权限失败:', error)
      return []
    }
  }

  /**
   * 使权限缓存失效
   */
  invalidatePermissions(userId?: string, companyId?: string): void {
    // 清除 React Query 缓存
    this.queryClient.invalidateQueries({ 
      queryKey: permissionQueryKeys.all 
    })

    // 清除本地存储缓存
    if (userId && companyId) {
      permissionStorage.remove('admin-menus')
      permissionStorage.remove('user-permissions')
    } else {
      permissionStorage.clear()
    }
  }

  /**
   * 刷新特定权限数据
   */
  async refreshPermission(type: 'admin-menus' | 'user-permissions', params: {
    userId?: string
    companyId?: string
  }): Promise<void> {
    const { userId, companyId } = params

    if (type === 'admin-menus' && companyId) {
      const queryKey = permissionQueryKeys.adminMenus(companyId)
      await this.queryClient.invalidateQueries({ queryKey })
      permissionStorage.remove('admin-menus')
    }

    if (type === 'user-permissions' && userId && companyId) {
      const queryKey = permissionQueryKeys.userPermissions(userId, companyId)
      await this.queryClient.invalidateQueries({ queryKey })
      permissionStorage.remove('user-permissions')
    }
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus(userId?: string, companyId?: string): {
    adminMenusCached: boolean
    userPermissionsCached: boolean
    localStorageSize: number
  } {
    const adminMenusCached = !!this.queryClient.getQueryData(
      permissionQueryKeys.adminMenus(companyId)
    )
    
    const userPermissionsCached = !!(userId && companyId && this.queryClient.getQueryData(
      permissionQueryKeys.userPermissions(userId, companyId)
    ))

    // 计算本地存储大小
    let localStorageSize = 0
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(PERMISSION_CACHE_CONFIG.LOCAL_STORAGE_KEY)) {
            localStorageSize += localStorage.getItem(key)?.length || 0
          }
        })
      } catch (error) {
        // 忽略错误
      }
    }

    return {
      adminMenusCached,
      userPermissionsCached,
      localStorageSize
    }
  }
}

// ==================== 导出单例实例 ====================

let permissionCacheManager: PermissionCacheManager | null = null

export function getPermissionCacheManager(queryClient: QueryClient): PermissionCacheManager {
  if (!permissionCacheManager) {
    permissionCacheManager = new PermissionCacheManager(queryClient)
  }
  return permissionCacheManager
}
