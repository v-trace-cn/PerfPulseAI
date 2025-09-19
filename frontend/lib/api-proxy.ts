/**
 * 统一的后端 API 代理工具
 * 
 * 设计理念：
 * - 统一的错误处理
 * - 自动的用户认证
 * - 标准化的请求/响应格式
 * - 减少重复代码
 * - 提高维护性
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

/**
 * 代理配置选项
 */
interface ProxyOptions {
  /** 是否需要用户认证，默认为 true */
  requireAuth?: boolean
  /** 自定义错误消息 */
  errorMessage?: string
  /** 额外的请求头 */
  extraHeaders?: Record<string, string>
  /** 请求超时时间（毫秒），默认 30 秒 */
  timeout?: number
  /** 是否记录详细日志，默认在开发环境启用 */
  enableLogging?: boolean
}

/**
 * 从请求中获取用户ID的多种方式
 */
function getUserId(request: NextRequest): string | null {
  // 优先级：Header > Query Parameter > Cookie
  const headerId = request.headers.get('X-User-Id')
  if (headerId) return headerId

  const url = new URL(request.url)
  const queryId = url.searchParams.get('userId')
  if (queryId) return queryId

  const cookieId = request.cookies.get('userId')?.value || 
                   request.cookies.get('token')?.value
  if (cookieId) return cookieId

  return null
}

/**
 * 构建后端 API URL
 */
function buildBackendUrl(endpoint: string, searchParams?: URLSearchParams): string {
  const baseUrl = getBackendApiUrl()
  const url = `${baseUrl}${endpoint}`
  
  if (searchParams && searchParams.toString()) {
    return `${url}?${searchParams.toString()}`
  }
  
  return url
}

/**
 * 记录请求日志
 */
function logRequest(method: string, url: string, userId?: string | null, extra?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 API Proxy: ${method} ${url}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...extra
    })
  }
}

/**
 * 记录响应日志
 */
function logResponse(method: string, url: string, status: number, duration: number) {
  if (process.env.NODE_ENV === 'development') {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌'
    console.log(`${emoji} API Proxy: ${method} ${url} - ${status} (${duration}ms)`)
  }
}

/**
 * 通用的后端 API 代理函数
 * 
 * @param request Next.js 请求对象
 * @param endpoint 后端 API 端点（如：'/api/roles/users/1/roles'）
 * @param options 代理配置选项
 * @returns Next.js 响应对象
 */
export async function proxyToBackend(
  request: NextRequest,
  endpoint: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  const startTime = Date.now()
  const method = request.method
  
  const {
    requireAuth = true,
    errorMessage = '请求失败',
    extraHeaders = {},
    timeout = 30000,
    enableLogging = process.env.NODE_ENV === 'development'
  } = options

  try {
    // 1. 用户认证检查
    let userId: string | null = null
    if (requireAuth) {
      userId = getUserId(request)
      if (!userId) {
        return NextResponse.json(
          { success: false, message: '未提供用户身份信息' },
          { status: 401 }
        )
      }
    }

    // 2. 构建请求 URL
    const { searchParams } = new URL(request.url)
    const backendUrl = buildBackendUrl(endpoint, searchParams)

    // 3. 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders
    }

    if (userId) {
      headers['X-User-Id'] = userId
    }

    // 4. 准备请求体（如果有）
    let body: string | undefined
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const requestBody = await request.json()
        body = JSON.stringify(requestBody)
      } catch {
        // 如果解析失败，可能是空请求体
        body = undefined
      }
    }

    // 5. 记录请求日志
    if (enableLogging) {
      logRequest(method, backendUrl, userId, { body: body ? JSON.parse(body) : undefined })
    }

    // 6. 发送请求到后端
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // 7. 处理响应
    const duration = Date.now() - startTime
    if (enableLogging) {
      logResponse(method, backendUrl, response.status, duration)
    }

    // 8. 解析响应数据
    let responseData: any
    try {
      responseData = await response.json()
    } catch {
      responseData = { success: false, message: '响应数据解析失败' }
    }

    // 9. 返回响应
    return NextResponse.json(responseData, { status: response.status })

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // 处理超时错误
    if (error.name === 'AbortError') {
      if (enableLogging) {
        console.error(`⏰ API Proxy Timeout: ${method} ${endpoint} (${duration}ms)`)
      }
      return NextResponse.json(
        { success: false, message: '请求超时，请稍后重试' },
        { status: 408 }
      )
    }

    // 处理其他错误
    if (enableLogging) {
      console.error(`💥 API Proxy Error: ${method} ${endpoint}`, {
        error: error.message,
        duration,
        stack: error.stack
      })
    }

    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * 创建带有路径参数的代理函数
 * 
 * @param request Next.js 请求对象
 * @param endpointTemplate 端点模板（如：'/api/roles/users/{userId}/roles'）
 * @param params 路径参数对象（如：{ userId: '1' }）
 * @param options 代理配置选项
 * @returns Next.js 响应对象
 */
export async function proxyToBackendWithParams(
  request: NextRequest,
  endpointTemplate: string,
  params: Record<string, string>,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  // 替换路径参数
  let endpoint = endpointTemplate
  for (const [key, value] of Object.entries(params)) {
    endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(value))
  }

  return proxyToBackend(request, endpoint, options)
}

/**
 * 快捷方法：创建标准的 CRUD 代理函数
 */
export const createCrudProxy = (basePath: string) => ({
  /**
   * GET /api/resource
   */
  list: (request: NextRequest, options?: ProxyOptions) =>
    proxyToBackend(request, basePath, options),

  /**
   * GET /api/resource/{id}
   */
  get: (request: NextRequest, id: string, options?: ProxyOptions) =>
    proxyToBackend(request, `${basePath}/${encodeURIComponent(id)}`, options),

  /**
   * POST /api/resource
   */
  create: (request: NextRequest, options?: ProxyOptions) =>
    proxyToBackend(request, basePath, options),

  /**
   * PUT /api/resource/{id}
   */
  update: (request: NextRequest, id: string, options?: ProxyOptions) =>
    proxyToBackend(request, `${basePath}/${encodeURIComponent(id)}`, options),

  /**
   * DELETE /api/resource/{id}
   */
  delete: (request: NextRequest, id: string, options?: ProxyOptions) =>
    proxyToBackend(request, `${basePath}/${encodeURIComponent(id)}`, options),
})

/**
 * 预定义的常用代理配置
 */
export const PROXY_CONFIGS = {
  /** 标准配置：需要认证，标准错误消息 */
  STANDARD: {},
  
  /** 公开配置：不需要认证 */
  PUBLIC: { requireAuth: false },
  
  /** 角色管理配置 */
  ROLES: { errorMessage: '角色操作失败' },
  
  /** 权限检查配置 */
  PERMISSIONS: { errorMessage: '权限检查失败' },
  
  /** 用户管理配置 */
  USERS: { errorMessage: '用户操作失败' },
  
  /** 长时间操作配置 */
  LONG_RUNNING: { timeout: 60000 }, // 60秒
} as const
