"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { unifiedApi } from "@/lib/unified-api"

interface InviteCodeGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function InviteCodeGuard({ children, fallback }: InviteCodeGuardProps) {
  const { toast } = useToast()
  const [inviteCode, setInviteCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false)

  // 检查本地存储中是否已有验证记录
  useEffect(() => {
    const verified = localStorage.getItem('invite_code_verified')
    if (verified === 'true') {
      setIsVerified(true)
    }
    setHasCheckedStorage(true)
  }, [])

  const handleVerifyInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "错误",
        description: "请输入邀请码",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      const response = await unifiedApi.auth.verifyInviteCode(inviteCode.trim())
      
      if (response.success && response.data.valid) {
        setIsVerified(true)
        localStorage.setItem('invite_code_verified', 'true')
        toast({
          title: "验证成功",
          description: "邀请码验证通过，欢迎使用系统！",
        })
      } else {
        toast({
          title: "验证失败",
          description: response.message || "邀请码无效，请检查后重试",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "验证失败",
        description: error.message || "验证过程中出现错误，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyInviteCode()
    }
  }

  // 如果还在检查本地存储，显示加载状态
  if (!hasCheckedStorage) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // 如果已验证，显示子组件
  if (isVerified) {
    return <>{children}</>
  }

  // 显示邀请码验证界面
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">系统访问验证</CardTitle>
          <CardDescription>
            请输入系统邀请码以访问公司管理功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemInviteCode">系统邀请码</Label>
            <Input
              id="systemInviteCode"
              type="text"
              placeholder="请输入系统邀请码"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isVerifying}
              className="text-center tracking-wider"
            />
          </div>
          
          <Button 
            onClick={handleVerifyInviteCode}
            disabled={!inviteCode.trim() || isVerifying}
            className="w-full"
            size="lg"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                验证中...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                验证邀请码
              </>
            )}
          </Button>
          
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">提示：</p>
                <p>请联系系统管理员获取邀请码。验证成功后，您将能够访问公司管理功能。</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
