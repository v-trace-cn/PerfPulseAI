/**
 * 商城分析相关的 hooks - 按照编码共识标准设计
 */
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context-rq'

// 类型定义
export interface MallAnalyticsOverview {
  userSummary: any
  itemsStats: {
    totalItems: number
    availableItems: number
    lowStockItems: number
  }
  popularItems: Array<{
    name: string
    purchaseCount: number
    viewCount: number
  }>
}

export interface MallTrends {
  dailyTrends: Array<{
    date: string
    redemptions: number
    pointsSpent: number
    uniqueUsers: number
  }>
  categoryStats: Array<{
    category: string
    redemptions: number
    pointsSpent: number
  }>
  period: {
    startDate: string
    endDate: string
    days: number
  }
}

// 导入新的API服务
// 重新导出 mall-hooks 中的分析功能
export { useMallAnalytics } from '@/lib/mall-hooks'

// 兼容性别名
export function useMallAnalyticsOverview() {
  return useMallAnalytics()
}

export function useMallTrends(days: number = 30) {
  // 暂时使用基础分析数据，后续可扩展为具体的趋势分析
  return useMallAnalytics()
}

// 数据处理工具函数
export function processTrendsData(trends: MallTrends) {
  // 处理日趋势数据，用于图表展示
  const chartData = trends.dailyTrends.map(item => ({
    date: new Date(item.date).toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    }),
    兑换次数: item.redemptions,
    消费积分: item.pointsSpent,
    活跃用户: item.uniqueUsers
  }))

  // 处理分类数据，用于饼图
  const categoryData = trends.categoryStats.map(item => ({
    name: item.category,
    value: item.redemptions,
    points: item.pointsSpent
  }))

  // 计算总计
  const totals = trends.dailyTrends.reduce(
    (acc, item) => ({
      totalRedemptions: acc.totalRedemptions + item.redemptions,
      totalPoints: acc.totalPoints + item.pointsSpent,
      totalUsers: Math.max(acc.totalUsers, item.uniqueUsers) // 取最大值作为总用户数估算
    }),
    { totalRedemptions: 0, totalPoints: 0, totalUsers: 0 }
  )

  return {
    chartData,
    categoryData,
    totals,
    period: trends.period
  }
}

// 格式化工具函数
export function formatAnalyticsNumber(num: number, type: 'count' | 'points' | 'percentage' = 'count') {
  if (type === 'points') {
    return `${num.toLocaleString()} 积分`
  }
  
  if (type === 'percentage') {
    return `${num.toFixed(1)}%`
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  
  return num.toString()
}

// 计算增长率
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// 获取趋势指示器
export function getTrendIndicator(growthRate: number): {
  direction: 'up' | 'down' | 'stable'
  color: 'green' | 'red' | 'gray'
  icon: string
} {
  if (Math.abs(growthRate) < 1) {
    return { direction: 'stable', color: 'gray', icon: '→' }
  }
  
  if (growthRate > 0) {
    return { direction: 'up', color: 'green', icon: '↗' }
  }
  
  return { direction: 'down', color: 'red', icon: '↘' }
}
