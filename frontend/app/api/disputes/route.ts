import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 从请求头获取用户ID
    const userId = request.headers.get('X-User-Id')

    if (!userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    const response = await fetch(`${getBackendApiUrl()}/api/disputes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.detail || '提交异议失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dispute creation API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

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

    let url = `${getBackendApiUrl()}/api/disputes?page=${page}&page_size=${pageSize}`
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
        { error: errorData.message || errorData.detail || '获取异议列表失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Disputes list API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
