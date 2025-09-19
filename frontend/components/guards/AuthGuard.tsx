"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context-rq"
import { useAuthDialog } from "@/lib/auth-dialog-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn, Shield } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { openLoginDialog } = useAuthDialog()
  const [isMounted, setIsMounted] = useState(false)

  // 确保组件在客户端挂载后才进行权限检查
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 在客户端挂载之前，始终显示加载状态以避免 hydration 错误
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-lg font-medium">验证登录状态...</p>
              <p className="text-sm text-gray-600">请稍候</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">需要登录</CardTitle>
            <CardDescription>
              您需要登录才能访问此页面
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={openLoginDialog} 
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              立即登录
            </Button>
            <p className="text-center text-sm text-gray-600">
              还没有账户？点击登录后选择注册
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is authenticated, render children
  return <>{children}</>
}
