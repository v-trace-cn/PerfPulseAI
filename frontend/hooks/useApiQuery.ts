/**
 * 临时兼容层 - useApiQuery Hook
 * 为了快速修复导入错误而创建的兼容版本
 * 
 * TODO: 逐步迁移到新的API系统
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

// 缓存时间常量
export const QUERY_STALE_TIME = {
  SHORT: 30 * 1000,      // 30秒
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 30 * 60 * 1000,  // 30分钟
}

// API错误类型
export interface ApiError {
  message: string
  status_code?: number
  details?: any
}

// 错误转换函数
function transformApiError(error: any): ApiError {
  if (error?.response) {
    return {
      message: error.response.data?.message || error.response.data?.detail || '请求失败',
      status_code: error.response.status,
      details: error.response.data,
    }
  }
  
  if (error?.message) {
    return {
      message: error.message,
      status_code: 500,
      details: error,
    }
  }
  
  return {
    message: '未知错误',
    status_code: 500,
    details: error,
  }
}

/**
 * 兼容版本的useApiQuery Hook
 */
export function useApiQuery<T = any>(
  key: any[],
  apiFunction: () => Promise<any>,
  options?: UseQueryOptions<T, ApiError>
) {
  const { toast } = useToast()
  
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: async () => {
      try {
        const response = await apiFunction()
        
        // 如果响应有success字段且为false，抛出错误
        if (response?.success === false) {
          throw new Error(response.message || 'API请求失败')
        }
        
        // 返回数据部分或整个响应
        return response?.data || response
      } catch (error) {
        const apiError = transformApiError(error)
        
        // 仅在服务器错误时显示toast
        if (apiError.status_code === 500) {
          toast({
            title: "系统错误",
            description: apiError.message,
            variant: "destructive",
          })
        }
        
        throw apiError
      }
    },
    staleTime: QUERY_STALE_TIME.MEDIUM,
    retry: (failureCount, error) => {
      // 对于4xx错误不重试
      if (error.status_code && error.status_code >= 400 && error.status_code < 500) {
        return false
      }
      return failureCount < 3
    },
    ...options,
  })
}
