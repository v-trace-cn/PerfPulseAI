/**
 * 权限状态显示组件
 * 
 * 简化的权限状态显示，用于调试和监控
 */

"use client"

import React from 'react'
import { useAuth } from '@/lib/auth-context-rq'
import { useCanViewAdminMenus } from '@/hooks'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface PermissionStatusProps {
  className?: string
  showDetails?: boolean
}

export function PermissionStatus({ className, showDetails = false }: PermissionStatusProps) {
  const { user, isAuthenticated } = useAuth()
  const { data: permissionData, isLoading, error } = useCanViewAdminMenus(user?.companyId?.toString())

  if (!isAuthenticated) {
    return null
  }

  const canMenus = permissionData?.data || { 
    canView: false, 
    canOrg: false, 
    canMall: false, 
    canRedemption: false 
  }

  const getStatusIcon = (hasPermission: boolean, isLoading: boolean, hasError: boolean) => {
    if (isLoading) return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
    if (hasError) return <AlertTriangle className="h-4 w-4 text-orange-600" />
    return hasPermission ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (hasPermission: boolean, isLoading: boolean, hasError: boolean) => {
    if (isLoading) return <Badge variant="secondary">检查中</Badge>
    if (hasError) return <Badge variant="destructive">错误</Badge>
    return hasPermission ? 
      <Badge className="bg-green-600 hover:bg-green-700">已授权</Badge> : 
      <Badge variant="destructive">已拒绝</Badge>
  }

  if (!showDetails) {
    // 简化显示
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon(canMenus.canOrg, isLoading, !!error)}
        <span className="text-sm text-gray-600">组织权限</span>
        {getStatusBadge(canMenus.canOrg, isLoading, !!error)}
      </div>
    )
  }

  // 详细显示
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Shield className="h-4 w-4" />
          <span>权限状态</span>
        </CardTitle>
        {permissionData?.data?.reason && (
          <CardDescription className="text-xs">
            {permissionData.data.reason}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(canMenus.canOrg, isLoading, !!error)}
              <span className="text-sm">组织管理</span>
            </div>
            {getStatusBadge(canMenus.canOrg, isLoading, !!error)}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(canMenus.canMall, isLoading, !!error)}
              <span className="text-sm">商城管理</span>
            </div>
            {getStatusBadge(canMenus.canMall, isLoading, !!error)}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(canMenus.canRedemption, isLoading, !!error)}
              <span className="text-sm">兑奖管理</span>
            </div>
            {getStatusBadge(canMenus.canRedemption, isLoading, !!error)}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            权限检查失败: {error.message || '未知错误'}
          </div>
        )}

        <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
          <div>用户ID: {user?.id || 'N/A'}</div>
          <div>公司ID: {user?.companyId || 'N/A'}</div>
          <div>状态: {isLoading ? '检查中' : error ? '错误' : '正常'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 权限状态指示器 - 最小化显示
 */
export function PermissionIndicator({ className }: { className?: string }) {
  const { user, isAuthenticated } = useAuth()
  const { data: permissionData, isLoading, error } = useCanViewAdminMenus(user?.companyId?.toString())

  if (!isAuthenticated) {
    return null
  }

  const canMenus = permissionData?.data || { canView: false, canOrg: false }
  
  let statusColor = 'text-gray-400'
  let statusText = '未知'
  
  if (isLoading) {
    statusColor = 'text-blue-600'
    statusText = '检查中'
  } else if (error) {
    statusColor = 'text-red-600'
    statusText = '错误'
  } else if (canMenus.canOrg) {
    statusColor = 'text-green-600'
    statusText = '已授权'
  } else {
    statusColor = 'text-red-600'
    statusText = '无权限'
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Shield className={`h-3 w-3 ${statusColor}`} />
      <span className={`text-xs ${statusColor}`}>{statusText}</span>
    </div>
  )
}
