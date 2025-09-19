import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取统一的积分数据
 * GET /api/points/unified-data
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/unified-data',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取统一积分数据失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Unified points data API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
