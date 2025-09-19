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
    const permission = searchParams.get('permission')
    const companyId = searchParams.get('companyId')
    
    if (!permission) {
      return NextResponse.json(
        { success: false, message: '缺少权限参数' },
        { status: 400 }
      )
    }

    // 构建查询参数
    const queryParams = new URLSearchParams()
    queryParams.append('permission', permission)
    if (companyId) {
      queryParams.append('companyId', companyId)
    }

    // 构建后端API URL
    const backendUrl = `${getBackendApiUrl()}/api/roles/permissions/check?${queryParams.toString()}`
    
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
    console.error('Permission check error:', error)
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
