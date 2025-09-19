import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

export async function GET(request: NextRequest) {
  // 检查必需的 permission 参数
  const { searchParams } = new URL(request.url)
  const permission = searchParams.get('permission')
  
  if (!permission) {
    return NextResponse.json(
      { success: false, message: '缺少权限参数' },
      { status: 400 }
    )
  }

  return proxyToBackend(
    request,
    '/api/roles/permissions/check',
    { ...PROXY_CONFIGS.PERMISSIONS, errorMessage: '权限检查失败' }
  )
}
