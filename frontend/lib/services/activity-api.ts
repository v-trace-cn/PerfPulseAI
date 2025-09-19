/**
 * 活动相关API服务
 * 使用统一的API客户端进行HTTP请求
 */
import { api } from '../api-client'

export interface Activity {
  id: string
  showId?: string
  userId: string
  type: string
  title: string
  description?: string
  points?: number
  status: string
  createdAt: string
  updatedAt?: string
}

export interface PullRequest {
  id: string
  nodeId: string
  number: number
  title: string
  body?: string
  state: string
  createdAt: string
  updatedAt?: string
  mergedAt?: string
  userId: string
  repositoryId: string
}

export interface AnalysisResult {
  id: string
  prNodeId: string
  aiAnalysisResult?: any
  calculatedPoints?: number
  status: string
  createdAt: string
}

/**
 * 活动API服务类
 */
export class ActivityApi {
  /**
   * 获取活动详情
   */
  static async getActivity(showId: string): Promise<Activity> {
    return api.get(`/api/activities/${showId}`)
  }

  /**
   * 获取活动列表
   */
  static async getActivities(params?: {
    page?: number
    pageSize?: number
    userId?: string
    type?: string
    status?: string
  }): Promise<{
    activities: Activity[]
    total: number
    page: number
    pageSize: number
  }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString())
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.status) searchParams.append('status', params.status)
    
    return api.get(`/api/activities?${searchParams.toString()}`)
  }

  /**
   * 重置活动积分
   */
  static async resetActivityPoints(activityId: string): Promise<{ message: string }> {
    return api.post(`/api/activities/${activityId}/reset-points`)
  }

  /**
   * 更新活动状态
   */
  static async updateActivityStatus(activityId: string, status: string): Promise<Activity> {
    return api.put(`/api/activities/${activityId}/status`, { status })
  }
}

/**
 * PR相关API服务类
 */
export class PrApi {
  /**
   * 获取PR详情
   */
  static async getPrDetails(activityId: string): Promise<PullRequest> {
    return api.get(`/api/pr/details/${activityId}`)
  }

  /**
   * 分析PR
   */
  static async analyzePr(prNodeId: string): Promise<AnalysisResult> {
    return api.post('/api/pr/analyze', { prNodeId })
  }

  /**
   * 计算PR积分
   */
  static async calculatePrPoints(prNodeId: string): Promise<{
    points: number
    breakdown: any
    message: string
  }> {
    return api.post('/api/pr/calculate-points', { prNodeId })
  }

  /**
   * 获取PR分析结果
   */
  static async getAnalysisResult(prNodeId: string): Promise<AnalysisResult> {
    return api.get(`/api/pr/analysis/${prNodeId}`)
  }
}

// 导出默认实例
export const activityApi = ActivityApi
export const prApi = PrApi
