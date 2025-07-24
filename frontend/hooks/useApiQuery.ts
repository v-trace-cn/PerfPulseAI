import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  status_code?: number;
}

export interface ApiError {
  message: string;
  status_code?: number;
}

/**
 * 转换API错误为统一格式
 */
function transformApiError(error: any): ApiError {
  if (error.response?.data?.message) {
    return {
      message: error.response.data.message,
      status_code: error.response.status
    };
  }
  
  if (error.message) {
    return {
      message: error.message,
      status_code: error.status || 500
    };
  }
  
  return {
    message: '网络错误，请稍后重试',
    status_code: 500
  };
}

/**
 * 统一的API查询Hook
 * @param key - React Query的缓存键
 * @param apiFunction - 返回Promise的API函数
 * @param options - React Query选项
 */
export function useApiQuery<T>(
  key: QueryKey,
  apiFunction: () => Promise<ApiResponse<T>>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  const { toast } = useToast();
  
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: async () => {
      try {
        const response = await apiFunction();
        
        if (!response.success) {
          throw new Error(response.message || 'API请求失败');
        }
        
        return response.data;
      } catch (error) {
        const apiError = transformApiError(error);
        
        // 仅在非预期错误时显示toast
        if (apiError.status_code === 500) {
          toast({
            title: "系统错误",
            description: apiError.message,
            variant: "destructive",
          });
        }
        
        throw apiError;
      }
    },
    staleTime: 30000, // 默认30秒
    retry: (failureCount, error) => {
      // 对于4xx错误不重试
      if (error.status_code && error.status_code >= 400 && error.status_code < 500) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

/**
 * 预定义的查询时间配置
 */
export const QUERY_STALE_TIME = {
  INSTANT: 0,
  SHORT: 10 * 1000,     // 10秒
  DEFAULT: 30 * 1000,   // 30秒
  MEDIUM: 5 * 60 * 1000,  // 5分钟
  LONG: 30 * 60 * 1000,   // 30分钟
} as const;