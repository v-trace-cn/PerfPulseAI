import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

/**
 * 获取活动列表
 * GET /api/activities
 */
export async function GET(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/activities',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取活动列表失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 创建新活动
 * POST /api/activities
 */
export async function POST(request: NextRequest) {
  try {
    return proxyToBackend(
      request,
      '/api/activities',
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '创建活动失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Create activity API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
