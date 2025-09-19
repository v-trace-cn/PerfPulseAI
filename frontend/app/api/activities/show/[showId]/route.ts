import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

interface RouteContext {
  params: Promise<{
    showId: string
  }>
}

/**
 * 根据 showId 获取活动详情
 * GET /api/activities/show/{showId}
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params
    const { showId } = params
    
    return proxyToBackend(
      request,
      `/api/activities/show/${showId}`,
      { 
        ...PROXY_CONFIGS.STANDARD, 
        errorMessage: '获取活动详情失败',
        requireAuth: true 
      }
    )
  } catch (error) {
    console.error('Activity detail API error:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
