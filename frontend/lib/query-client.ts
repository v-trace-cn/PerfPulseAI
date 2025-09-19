/**
 * 纯 React Query 架构 - 零 fetch，零 API 类
 * 
 * 设计理念：
 * - 所有API调用通过React Query管理
 * - 统一的查询键管理
 * - 公共函数复用
 * - 类型安全
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

// ==================== 请求工具函数 ====================

/**
 * 获取认证token
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * 构建请求headers
 */
export const getRequestHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'X-User-Id': token })
  }
}

/**
 * 构建URL和查询参数
 */
export const buildUrl = (url: string, params?: Record<string, any>): string => {
  if (!params) return url

  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * 基础请求函数
 */
export const request = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getRequestHeaders(),
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ==================== 类型定义 ====================

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: {
    items?: T[]
    activities?: T[]
    total: number
    page: number
    per_page: number
  }
  message: string
}

export interface QueryConfig<T = any> {
  queryKey: (string | number | boolean | undefined)[]
  url: string
  params?: Record<string, any>
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  retry?: number | boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface MutationConfig<TData = any, TVariables = any> {
  url: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  successMessage?: string
  errorMessage?: string
  invalidateQueries?: (string | number)[][]
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
}

// ==================== 查询键管理 ====================

export const queryKeys = {
  // 用户相关
  user: {
    all: ['users'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
    activities: (id: string, page?: number) => ['users', 'activities', id, page] as const,
  },
  
  // 公司相关
  company: {
    all: ['companies'] as const,
    list: (userId: string) => ['companies', 'list', userId] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },
  
  // 部门相关
  department: {
    all: ['departments'] as const,
    list: (userId: string) => ['departments', 'list', userId] as const,
    detail: (id: string) => ['departments', 'detail', id] as const,
  },
  
  // 活动相关
  activity: {
    all: ['activities'] as const,
    recent: (userId: string, page?: number, perPage?: number) => ['activities', 'recent', userId, page, perPage] as const,
    detail: (id: string) => ['activities', 'detail', id] as const,
    byShowId: (showId: string) => ['activities', 'show', showId] as const,
  },
  
  // PR相关
  pr: {
    all: ['pr'] as const,
    details: (activityId: string) => ['pr', 'details', activityId] as const,
  },
  
  // 积分相关
  points: {
    all: ['points'] as const,
    balance: (userId: string) => ['points', 'balance', userId] as const,
    transactions: (userId: string, params?: any) => ['points', 'transactions', userId, params] as const,
    overview: (userId: string) => ['points', 'overview', userId] as const,
  },
  
  // 商城相关
  mall: {
    all: ['mall'] as const,
    items: (params?: any) => ['mall', 'items', params] as const,
    item: (id: string) => ['mall', 'item', id] as const,
    purchases: (userId: string) => ['mall', 'purchases', userId] as const,
  },
  
  // 通知相关
  notification: {
    all: ['notifications'] as const,
    list: (category?: string) => ['notifications', 'list', category] as const,
  },
  
  // 评分相关
  scoring: {
    all: ['scoring'] as const,
    dimensions: () => ['scoring', 'dimensions'] as const,
  },
}

// ==================== 公共函数 ====================

/**
 * 获取用户ID
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

/**
 * 获取请求头
 */
function getRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  
  const userId = getUserId()
  if (userId) {
    headers['X-User-Id'] = userId
  }
  
  return headers
}

/**
 * 构建URL
 */
function buildUrl(url: string, params?: Record<string, any>): string {
  if (!params) return url
  
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * 通用请求函数
 */
async function request<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getRequestHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ==================== React Query Hooks ====================

/**
 * 通用查询Hook
 */
export function useApiQuery<T = any>(config: QueryConfig<T>) {
  const { toast } = useToast()
  
  return useQuery({
    queryKey: config.queryKey,
    queryFn: () => request<T>(buildUrl(config.url, config.params)),
    enabled: config.enabled ?? true,
    staleTime: config.staleTime ?? 5 * 60 * 1000, // 5分钟默认缓存
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
    retry: config.retry ?? 1,
    onSuccess: config.onSuccess,
    onError: (error: Error) => {
      console.error('Query error:', error)
      config.onError?.(error)
      if (!config.onError) {
        toast({
          title: "查询失败",
          description: error.message,
          variant: "destructive",
        })
      }
    }
  } as UseQueryOptions<T, Error>)
}

/**
 * 通用变更Hook
 */
export function useApiMutation<TData = any, TVariables = any>(config: MutationConfig<TData, TVariables>) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (variables: TVariables) => {
      const method = config.method || 'POST'
      return request<TData>(config.url, {
        method,
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      })
    },
    onSuccess: (data, variables) => {
      // 显示成功消息
      if (config.successMessage) {
        toast({
          title: "操作成功",
          description: config.successMessage,
        })
      }
      
      // 刷新相关查询
      if (config.invalidateQueries) {
        config.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      }
      
      config.onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      console.error('Mutation error:', error)
      config.onError?.(error, variables)
      
      if (!config.onError) {
        toast({
          title: "操作失败",
          description: config.errorMessage || error.message,
          variant: "destructive",
        })
      }
    }
  } as UseMutationOptions<TData, Error, TVariables>)
}

// ==================== 导出 ====================

export type { ApiResponse, PaginatedResponse, QueryConfig, MutationConfig }
