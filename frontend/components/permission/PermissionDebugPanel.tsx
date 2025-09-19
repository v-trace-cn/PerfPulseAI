/**
 * 权限调试面板
 * 
 * 用于开发和调试权限系统的组件
 * 显示当前用户的权限状态、缓存信息等
 */

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context-rq'
import { usePermissionSystem, usePermission, PERMISSION_CONFIGS } from '@/lib/permission-system'
import { PermissionState } from '@/lib/permission-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Shield, 
  RefreshCw, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface PermissionDebugPanelProps {
  className?: string
}

export function PermissionDebugPanel({ className }: PermissionDebugPanelProps) {
  const { user, isAuthenticated } = useAuth()
  const { 
    isReady, 
    refreshPermissions, 
    getCacheStatus, 
    invalidatePermissions 
  } = usePermissionSystem()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 检查各种权限状态
  const orgPermission = usePermission(PERMISSION_CONFIGS.ORG_MANAGEMENT)
  const mallPermission = usePermission(PERMISSION_CONFIGS.MALL_MANAGEMENT)
  const redemptionPermission = usePermission(PERMISSION_CONFIGS.REDEMPTION_MANAGEMENT)

  const cacheStatus = getCacheStatus()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPermissions()
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleInvalidate = () => {
    invalidatePermissions()
  }

  const getStateIcon = (state: PermissionState) => {
    switch (state) {
      case PermissionState.GRANTED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case PermissionState.DENIED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case PermissionState.LOADING:
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case PermissionState.ERROR:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStateBadge = (state: PermissionState, hasAccess: boolean) => {
    if (state === PermissionState.LOADING) {
      return <Badge variant="secondary">加载中</Badge>
    }
    if (state === PermissionState.ERROR) {
      return <Badge variant="destructive">错误</Badge>
    }
    return hasAccess ? 
      <Badge variant="default" className="bg-green-600">允许</Badge> : 
      <Badge variant="destructive">拒绝</Badge>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>权限调试面板</span>
              {!isReady && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2 space-y-4">
          {/* 系统状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">系统状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">权限系统就绪</span>
                {isReady ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">用户ID</span>
                <span className="text-sm font-mono">{user?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">公司ID</span>
                <span className="text-sm font-mono">{user?.companyId || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          {/* 权限状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">权限状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStateIcon(orgPermission.state)}
                    <span className="text-sm">组织管理</span>
                  </div>
                  {getStateBadge(orgPermission.state, orgPermission.hasAccess)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStateIcon(mallPermission.state)}
                    <span className="text-sm">商城管理</span>
                  </div>
                  {getStateBadge(mallPermission.state, mallPermission.hasAccess)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStateIcon(redemptionPermission.state)}
                    <span className="text-sm">兑奖管理</span>
                  </div>
                  {getStateBadge(redemptionPermission.state, redemptionPermission.hasAccess)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 缓存状态 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">缓存状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">管理菜单缓存</span>
                {cacheStatus.adminMenusCached ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">用户权限缓存</span>
                {cacheStatus.userPermissionsCached ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">本地存储大小</span>
                <span className="text-xs font-mono text-gray-500">
                  {(cacheStatus.localStorageSize / 1024).toFixed(1)}KB
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              刷新权限
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleInvalidate}
              className="flex-1"
            >
              <Database className="h-3 w-3 mr-1" />
              清除缓存
            </Button>
          </div>

          {/* 权限原因显示 */}
          {(orgPermission.reason || mallPermission.reason || redemptionPermission.reason) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">权限详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {orgPermission.reason && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">组织管理:</span> {orgPermission.reason}
                  </div>
                )}
                {mallPermission.reason && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">商城管理:</span> {mallPermission.reason}
                  </div>
                )}
                {redemptionPermission.reason && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">兑奖管理:</span> {redemptionPermission.reason}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
