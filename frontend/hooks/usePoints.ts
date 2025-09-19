/**
 * 积分系统相关的 hooks - 使用统一的API客户端
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context-rq'
import { api } from '@/lib/api-client'

// 查询键常量
export const POINTS_QUERY_KEYS = {
  balance: (userId: string) => ['points-balance', userId],
  summary: (userId: string) => ['points-summary', userId],
  transactions: (userId: string, params?: any) => ['points-transactions', userId, params],
  weeklyStats: (userId: string) => ['points-weekly-stats', userId],
  monthlyStats: (userId: string, params?: any) => ['points-monthly-stats', userId, params],
  redemptionStats: (userId: string) => ['points-redemption-stats', userId],
  levels: () => ['points-levels'],
  userLevel: (userId: string) => ['points-user-level', userId],
  unified: (userId: string) => ['points-unified', userId],
}

// 基础查询 Hooks
export function usePointsBalance() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.balance(String(user?.id)),
    queryFn: () => api.get('/api/points/balance'),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

export function usePointsSummary() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.summary(String(user?.id)),
    queryFn: () => api.get('/api/points/summary'),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

export function usePointsUnified() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.unified(String(user?.id)),
    queryFn: () => api.get('/api/points/unified'),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

// 交易记录 Hooks
export function usePointsTransactions(params?: {
  page?: number
  page_size?: number
  transaction_type?: string
  start_date?: string
  end_date?: string
}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.transactions(String(user?.id), params),
    queryFn: () => api.get('/api/points/transactions', { params }),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1分钟缓存
  })
}

export function usePointsHistory(params?: {
  page?: number
  page_size?: number
  type?: string
}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['points-history', user?.id, params],
    queryFn: () => api.get('/api/points/history', { params }),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1分钟缓存
  })
}

// 统计分析 Hooks
export function usePointsWeeklyStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.weeklyStats(String(user?.id)),
    queryFn: () => api.get('/api/points/weekly-stats'),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

export function usePointsMonthlyStats(params?: {
  year?: number
  month?: number
}) {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.monthlyStats(String(user?.id), params),
    queryFn: () => api.get('/api/points/monthly-stats', { params }),
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

export function usePointsRedemptionStats() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.redemptionStats(String(user?.id)),
    queryFn: () => api.get('/api/points/redemption-stats'),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 等级系统 Hooks
export function usePointsLevels() {
  return useQuery({
    queryKey: POINTS_QUERY_KEYS.levels(),
    queryFn: () => api.get('/api/points/levels'),
    staleTime: 30 * 60 * 1000, // 30分钟缓存
  })
}

export function useUserLevel() {
  const { user } = useAuth()

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.userLevel(String(user?.id)),
    queryFn: () => api.get('/api/points/user-level'),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

// 操作 Hooks
export function useTransferPoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: any) => api.post('/api/points/transfer', data),
    onSuccess: (data) => {
      toast({
        title: "转账成功",
        description: `已成功转账 ${data.amount} 积分`,
      })
      
      // 刷新相关查询
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.balance(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.summary(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.transactions(String(user.id)) })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "转账失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export function useAccruePoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: any) => api.post('/api/points/accrue', data),
    onSuccess: (data) => {
      toast({
        title: "积分入账成功",
        description: `获得 ${data.points} 积分`,
      })
      
      // 刷新相关查询
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.balance(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.summary(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.transactions(String(user.id)) })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "积分入账失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// 管理员 Hooks
export function useAdminUserBalance(userId: number) {
  return useQuery({
    queryKey: ['admin-user-balance', userId],
    queryFn: () => pointsApi.getAdminUserBalance(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

export function useAdjustUserPoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      pointsApi.adjustUserPoints(userId, data),
    onSuccess: (data, variables) => {
      toast({
        title: "积分调整成功",
        description: `用户积分已调整`,
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['admin-user-balance', variables.userId] })
    },
    onError: (error: Error) => {
      toast({
        title: "积分调整失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// 批量操作 Hooks
export function useBatchAccruePoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pointsApi.batchAccrue,
    onSuccess: (data) => {
      toast({
        title: "批量入账成功",
        description: `已处理 ${data.successCount} 条记录`,
      })
      
      // 刷新所有积分相关查询
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (error: Error) => {
      toast({
        title: "批量入账失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// 导出功能 Hooks
export function useExportPointsData() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: pointsApi.exportTransactions,
    onSuccess: (blob) => {
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `points-transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "导出成功",
        description: "积分交易记录已导出",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "导出失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// 工具函数
export function useRefreshPointsData() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.balance(String(user.id)) })
      queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.summary(String(user.id)) })
      queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.transactions(String(user.id)) })
      queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.unified(String(user.id)) })
    }
  }
}
