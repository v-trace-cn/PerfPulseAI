/**
 * 积分相关查询 - 纯 React Query 实现
 */

import { useApiQuery, useApiMutation, queryKeys } from '@/lib/query-client'
import { useAuth } from '@/lib/auth-context-rq'

// ==================== 类型定义 ====================

export interface PointsBalance {
  userId: string
  totalPoints: number
  availablePoints: number
  frozenPoints: number
  lastUpdated: string
}

export interface PointsTransaction {
  id: string
  userId: string
  points: number
  type: 'earn' | 'spend' | 'transfer' | 'refund' | 'freeze' | 'unfreeze'
  sourceType: string
  sourceId: string
  description: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  completedAt?: string
}

export interface PointsOverview {
  balance: PointsBalance
  recentTransactions: PointsTransaction[]
  monthlyStats: {
    earned: number
    spent: number
    net: number
  }
  yearlyStats: {
    earned: number
    spent: number
    net: number
  }
}

export interface TransferRequest {
  toUserId: string
  points: number
  description?: string
}

export interface PointsLedgerRecord {
  id: string
  userId: string
  points: number
  type: string
  sourceType: string
  sourceId: string
  description: string
  status: string
  createdAt: string
  showId?: string
}

// ==================== 查询 Hooks ====================

/**
 * 获取积分余额
 */
export function usePointsBalance() {
  const { user } = useAuth()
  
  return useApiQuery<PointsBalance>({
    queryKey: queryKeys.points.balance(user?.id || ''),
    url: '/api/points/balance',
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}

/**
 * 获取积分概览
 */
export function usePointsOverview() {
  const { user } = useAuth()
  
  return useApiQuery<PointsOverview>({
    queryKey: queryKeys.points.overview(user?.id || ''),
    url: '/api/points/overview',
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 获取积分交易记录
 */
export function usePointsTransactions(params?: {
  type?: string
  sourceType?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}) {
  const { user } = useAuth()
  
  return useApiQuery<{
    transactions: PointsTransaction[]
    total: number
    page: number
    pageSize: number
  }>({
    queryKey: queryKeys.points.transactions(user?.id || '', params),
    url: '/api/points/transactions',
    params,
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1分钟缓存
  })
}

/**
 * 获取积分统计
 */
export function usePointsStats(period: 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth()

  // 根据period选择对应的后端端点
  const getEndpoint = (period: string) => {
    switch (period) {
      case 'week':
        return '/api/points/weekly-stats'
      case 'month':
        return '/api/points/monthly-stats'
      case 'year':
        // 如果没有年度统计端点，使用月度统计作为fallback
        return '/api/points/monthly-stats'
      default:
        return '/api/points/monthly-stats'
    }
  }

  return useApiQuery({
    queryKey: ['points', 'stats', user?.id, period],
    url: getEndpoint(period),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取积分排行榜
 */
export function usePointsLeaderboard(params?: {
  period?: 'week' | 'month' | 'year' | 'all'
  limit?: number
  companyId?: string
  departmentId?: string
}) {
  return useApiQuery({
    queryKey: ['points', 'leaderboard', params],
    url: '/api/points/leaderboard',
    params,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取积分明细账本
 */
export function usePointsLedger(params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  type?: string
}) {
  const { user } = useAuth()
  
  return useApiQuery<{
    records: PointsLedgerRecord[]
    total: number
    page: number
    pageSize: number
  }>({
    queryKey: ['points', 'ledger', user?.id, params],
    url: '/api/points/ledger',
    params,
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1分钟缓存
  })
}

/**
 * 获取积分规则
 */
export function usePointsRules() {
  return useApiQuery({
    queryKey: ['points', 'rules'],
    url: '/api/points/rules',
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

// ==================== 变更 Hooks ====================

/**
 * 积分转账
 */
export function useTransferPoints() {
  const { user } = useAuth()
  
  return useApiMutation<PointsTransaction, TransferRequest>({
    url: '/api/points/transfer',
    method: 'POST',
    successMessage: '积分转账成功',
    invalidateQueries: [
      queryKeys.points.balance(user?.id || ''),
      queryKeys.points.transactions(user?.id || ''),
      queryKeys.points.overview(user?.id || ''),
    ],
  })
}

/**
 * 积分入账
 */
export function useAccruePoints() {
  return useApiMutation<PointsTransaction, {
    userId: string
    points: number
    sourceType: string
    sourceId: string
    description?: string
  }>({
    url: '/api/points/accrue',
    method: 'POST',
    successMessage: '积分入账成功',
    invalidateQueries: [
      queryKeys.points.all,
    ],
  })
}

/**
 * 积分扣除
 */
export function useDeductPoints() {
  return useApiMutation<PointsTransaction, {
    userId: string
    points: number
    sourceType: string
    sourceId: string
    description?: string
  }>({
    url: '/api/points/deduct',
    method: 'POST',
    successMessage: '积分扣除成功',
    invalidateQueries: [
      queryKeys.points.all,
    ],
  })
}

/**
 * 冻结积分
 */
export function useFreezePoints() {
  return useApiMutation<PointsTransaction, {
    userId: string
    points: number
    reason?: string
  }>({
    url: '/api/points/freeze',
    method: 'POST',
    successMessage: '积分冻结成功',
    invalidateQueries: [
      queryKeys.points.all,
    ],
  })
}

/**
 * 解冻积分
 */
export function useUnfreezePoints() {
  return useApiMutation<PointsTransaction, {
    userId: string
    points: number
    reason?: string
  }>({
    url: '/api/points/unfreeze',
    method: 'POST',
    successMessage: '积分解冻成功',
    invalidateQueries: [
      queryKeys.points.all,
    ],
  })
}

/**
 * 检查积分一致性
 */
export function useCheckPointsConsistency() {
  return useApiMutation<any, void>({
    url: '/api/points/consistency',
    method: 'POST',
    successMessage: '积分一致性检查完成',
  })
}

/**
 * 重新计算积分
 */
export function useRecalculatePoints() {
  return useApiMutation<any, { userId?: string }>({
    url: '/api/points/recalculate',
    method: 'POST',
    successMessage: '积分重新计算完成',
    invalidateQueries: [
      queryKeys.points.all,
    ],
  })
}
