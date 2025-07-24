"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building, Users, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { unifiedApi } from "@/lib/unified-api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

interface CompanyGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function CompanyGuard({ children, fallback }: CompanyGuardProps) {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")

  // Join company mutation
  const joinCompanyMutation = useMutation({
    mutationFn: (inviteCode: string) => 
      unifiedApi.company.joinByInviteCode(inviteCode, user?.id),
    onSuccess: async (res) => {
      if (res.success) {
        toast({
          title: "成功",
          description: res.message,
          variant: "default",
        })
        
        // Refresh user data
        await refreshUser()
        
        // Refresh related queries
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ['user', user.id] })
          queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] })
          queryClient.invalidateQueries({ queryKey: ['departments'] })
          queryClient.invalidateQueries({ queryKey: ['available-companies'] })
        }
      } else {
        toast({
          title: "错误",
          description: res.message,
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "错误",
        description: error.message || "加入公司失败",
        variant: "destructive",
      })
    },
  })

  const handleJoinCompany = () => {
    if (!inviteCode.trim()) {
      toast({
        title: "错误",
        description: "请输入邀请码",
        variant: "destructive",
      })
      return
    }
    joinCompanyMutation.mutate(inviteCode.trim())
  }

  // Show company membership requirement if user hasn't joined a company
  if (!user?.companyId) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">需要加入公司</CardTitle>
            <CardDescription>
              您需要加入一个公司才能访问组织管理功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">公司邀请码</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="请输入公司邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={joinCompanyMutation.isPending}
              />
            </div>
            
            <Button 
              onClick={handleJoinCompany}
              disabled={!inviteCode.trim() || joinCompanyMutation.isPending}
              className="w-full"
              size="lg"
            >
              {joinCompanyMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  加入中...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  加入公司
                </>
              )}
            </Button>
            
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/companies')}
                className="w-full"
              >
                <Building className="mr-2 h-4 w-4" />
                创建或管理公司
              </Button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">提示：</p>
                  <p>请联系公司管理员获取公司邀请码，或者点击下方按钮创建新公司（需要系统邀请码）。</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User has joined a company, render children
  return <>{children}</>
}
