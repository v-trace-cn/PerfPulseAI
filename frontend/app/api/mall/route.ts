import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 商城根路由处理器
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // 移除 action 参数，传递其他所有参数给后端
    searchParams.delete('action')
    const queryString = searchParams.toString()

    let backendEndpoint: string
    let requireAuth = true

    switch (action) {
      case 'items':
        backendEndpoint = `/api/mall/items${queryString ? `?${queryString}` : ''}`
        requireAuth = false // 可选认证
        break
        
      case 'items-public':
        backendEndpoint = `/api/mall/items/public${queryString ? `?${queryString}` : ''}`
        requireAuth = false
        break
        
      case 'purchases':
        backendEndpoint = `/api/mall/purchases${queryString ? `?${queryString}` : ''}`
        requireAuth = true
        break
        
      case 'analytics':
        backendEndpoint = `/api/mall/analytics${queryString ? `?${queryString}` : ''}`
        requireAuth = true
        break
        
      case 'statistics':
        backendEndpoint = `/api/mall/statistics${queryString ? `?${queryString}` : ''}`
        requireAuth = true
        break
        
      default:
        return NextResponse.json(
          { success: false, message: '不支持的操作类型' },
          { status: 400 }
        )
    }

    // 检查认证要求
    const userId = request.headers.get('X-User-Id') || 
                   request.cookies.get('token')?.value

    if (requireAuth && !userId) {
      return NextResponse.json(
        { success: false, message: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    return proxyToBackend(
      request,
      backendEndpoint,
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '商城操作失败',
        requireAuth 
      }
    )

  } catch (error) {
    console.error('Mall GET API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const userId = request.headers.get('X-User-Id') || 
                   request.cookies.get('token')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    let backendEndpoint: string

    switch (action) {
      case 'purchase':
        backendEndpoint = '/api/mall/purchase'
        break
        
      case 'redeem-code':
        backendEndpoint = '/api/mall/redeem-code'
        break
        
      case 'verify-redemption-code':
        backendEndpoint = '/api/mall/verify-redemption-code'
        break
        
      default:
        return NextResponse.json(
          { success: false, message: '不支持的操作类型' },
          { status: 400 }
        )
    }

    return proxyToBackend(
      request,
      backendEndpoint,
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '商城操作失败',
        requireAuth: true 
      }
    )

  } catch (error) {
    console.error('Mall POST API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
