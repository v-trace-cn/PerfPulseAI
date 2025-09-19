import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取用户积分余额
 * GET /api/points/balance
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/points/balance',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取积分余额失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Points balance API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
