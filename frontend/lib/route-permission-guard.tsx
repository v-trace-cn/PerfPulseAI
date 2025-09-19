/**
 * 路由级权限守卫系统
 * 
 * 这是权限系统的路由层实现：
 * - 在路由级别进行权限预检查
 * - 避免组件渲染后的权限闪烁
 * - 提供优雅的权限不足处理
 * - 支持权限预加载和缓存
 */

import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context-rq'
import { 
  usePermissionSystem, 
  usePermission, 
  PermissionGuard,
  PERMISSION_CONFIGS 
} from './permission-system'
import { PermissionConfig, PermissionState } from './permission-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react'

// ==================== 路由权限配置 ====================

interface RoutePermissionConfig {
  path: string
  permission: PermissionConfig
  redirectTo?: string
  exact?: boolean
}

/**
 * 路由权限配置表
 * 这里定义了每个路由需要的权限
 */
export const ROUTE_PERMISSIONS: RoutePermissionConfig[] = [
  {
    path: '/org',
    permission: PERMISSION_CONFIGS.ORG_MANAGEMENT,
    exact: true
  },
  {
    path: '/org/permissions',
    permission: PERMISSION_CONFIGS.ORG_MANAGEMENT,
  },
  {
    path: '/org/mall',
    permission: PERMISSION_CONFIGS.MALL_MANAGEMENT,
  },
  {
    path: '/org/redemption',
    permission: PERMISSION_CONFIGS.REDEMPTION_MANAGEMENT,
  }
]

// ==================== 权限不足页面组件 ====================

interface PermissionDeniedPageProps {
  reason?: string
  redirectPath?: string
  onRetry?: () => void
}

function PermissionDeniedPage({ 
  reason = '权限不足', 
  redirectPath = '/dashboard',
  onRetry 
}: PermissionDeniedPageProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">访问被拒绝</CardTitle>
          <CardDescription className="text-gray-600">
            {reason}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">权限说明</p>
                <p>您当前的账户权限不足以访问此页面。请联系管理员获取相应权限，或返回到有权限的页面。</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={() => router.push(redirectPath)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回主页
            </Button>
            
            {onRetry && (
              <Button 
                variant="outline"
                onClick={onRetry}
                className="w-full"
              >
                重新检查权限
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 权限加载页面组件 ====================

function PermissionLoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">权限验证中</h3>
              <p className="text-sm text-gray-600 mt-1">正在检查您的访问权限，请稍候...</p>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==================== 路由权限守卫Hook ====================

export function useRoutePermission(pathname: string) {
  const { isReady } = usePermissionSystem()
  const [permissionConfig, setPermissionConfig] = useState<PermissionConfig | null>(null)

  useEffect(() => {
    // 查找匹配的路由权限配置
    const matchedRoute = ROUTE_PERMISSIONS.find(route => {
      if (route.exact) {
        return pathname === route.path
      }
      return pathname.startsWith(route.path)
    })

    setPermissionConfig(matchedRoute?.permission || null)
  }, [pathname])

  const permissionResult = usePermission(permissionConfig || {})

  return {
    isReady,
    hasPermission: permissionConfig ? permissionResult.hasAccess : true,
    permissionState: permissionResult.state,
    reason: permissionResult.reason,
    needsPermissionCheck: !!permissionConfig
  }
}

// ==================== 路由权限守卫组件 ====================

interface RoutePermissionGuardProps {
  children: ReactNode
  pathname?: string
}

export function RoutePermissionGuard({ children, pathname }: RoutePermissionGuardProps) {
  const currentPathname = usePathname()
  const targetPathname = pathname || currentPathname
  const { isAuthenticated } = useAuth()
  
  const {
    isReady,
    hasPermission,
    permissionState,
    reason,
    needsPermissionCheck
  } = useRoutePermission(targetPathname)

  // 如果用户未登录，让 AuthGuard 处理
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // 如果不需要权限检查，直接渲染
  if (!needsPermissionCheck) {
    return <>{children}</>
  }

  // 权限系统未就绪，显示加载页面
  if (!isReady || permissionState === PermissionState.LOADING) {
    return <PermissionLoadingPage />
  }

  // 权限检查失败，显示拒绝页面
  if (!hasPermission) {
    return (
      <PermissionDeniedPage 
        reason={reason}
        onRetry={() => window.location.reload()}
      />
    )
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>
}

// ==================== 页面级权限装饰器 ====================

interface PagePermissionOptions {
  permission?: PermissionConfig
  fallbackPath?: string
  loadingComponent?: ReactNode
  deniedComponent?: ReactNode
}

export function withPagePermission<P extends object>(
  Component: React.ComponentType<P>,
  options: PagePermissionOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const pathname = usePathname()
    
    return (
      <RoutePermissionGuard pathname={pathname}>
        {options.permission ? (
          <PermissionGuard
            {...options.permission}
            loadingFallback={options.loadingComponent}
            fallback={options.deniedComponent}
          >
            <Component {...props} />
          </PermissionGuard>
        ) : (
          <Component {...props} />
        )}
      </RoutePermissionGuard>
    )
  }

  WrappedComponent.displayName = `withPagePermission(${Component.displayName || Component.name})`
  return WrappedComponent
}

// ==================== 导出 ====================

export {
  PermissionDeniedPage,
  PermissionLoadingPage
}
