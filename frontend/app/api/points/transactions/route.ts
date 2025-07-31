import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('page_size') || '20'
    const transactionType = searchParams.get('transaction_type') || ''

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

    let url = `${getBackendApiUrl()}/api/points/transactions?page=${page}&page_size=${pageSize}`
    if (transactionType) {
      url += `&transaction_type=${transactionType}`
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
        { error: errorData.message || errorData.detail || '获取交易记录失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
