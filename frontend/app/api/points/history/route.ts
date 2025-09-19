import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取积分历史记录（别名路由）
 * GET /api/points/history -> /api/points/transactions
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/transactions',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取积分历史记录失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Points history API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
