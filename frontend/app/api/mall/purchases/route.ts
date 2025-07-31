import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('page_size') || '20'
    const status = searchParams.get('status') || ''

    // 从请求头或查询参数中获取用户ID
    const userId = request.headers.get('X-User-Id') ||
                   searchParams.get('userId') ||
                   request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    // 构建后端API URL - 使用 /my 端点获取当前用户的购买记录
    let url = `${getBackendApiUrl()}/api/mall/purchases/my?limit=${pageSize}&offset=${(parseInt(page) - 1) * parseInt(pageSize)}`
    if (status) {
      url += `&status=${status}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.detail || '获取购买记录失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // 转换为前端期望的格式
    const purchases = Array.isArray(data) ? data : (data.purchases || [])
    const totalCount = data.totalCount || purchases.length
    const currentPage = parseInt(page)
    const currentPageSize = parseInt(pageSize)
    const totalPages = Math.ceil(totalCount / currentPageSize)

    return NextResponse.json({
      purchases,
      totalCount,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    })
  } catch (error) {
    console.error('Mall purchases API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
