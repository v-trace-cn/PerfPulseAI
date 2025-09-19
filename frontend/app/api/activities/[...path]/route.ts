/**
 * 统一活动API路由 - 合并所有活动相关端点
 * 支持的路径：
 * - /api/activities/recent - 获取最近活动
 * - /api/activities/show/[showId] - 通过showId获取活动详情
 * - /api/activities/[activityId] - 获取/更新/删除活动
 * - /api/activities/user/[userId] - 获取用户活动
 * - /api/activities/analyze - 分析PR
 * - /api/activities/calculate-points - 计算积分
 * - /api/activities/reset-points - 重置积分
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

// 获取用户ID的通用函数
function getUserId(request: NextRequest): string | null {
  return request.headers.get('X-User-Id') ||
         request.nextUrl.searchParams.get('userId') ||
         request.cookies.get('userId')?.value ||
         null
}

// 构建后端API URL
function buildBackendUrl(path: string, searchParams?: URLSearchParams): string {
  const baseUrl = `${getBackendApiUrl()}/api/activities/${path}`
  if (searchParams && searchParams.toString()) {
    return `${baseUrl}?${searchParams.toString()}`
  }
  return baseUrl
}

// 通用错误处理
function handleError(error: any, defaultMessage: string) {
  console.error(`Activities API error:`, error)
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
      'Origin': getBackendApiUrl()
    }

    // 添加用户认证信息
    const userId = getUserId(request)
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
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时（活动分析可能需要更长时间）

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
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  console.log('Activities GET API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  console.log('Activities POST API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  console.log('Activities PUT API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  console.log('Activities DELETE API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  console.log('Activities PATCH API Route called:', { path, url: request.url })
  return forwardRequest(request, path, 'PATCH')
}
