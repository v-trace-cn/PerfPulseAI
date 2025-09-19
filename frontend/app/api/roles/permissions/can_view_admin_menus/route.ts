import { NextRequest, NextResponse } from 'next/server'

// 获取用户ID的辅助函数
function getUserId(request: NextRequest): string | null {
  return request.headers.get('X-User-Id') || 
         request.cookies.get('token')?.value ||
         null
}

// 获取后端API URL
function getBackendApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未提供用户身份信息' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: '缺少公司ID参数' },
        { status: 400 }
      )
    }

    // 构建后端API URL
    const backendUrl = `${getBackendApiUrl()}/api/roles/permissions/can_view_admin_menus?companyId=${encodeURIComponent(companyId)}`
    
    // 转发请求到后端
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    })

    const data = await response.json()
    
    return NextResponse.json(data, { 
      status: response.status 
    })
    
  } catch (error) {
    console.error('Admin menu permission check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '权限检查失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
