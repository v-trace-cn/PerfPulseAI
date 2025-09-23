"use client"

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, TrendingUp } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
// 已迁移到新的纯 React Query 实现

interface PointTransaction {
  id: string
  userId: number
  transactionType: string
  amount: number
  balanceAfter: number
  referenceId?: string
  referenceType?: string
  description?: string
  createdAt: string
  canDispute: boolean
  disputeTimeLeft: number
}

interface DisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: PointTransaction | null
}

interface CreateDisputeRequest {
  transaction_id: string
  reason: string
  requested_amount?: number
}

export function DisputeDialog({ open, onOpenChange, transaction }: DisputeDialogProps) {
  const [reason, setReason] = useState('')
  const [requestedAmount, setRequestedAmount] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createDisputeMutation = useMutation({
    mutationFn: async (data: CreateDisputeRequest) => {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.detail || `服务器错误: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "异议提交成功",
        description: "您的异议已提交，我们会尽快处理",
        variant: "default"
      })
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['points-summary'] })
      handleClose()
    },
    onError: (error: any) => {
      toast({
        title: "异议提交失败",
        description: error.message || "提交异议时发生错误，请稍后重试",
        variant: "destructive"
      })
    }
  })

  const handleClose = () => {
    setReason('')
    setRequestedAmount('')
    onOpenChange(false)
  }

  const handleSubmit = () => {
    if (!transaction) return
    
    if (reason.trim().length < 10) {
      toast({
        title: "异议原因太短",
        description: "请详细说明异议原因，至少10个字符",
        variant: "destructive"
      })
      return
    }

    const data: CreateDisputeRequest = {
      transaction_id: transaction.id,
      reason: reason.trim(),
    }

    if (requestedAmount && !isNaN(Number(requestedAmount))) {
      data.requested_amount = Number(requestedAmount)
    }

    createDisputeMutation.mutate(data)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'EARN': '获得',
      'SPEND': '消费',
      'ADJUSTMENT': '调整',
      'REFUND': '退款'
    }
    return types[type] || type
  }

  const formatTimeLeft = (hours: number) => {
    if (hours <= 0) return '已过期'
    if (hours < 24) return `${Math.floor(hours)}小时`
    return `${Math.floor(hours / 24)}天`
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            提交积分异议
          </DialogTitle>
          <DialogDescription>
            对此积分交易有疑问？请详细说明您的异议原因，我们会认真审核处理。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 交易信息 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">交易详情</span>
              <Badge variant="outline">
                {getTransactionTypeLabel(transaction.transactionType)}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span>{transaction.description}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>积分变动: <span className="font-medium">{transaction.amount > 0 ? '+' : ''}{transaction.amount}</span></span>
                <span>余额: <span className="font-medium">{transaction.balanceAfter}</span></span>
              </div>
            </div>
          </div>

          {/* 异议截止时间 */}
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>异议申请截止时间: {formatTimeLeft(transaction.disputeTimeLeft)}</span>
          </div>

          {/* 异议原因 */}
          <div className="space-y-2">
            <Label htmlFor="reason">异议原因 *</Label>
            <Textarea
              id="reason"
              placeholder="请详细说明您对此积分交易的异议原因，例如：积分计算错误、重复扣分、活动规则不符等..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500">
              {reason.length}/500 字符 (最少10个字符)
            </div>
          </div>

          {/* 请求调整金额 */}
          <div className="space-y-2">
            <Label htmlFor="requested-amount">期望调整后的积分 (可选)</Label>
            <Input
              id="requested-amount"
              type="number"
              placeholder={`当前: ${transaction.amount}`}
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
            />
            <div className="text-xs text-gray-500">
              如果您认为积分应该是其他数值，请填写期望的积分数量
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createDisputeMutation.isPending || reason.trim().length < 10}
          >
            {createDisputeMutation.isPending ? '提交中...' : '提交异议'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
