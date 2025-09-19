/**
 * 客户端权限守卫
 * 
 * 解决 SSR 水合错误的专用权限守卫组件
 * 确保服务端和客户端渲染一致性
 */

"use client"

import React, { useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context-rq'
import { useCanViewAdminMenus } from '@/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ClientPermissionGuardProps {
  children: ReactNode
  requireOrgPermission?: boolean
  requireMallPermission?: boolean
  requireRedemptionPermission?: boolean
  fallback?: ReactNode
}

/**
 * 客户端权限守卫组件
 * 
 * 特点：
 * 1. 仅在客户端运行，避免 SSR 水合问题
 * 2. 使用 useEffect 确保在客户端挂载后才进行权限检查
 * 3. 提供一致的加载和错误状态
 */
export function ClientPermissionGuard({
  children,
  requireOrgPermission = false,
  requireMallPermission = false,
  requireRedemptionPermission = false,
  fallback
}: ClientPermissionGuardProps) {
  const { user, isAuthenticated } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)

  // 确保组件在客户端挂载后才进行权限检查
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 权限检查
  const companyIdForQuery = user?.companyId?.toString()
  const queryEnabled = isMounted && isAuthenticated && !!user?.companyId

  const { data: permissionData, isLoading, error } = useCanViewAdminMenus(
    companyIdForQuery,
    { enabled: queryEnabled }
  )

  // 权限检查完成标记
  useEffect(() => {
    if (isMounted && !isLoading && (permissionData || error)) {
      setPermissionChecked(true)
    }
  }, [isMounted, isLoading, permissionData, error])

  // 服务端渲染时显示静态内容
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">系统初始化</h3>
                <p className="text-sm text-gray-600 mt-1">正在准备权限系统...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 用户未认证
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // 权限检查中
  if (isLoading || !permissionChecked) {
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



  // 权限检查错误
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">权限检查失败</CardTitle>
            <CardDescription className="text-gray-600">
              无法验证您的访问权限，请刷新页面重试
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-red-500">
                  错误: {error.message}
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // 检查具体权限
  // 注意：api.get 已经提取了 response.data，所以 permissionData 就是后端返回的完整响应
  const canMenus = permissionData?.data || {
    canView: false,
    canOrg: false,
    canMall: false,
    canRedemption: false
  }

  // 权限验证逻辑
  let hasRequiredPermission = true
  let deniedReason = ''

  if (!canMenus.canView) {
    hasRequiredPermission = false
    deniedReason = '您没有访问管理功能的权限'
  } else if (requireOrgPermission && !canMenus.canOrg) {
    hasRequiredPermission = false
    deniedReason = '您没有组织管理权限'
  } else if (requireMallPermission && !canMenus.canMall) {
    hasRequiredPermission = false
    deniedReason = '您没有商城管理权限'
  } else if (requireRedemptionPermission && !canMenus.canRedemption) {
    hasRequiredPermission = false
    deniedReason = '您没有兑奖管理权限'
  }

  // 权限不足
  if (!hasRequiredPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">访问被拒绝</CardTitle>
            <CardDescription className="text-gray-600">
              {deniedReason}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">权限说明</p>
                  <p>请联系管理员获取相应权限，或返回到有权限的页面。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 权限检查通过
  return <>{children}</>
}

/**
 * 组织管理权限守卫
 */
export function OrgPermissionGuard({ children }: { children: ReactNode }) {
  return (
    <ClientPermissionGuard requireOrgPermission={true}>
      {children}
    </ClientPermissionGuard>
  )
}

/**
 * 商城管理权限守卫
 */
export function MallPermissionGuard({ children }: { children: ReactNode }) {
  return (
    <ClientPermissionGuard requireMallPermission={true}>
      {children}
    </ClientPermissionGuard>
  )
}

/**
 * 兑奖管理权限守卫
 */
export function RedemptionPermissionGuard({ children }: { children: ReactNode }) {
  return (
    <ClientPermissionGuard requireRedemptionPermission={true}>
      {children}
    </ClientPermissionGuard>
  )
}
