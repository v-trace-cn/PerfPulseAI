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

    const response = await fetch(`${getBackendApiUrl()}/api/mall/verify-redemption-code`, {
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
        { error: errorData.message || errorData.detail || '验证兑换密钥失败' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Verify redemption code API error:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
