import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

/**
 * 统一的 Mall API 路由处理器
 * 
 * 支持的端点：
 * GET /api/mall?action=items - 获取商品列表
 * GET /api/mall?action=items-public - 获取公开商品列表
 * POST /api/mall?action=purchase - 购买商品
 * POST /api/mall?action=redeem-code - 兑换码核销
 * GET /api/mall?action=purchases - 获取购买记录
 * GET /api/mall?action=analytics - 获取分析数据
 * GET /api/mall?action=statistics - 获取统计数据
 */

// 获取用户ID的辅助函数
function getUserId(request: NextRequest): string | null {
  return request.headers.get('X-User-Id') || 
         request.cookies.get('token')?.value ||
         null
}

// 构建请求头的辅助函数
function buildHeaders(userId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  
  if (userId) {
    headers['X-User-Id'] = userId
  }
  
  return headers
}

// 错误处理辅助函数
async function handleApiError(response: Response, defaultMessage: string) {
  const errorData = await response.json().catch(() => ({}))
  return NextResponse.json(
    { error: errorData.message || errorData.detail || defaultMessage },
    { status: response.status }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = getUserId(request)

    // 移除 action 参数，传递其他所有参数给后端
    searchParams.delete('action')
    const queryString = searchParams.toString()

    let backendUrl: string
    let requireAuth = true

    switch (action) {
      case 'items':
        backendUrl = `${getBackendApiUrl()}/api/mall/items?${queryString}`
        requireAuth = false // 可选认证
        break
        
      case 'items-public':
        backendUrl = `${getBackendApiUrl()}/api/mall/items/public?${queryString}`
        requireAuth = false
        break
        
      case 'purchases':
        backendUrl = `${getBackendApiUrl()}/api/mall/purchases?${queryString}`
        requireAuth = true
        break
        
      case 'analytics':
        backendUrl = `${getBackendApiUrl()}/api/mall/analytics?${queryString}`
        requireAuth = true
        break
        
      case 'statistics':
        backendUrl = `${getBackendApiUrl()}/api/mall/statistics?${queryString}`
        requireAuth = true
        break
        
      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        )
    }

    // 检查认证要求
    if (requireAuth && !userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: buildHeaders(userId),
    })

    if (!response.ok) {
      return await handleApiError(response, '获取数据失败')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Mall GET API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = getUserId(request)
    const body = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    let backendUrl: string

    switch (action) {
      case 'purchase':
        backendUrl = `${getBackendApiUrl()}/api/mall/purchase`
        break
        
      case 'redeem-code':
        backendUrl = `${getBackendApiUrl()}/api/mall/redeem-code`
        break
        
      case 'verify-redemption-code':
        backendUrl = `${getBackendApiUrl()}/api/mall/verify-redemption-code`
        break
        
      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        )
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: buildHeaders(userId),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return await handleApiError(response, '操作失败')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Mall POST API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
