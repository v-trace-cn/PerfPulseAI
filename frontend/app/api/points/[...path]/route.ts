/**
 * 统一积分API路由 - 合并所有积分相关端点
 * 支持的路径：
 * - /api/points/balance - 获取积分余额
 * - /api/points/summary - 获取积分摘要
 * - /api/points/transactions - 获取交易记录
 * - /api/points/history - 获取积分历史
 * - /api/points/ledger - 获取积分账本
 * - /api/points/levels - 获取等级信息
 * - /api/points/weekly-stats - 获取周统计
 * - /api/points/monthly-stats - 获取月统计
 * - /api/points/redemption-stats - 获取兑换统计
 * - /api/points/unified - 获取统一数据
 * - /api/points/transfer - 转账积分
 * - /api/points/accrue - 增加积分
 * - /api/points/deduct - 扣除积分
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
    const userId = getUserId(request)
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
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  return forwardRequest(request, path, 'PATCH')
}
