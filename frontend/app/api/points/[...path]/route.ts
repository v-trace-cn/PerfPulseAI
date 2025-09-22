/**
 * 积分API路由代理
 * 将前端请求转发到后端API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

// 构建后端API URL
function buildBackendUrl(path: string, searchParams?: URLSearchParams): string {
  const baseUrl = `${getBackendApiUrl()}/api/points/${path}`
  if (searchParams && searchParams.toString()) {
    return `${baseUrl}?${searchParams.toString()}`
  }
  return baseUrl
}

// 通用错误处理
function handleError(error: any, defaultMessage: string) {
  console.error(`Points API error:`, error)
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
    const userId = request.headers.get('X-User-Id') || request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const backendUrl = buildBackendUrl(path, searchParams)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-User-Id': userId,
    }

    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      body = JSON.stringify(await request.json().catch(() => ({})))
    }

    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.detail || '请求失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
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
  return forwardRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return forwardRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return forwardRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const path = resolvedParams.path.join('/')
  return forwardRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'PATCH')
}
