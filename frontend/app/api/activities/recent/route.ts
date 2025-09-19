import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取最近活动列表
 * GET /api/activities/recent
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/activities/recent',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取最近活动失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Recent activities API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
