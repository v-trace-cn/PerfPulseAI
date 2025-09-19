import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取所有等级信息
 * GET /api/points/levels
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/levels',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取等级信息失败',
        requireAuth: false // 等级信息可以公开访问
      }
    )
  } catch (error) {
    console.error('Points levels API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
