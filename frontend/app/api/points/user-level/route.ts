import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取用户等级信息
 * GET /api/points/user-level -> /api/points/levels/my
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/levels/my',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取用户等级信息失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('User level API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
