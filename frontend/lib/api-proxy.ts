/**
 * 通用 API 代理转发工具
 * 统一处理前端到后端的请求转发
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

export interface ProxyConfig {
  /** API 路径前缀，如 'departments', 'mall', 'users' */
  apiPrefix: string
  /** 超时时间（毫秒），默认 10000 */
  timeout?: number
  /** 是否需要用户认证，默认 true */
  requireAuth?: boolean
  /** 自定义路径映射函数 */
  pathMapper?: (path: string, searchParams: URLSearchParams) => string
}

/**
 * 构建后端 API URL
 */
function buildBackendUrl(
  apiPrefix: string, 
  path: string = '', 
  searchParams?: URLSearchParams,
  pathMapper?: (path: string, searchParams: URLSearchParams) => string
): string {
  // 如果有自定义路径映射，使用它
  if (pathMapper) {
    return pathMapper(path, searchParams || new URLSearchParams())
  }
  
  const basePath = path ? `${apiPrefix}/${path}` : apiPrefix
  const baseUrl = `${getBackendApiUrl()}/api/${basePath}`
  
  if (searchParams && searchParams.toString()) {
    return `${baseUrl}?${searchParams.toString()}`
  }
  return baseUrl
}

/**
 * 通用错误处理
 */
function handleError(error: any, defaultMessage: string, apiPrefix: string) {
  console.error(`${apiPrefix} API error:`, error)
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  )
}

/**
 * 通用请求转发函数
 */
export async function forwardRequest(
  request: NextRequest,
  config: ProxyConfig,
  path: string = '',
  method: string = 'GET'
) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = buildBackendUrl(
      config.apiPrefix, 
      path, 
      searchParams, 
      config.pathMapper
    )

    console.log(`${config.apiPrefix} ${method} API Route called:`, {
      path,
      url: request.url,
      backendUrl,
      backendApiUrl: getBackendApiUrl()
    })

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // 添加用户认证信息（从请求头或cookie中获取）
    if (config.requireAuth !== false) {
      const userId = request.headers.get('X-User-Id') || request.cookies.get('userId')?.value
      if (userId) {
        headers['X-User-Id'] = userId
      }
    }

    // 处理请求体
    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const requestBody = await request.json()
        body = JSON.stringify(requestBody)
      } catch {
        // 如果没有请求体或解析失败，继续处理
      }
    }

    // 设置超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000)

    try {
      console.log(`Fetching backend URL: ${backendUrl}`)
      const response = await fetch(backendUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`Backend response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Backend error response:`, errorData)
        return NextResponse.json(
          { error: errorData.message || errorData.detail || '请求失败' },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log(`Backend response data:`, data)
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      console.error(`Fetch error for ${backendUrl}:`, fetchError)

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: '请求超时' },
          { status: 408 }
        )
      }

      throw fetchError
    }
  } catch (error) {
    return handleError(error, '服务器内部错误', config.apiPrefix)
  }
}

/**
 * 创建标准的 HTTP 方法处理器
 */
export function createApiHandlers(config: ProxyConfig) {
  return {
    async GET(request: NextRequest, context?: { params: Promise<{ path: string[] }> }) {
      const path = context?.params ? (await context.params).path?.join('/') || '' : ''
      return forwardRequest(request, config, path, 'GET')
    },

    async POST(request: NextRequest, context?: { params: Promise<{ path: string[] }> }) {
      const path = context?.params ? (await context.params).path?.join('/') || '' : ''
      return forwardRequest(request, config, path, 'POST')
    },

    async PUT(request: NextRequest, context?: { params: Promise<{ path: string[] }> }) {
      const path = context?.params ? (await context.params).path?.join('/') || '' : ''
      return forwardRequest(request, config, path, 'PUT')
    },

    async DELETE(request: NextRequest, context?: { params: Promise<{ path: string[] }> }) {
      const path = context?.params ? (await context.params).path?.join('/') || '' : ''
      return forwardRequest(request, config, path, 'DELETE')
    },

    async PATCH(request: NextRequest, context?: { params: Promise<{ path: string[] }> }) {
      const path = context?.params ? (await context.params).path?.join('/') || '' : ''
      return forwardRequest(request, config, path, 'PATCH')
    }
  }
}

/**
 * 预定义的常用路径映射器
 */
export const pathMappers = {
  /**
   * 公司部门映射：/companies/{id}/departments -> /departments?company_id={id}
   */
  companyDepartments: (path: string, searchParams: URLSearchParams) => {
    const departmentsMatch = path.match(/^(\d+)\/departments$/)
    if (departmentsMatch) {
      const companyId = departmentsMatch[1]
      const baseUrl = `${getBackendApiUrl()}/api/departments`
      const params = new URLSearchParams(searchParams)
      params.set('company_id', companyId)
      return `${baseUrl}?${params.toString()}`
    }
    
    const baseUrl = `${getBackendApiUrl()}/api/companies/${path}`
    if (searchParams && searchParams.toString()) {
      return `${baseUrl}?${searchParams.toString()}`
    }
    return baseUrl
  }
}
