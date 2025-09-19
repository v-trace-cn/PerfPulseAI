import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取用户月度积分统计
 * GET /api/points/monthly-stats
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/monthly-stats',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取月度积分统计失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Monthly stats API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
