/**
 * API工具函数 - 用于Next.js API路由
 */
import { NextRequest } from 'next/server'
import { API_CONSTANTS } from '@/lib/constants'

/**
 * 从请求中获取用户ID
 */
export function getUserId(request: NextRequest): string | null {
  // 优先从header获取
  const headerUserId = request.headers.get('X-User-Id')
  if (headerUserId) return headerUserId
  
  // 从cookie获取
  const cookieUserId = request.cookies.get('userId')?.value
  if (cookieUserId) return cookieUserId
  
  return null
}

/**
 * 获取后端API URL
 */
export function getBackendApiUrl(): string {
  return API_CONSTANTS.BASE_URL
}

/**
 * 创建代理请求的通用函数
 */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  options: {
    method?: string
    body?: any
    additionalHeaders?: Record<string, string>
  } = {}
) {
  const userId = getUserId(request)
  if (!userId) {
    return {
      success: false,
      message: '未提供用户ID',
      status: 401
    }
  }

  const { method = 'GET', body, additionalHeaders = {} } = options
  
  try {
    const response = await fetch(`${getBackendApiUrl()}${backendPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
        ...additionalHeaders
      },
      ...(body && { body: JSON.stringify(body) })
    })

    const data = await response.json().catch(() => ({}))
    
    return {
      data,
      status: response.status,
      success: response.ok
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || '请求失败',
      status: 500
    }
  }
}
