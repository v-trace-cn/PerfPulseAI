/**
 * 积分系统API服务 - 使用统一的API客户端
 */
import { api } from '@/lib/api-client'

// 类型定义
export interface PointsBalance {
  userId: number
  balance: number
}

export interface PointsSummary {
  userId: number
  currentBalance: number
  totalTransactions: number
  totalEarned: number
  totalSpent: number
  lastTransactionDate?: string
  currentLevel?: any
  nextLevel?: any
  pointsToNext?: number
  progressPercentage: number
  totalRedemptions: number
  totalPointsSpentOnRedemptions: number
  monthlyRedemptions: number
  monthlyPointsSpentOnRedemptions: number
}

export interface PointTransaction {
  id: string
  userId: number
  transactionType: string
  amount: number
  balanceAfter: number
  referenceId?: string
  referenceType?: string
  description?: string
  createdAt: string
}

export interface TransferRequest {
  toUserId: number
  amount: number
  description?: string
}

// 积分API服务类
export class PointsApiService {
  // ==================== 基础查询 ====================
  
  /**
   * 获取积分余额
   */
  static async getBalance(): Promise<PointsBalance> {
    return api.get('/api/points/balance')
  }

  /**
   * 获取积分摘要
   */
  static async getSummary(): Promise<PointsSummary> {
    return api.get('/api/points/summary')
  }

  /**
   * 获取统一积分数据（推荐使用）
   */
  static async getUnifiedData() {
    return api.get('/api/points/unified-data')
  }

  // ==================== 交易记录 ====================
  
  /**
   * 获取积分交易记录
   */
  static async getTransactions(params?: {
    page?: number
    page_size?: number
    transaction_type?: string
    start_date?: string
    end_date?: string
  }) {
    return api.get('/api/points/transactions', { params })
  }

  /**
   * 获取交易摘要
   */
  static async getTransactionsSummary() {
    return api.get('/api/points/transactions/summary')
  }

  // ==================== 统计分析 ====================
  
  /**
   * 获取周度统计
   */
  static async getWeeklyStats() {
    return api.get('/api/points/weekly-stats')
  }

  /**
   * 获取月度统计
   */
  static async getMonthlyStats(params?: {
    year?: number
    month?: number
  }) {
    return api.get('/api/points/monthly-stats', { params })
  }

  /**
   * 获取兑换统计
   */
  static async getRedemptionStats() {
    return api.get('/api/points/redemption-stats')
  }

  // ==================== 等级系统 ====================
  
  /**
   * 获取等级信息
   */
  static async getLevels() {
    return api.get('/api/points/levels')
  }

  /**
   * 获取用户等级
   */
  static async getUserLevel() {
    return api.get('/api/points/user-level')
  }

  // ==================== 积分操作 ====================
  
  /**
   * 积分转账
   */
  static async transferPoints(request: TransferRequest) {
    return api.post('/api/points/transfer', request)
  }

  /**
   * 检查积分一致性
   */
  static async checkConsistency() {
    return api.get('/api/points/consistency')
  }

  // ==================== 规范化API ====================
  
  /**
   * 获取积分概览（规范化）
   */
  static async getOverview() {
    return api.get('/api/points/overview')
  }

  /**
   * 获取交易历史（规范化）
   */
  static async getHistory(params?: {
    page?: number
    page_size?: number
    type?: string
  }) {
    return api.get('/api/points/history', { params })
  }

  /**
   * 积分入账（规范化）
   */
  static async accrue(data: {
    userId: number
    points: number
    sourceType: string
    sourceId: string
    companyId?: number
  }) {
    return api.post('/api/points/accrue', data)
  }

  /**
   * 积分兑换（规范化）
   */
  static async redeem(data: {
    rewardId: string
    quantity?: number
  }) {
    return api.post('/api/points/redeem', data)
  }

  /**
   * 获取可兑换奖励列表
   */
  static async getRewards() {
    return api.get('/api/rewards')
  }

  // ==================== 管理员功能 ====================
  
  /**
   * 管理员查看用户积分余额
   */
  static async getAdminUserBalance(userId: number) {
    return api.get(`/api/points/admin/user/${userId}/balance`)
  }

  /**
   * 管理员调整用户积分
   */
  static async adjustUserPoints(userId: number, data: {
    amount: number
    reason: string
    type: 'earn' | 'spend' | 'adjust'
  }) {
    return api.post(`/api/points/admin/user/${userId}/adjust`, data)
  }

  /**
   * 管理员获取用户交易记录
   */
  static async getAdminUserTransactions(userId: number, params?: {
    page?: number
    page_size?: number
  }) {
    return api.get(`/api/points/admin/user/${userId}/transactions`, { params })
  }

  // ==================== 批量操作 ====================
  
  /**
   * 批量积分入账
   */
  static async batchAccrue(requests: Array<{
    userId: number
    points: number
    sourceType: string
    sourceId: string
  }>) {
    return api.post('/api/points/batch/accrue', { requests })
  }

  /**
   * 批量积分转账
   */
  static async batchTransfer(requests: TransferRequest[]) {
    return api.post('/api/points/batch/transfer', { requests })
  }

  // ==================== 导出功能 ====================
  
  /**
   * 导出积分交易记录
   */
  static async exportTransactions(params?: {
    start_date?: string
    end_date?: string
    format?: 'csv' | 'excel'
    transaction_type?: string
  }) {
    return api.get('/api/points/export/transactions', {
      params,
      responseType: 'blob'
    })
  }

  /**
   * 导出积分统计报告
   */
  static async exportReport(params?: {
    type?: 'summary' | 'detailed'
    period?: 'week' | 'month' | 'quarter' | 'year'
    format?: 'csv' | 'excel' | 'pdf'
  }) {
    return api.get('/api/points/export/report', {
      params,
      responseType: 'blob'
    })
  }
}

// 导出便捷方法
export const pointsApi = PointsApiService
