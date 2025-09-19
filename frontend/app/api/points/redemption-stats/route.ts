import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取用户兑换统计
 * GET /api/points/redemption-stats
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/redemption-stats',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取兑换统计失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Redemption stats API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
