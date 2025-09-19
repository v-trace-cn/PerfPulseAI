import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, PROXY_CONFIGS } from '@/lib/api-proxy'

export async function GET(request: NextRequest) {
  // 检查必需的 companyId 参数
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  
  if (!companyId) {
    return NextResponse.json(
      { success: false, message: '缺少公司ID参数' },
      { status: 400 }
    )
  }

  return proxyToBackend(
    request,
    '/api/roles/permissions/can_view_admin_menus',
    { ...PROXY_CONFIGS.PERMISSIONS, errorMessage: '权限检查失败' }
  )
}
