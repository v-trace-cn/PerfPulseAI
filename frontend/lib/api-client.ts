/**
 * 统一的API客户端 - 按照编码共识标准设计
 * 
 * 设计理念：
 * - 统一的错误处理
 * - 自动的认证管理
 * - 请求/响应拦截器
 * - 类型安全的接口
 * - 性能监控和日志
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getBackendApiUrl } from '@/lib/config/api-config'

// 类型定义
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
  skipErrorToast?: boolean
}

// 创建axios实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '', // 使用相对路径，调用前端API路由
    timeout: 30000, // 30秒超时
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 自动添加用户ID到请求头
      const userId = getUserId()
      if (userId && !config.skipAuth) {
        config.headers['X-User-Id'] = userId
      }

      // 添加请求时间戳用于性能监控
      config.metadata = { startTime: Date.now() }

      // 开发环境日志
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        })
      }

      return config
    },
    (error) => {
      console.error('❌ Request Error:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // 计算请求耗时
      const duration = Date.now() - response.config.metadata?.startTime
      
      // 开发环境日志
      if (process.env.NODE_ENV === 'development') {
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          duration: `${duration}ms`,
          data: response.data,
        })
      }

      // 性能监控：记录慢请求
      if (duration > 3000) {
        console.warn(`Slow API Request: ${response.config.url} took ${duration}ms`)
      }

      return response
    },
    (error: AxiosError) => {
      const duration = Date.now() - (error.config?.metadata?.startTime || Date.now())
      
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        duration: `${duration}ms`,
        message: error.message,
        data: error.response?.data,
      })

      // 统一错误处理
      return Promise.reject(transformError(error))
    }
  )

  return client
}

// 获取用户ID的辅助函数
function getUserId(): string | null {
  if (typeof window === 'undefined') return null

  // 从认证系统获取token（实际上是userId）
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) return token

  // 备选：从cookie获取
  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
  if (tokenCookie) {
    return tokenCookie.split('=')[1]
  }

  return null
}

// 错误转换函数
function transformError(error: AxiosError): ApiError {
  if (error.response) {
    // 服务器响应错误
    const data = error.response.data as any
    return {
      message: data?.error || data?.detail || data?.message || '服务器错误',
      code: data?.code || `HTTP_${error.response.status}`,
      details: data,
    }
  } else if (error.request) {
    // 网络错误
    return {
      message: '网络连接失败，请检查网络设置',
      code: 'NETWORK_ERROR',
      details: error.request,
    }
  } else {
    // 其他错误
    return {
      message: error.message || '未知错误',
      code: 'UNKNOWN_ERROR',
      details: error,
    }
  }
}

// 创建全局API客户端实例
export const apiClient = createApiClient()

// 便捷方法
export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => 
    apiClient.get<T>(url, config).then(res => res.data),
    
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.post<T>(url, data, config).then(res => res.data),
    
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.put<T>(url, data, config).then(res => res.data),
    
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => 
    apiClient.patch<T>(url, data, config).then(res => res.data),
    
  delete: <T = any>(url: string, config?: RequestConfig) => 
    apiClient.delete<T>(url, config).then(res => res.data),
}

// 文件上传专用方法
export const uploadFile = async (
  url: string, 
  file: File, 
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    },
  }).then(res => res.data)
}

// 批量请求方法
export const batchRequest = async <T = any>(requests: Promise<T>[]): Promise<T[]> => {
  try {
    return await Promise.all(requests)
  } catch (error) {
    console.error('❌ Batch Request Error:', error)
    throw error
  }
}

// 重试机制
export const retryRequest = async <T = any>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) break
      
      // 指数退避延迟
      const retryDelay = delay * Math.pow(2, i)
      console.warn(`🔄 Retrying request in ${retryDelay}ms (attempt ${i + 1}/${maxRetries})`)
      
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  
  throw lastError
}

// 取消请求的控制器
export const createCancelToken = () => {
  const controller = new AbortController()
  return {
    token: controller.signal,
    cancel: (reason?: string) => controller.abort(reason),
  }
}

// 导出类型
export type { ApiResponse, ApiError, RequestConfig }
