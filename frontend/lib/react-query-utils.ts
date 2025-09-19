/**
 * React Query 公共工具函数
 * 提供统一的查询、变更和错误处理
 */
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { API_CONSTANTS } from '@/lib/constants'

// ==================== 类型定义 ====================

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface QueryConfig<T = any> {
  queryKey: (string | number | boolean | undefined)[]
  queryFn: () => Promise<T>
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  retry?: boolean | number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface MutationConfig<TData = any, TVariables = any> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  successMessage?: string
  errorMessage?: string
  showSuccessToast?: boolean
  showErrorToast?: boolean
  invalidateQueries?: (string | number)[][]
}

// ==================== 认证和请求工具 ====================

/**
 * 获取认证token
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * 获取请求headers
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
 * 构建查询参数
 */
export const buildQueryParams = (params: Record<string, any>): string => {
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
  
  return searchParams.toString()
}

/**
 * 基础API请求函数
 * 对于前端调用，使用相对路径会通过Next.js API路由
 * 对于服务端调用，使用完整URL直接调用后端
 */
export const apiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // 如果是完整URL，直接使用；否则判断是否为前端调用
  let fullUrl: string
  if (url.startsWith('http')) {
    fullUrl = url
  } else if (typeof window !== 'undefined') {
    // 浏览器环境：使用相对路径，通过Next.js API路由
    fullUrl = url
  } else {
    // 服务端环境：使用完整URL直接调用后端
    fullUrl = `${API_CONSTANTS.BASE_URL}${url}`
  }

  const response = await fetch(fullUrl, {
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

// ==================== React Query Hooks ====================

/**
 * 通用查询Hook
 */
export function useApiQuery<T = any>(config: QueryConfig<T>) {
  const { toast } = useToast()
  
  return useQuery({
    queryKey: config.queryKey,
    queryFn: config.queryFn,
    enabled: config.enabled ?? true,
    staleTime: config.staleTime ?? 5 * 60 * 1000, // 5分钟默认缓存
    cacheTime: config.cacheTime ?? 10 * 60 * 1000, // 10分钟缓存时间
    refetchOnWindowFocus: config.refetchOnWindowFocus ?? false,
    retry: config.retry ?? 1,
    onSuccess: (data) => {
      config.onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('Query error:', error)
      config.onError?.(error)
      toast({
        title: "查询失败",
        description: error.message,
        variant: "destructive",
      })
    }
  } as UseQueryOptions<T, Error>)
}

/**
 * 通用变更Hook
 */
export function useApiMutation<TData = any, TVariables = any>(
  config: MutationConfig<TData, TVariables>
) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: config.mutationFn,
    onSuccess: (data, variables) => {
      // 显示成功提示
      if (config.showSuccessToast !== false && config.successMessage) {
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
      
      // 显示错误提示
      if (config.showErrorToast !== false) {
        toast({
          title: "操作失败",
          description: config.errorMessage || error.message,
          variant: "destructive",
        })
      }
      
      config.onError?.(error, variables)
    }
  } as UseMutationOptions<TData, Error, TVariables>)
}

// ==================== 常用查询键生成器 ====================

export const createQueryKey = {
  /**
   * 列表查询键
   */
  list: (resource: string, params?: Record<string, any>) => [
    resource, 
    'list', 
    ...(params ? [params] : [])
  ],
  
  /**
   * 详情查询键
   */
  detail: (resource: string, id: string | number) => [
    resource, 
    'detail', 
    id
  ],
  
  /**
   * 搜索查询键
   */
  search: (resource: string, query: string, params?: Record<string, any>) => [
    resource, 
    'search', 
    query,
    ...(params ? [params] : [])
  ],
  
  /**
   * 统计查询键
   */
  stats: (resource: string, params?: Record<string, any>) => [
    resource, 
    'stats',
    ...(params ? [params] : [])
  ],
  
  /**
   * 权限查询键
   */
  permission: (action: string, resource?: string, params?: Record<string, any>) => [
    'permission',
    action,
    ...(resource ? [resource] : []),
    ...(params ? [params] : [])
  ]
}

// ==================== 分页工具 ====================

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  pageSize: 10,
  sortBy: 'created_at',
  sortOrder: 'desc'
}

/**
 * 分页查询Hook
 */
export function usePaginatedQuery<T = any>(
  resource: string,
  fetcher: (params: PaginationParams & Record<string, any>) => Promise<PaginatedResponse<T>>,
  params: PaginationParams & Record<string, any> = {},
  options?: Partial<QueryConfig<PaginatedResponse<T>>>
) {
  const finalParams = { ...DEFAULT_PAGINATION, ...params }
  
  return useApiQuery<PaginatedResponse<T>>({
    queryKey: createQueryKey.list(resource, finalParams),
    queryFn: () => fetcher(finalParams),
    ...options
  })
}
