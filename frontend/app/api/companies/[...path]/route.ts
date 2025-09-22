/**
 * 公司API路由代理
 * 将前端请求转发到后端API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

// 构建后端API URL
function buildBackendUrl(path: string, searchParams?: URLSearchParams): string {
  // 处理特殊路径映射
  let backendPath = path
  
  // 将 /companies/{id}/departments 映射到 /departments?company_id={id}
  const departmentsMatch = path.match(/^(\d+)\/departments$/)
  if (departmentsMatch) {
    const companyId = departmentsMatch[1]
    const baseUrl = `${getBackendApiUrl()}/api/departments`
    const params = new URLSearchParams(searchParams)
    params.set('company_id', companyId)
    return `${baseUrl}?${params.toString()}`
  }
  
  const baseUrl = `${getBackendApiUrl()}/api/companies/${backendPath}`
  if (searchParams && searchParams.toString()) {
    return `${baseUrl}?${searchParams.toString()}`
  }
  return baseUrl
}

// 通用错误处理
function handleError(error: any, defaultMessage: string) {
  console.error(`Companies API error:`, error)
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  )
}

// 通用请求转发
async function forwardRequest(
  request: NextRequest, 
  path: string, 
  method: string = 'GET'
) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = buildBackendUrl(path, searchParams)

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // 添加用户认证信息（从请求头或cookie中获取）
    const userId = request.headers.get('X-User-Id') || request.cookies.get('userId')?.value
    if (userId) {
      headers['X-User-Id'] = userId
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
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    try {
      const response = await fetch(backendUrl, {
        method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          { error: errorData.message || errorData.detail || '请求失败' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: '请求超时' },
          { status: 408 }
        )
      }
      
      throw fetchError
    }
  } catch (error) {
    return handleError(error, '服务器内部错误')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  console.log('Companies GET API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  console.log('Companies POST API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  console.log('Companies PUT API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  console.log('Companies DELETE API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  console.log('Companies PATCH API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'PATCH')
}
