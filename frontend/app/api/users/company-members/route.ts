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
    const q = searchParams.get('q') // 搜索参数
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('pageSize') || '20'
    
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: '缺少公司ID参数' },
        { status: 400 }
      )
    }

    // 构建查询参数
    const queryParams = new URLSearchParams()
    queryParams.append('companyId', companyId)
    queryParams.append('page', page)
    queryParams.append('pageSize', pageSize)
    if (q) queryParams.append('q', q)

    // 构建后端API URL
    const backendUrl = `${getBackendApiUrl()}/api/users/company-members?${queryParams.toString()}`
    
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
    console.error('Company members fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '获取公司成员失败',
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}
