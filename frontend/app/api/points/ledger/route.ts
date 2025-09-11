import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('pageSize') || '20'
    const type = searchParams.get('type') || '' // earn|spend
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const keyword = searchParams.get('keyword') || ''

    // 用户ID：优先请求头 -> 查询 -> Cookie
    const userId = request.headers.get('X-User-Id') ||
                   searchParams.get('userId') ||
                   request.cookies.get('userId')?.value ||
                   ''

    if (!userId) {
      return NextResponse.json(
        { error: '未提供用户ID，请先登录' },
        { status: 401 }
      )
    }

    // 组装后端URL（仅在有值时附加可选参数）
    const qs: string[] = [
      `page=${encodeURIComponent(page)}`,
      `pageSize=${encodeURIComponent(pageSize)}`,
    ]
    if (type) qs.push(`type=${encodeURIComponent(type)}`)
    if (dateFrom) qs.push(`dateFrom=${encodeURIComponent(dateFrom)}`)
    if (dateTo) qs.push(`dateTo=${encodeURIComponent(dateTo)}`)
    if (keyword) qs.push(`keyword=${encodeURIComponent(keyword)}`)

    const url = `${getBackendApiUrl()}/api/points/ledger?${qs.join('&')}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any))
      return NextResponse.json(
        { error: errorData.message || errorData.detail || '获取积分流水失败' },
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

