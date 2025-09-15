import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

function getUserId(req: NextRequest): string | null {
  const headerId = req.headers.get('X-User-Id')
  const url = new URL(req.url)
  const qpId = url.searchParams.get('userId')
  const cookieId = req.cookies.get('userId')?.value
  return headerId || qpId || cookieId || null
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: '未提供用户ID' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const url = `${getBackendApiUrl()}/api/roles?companyId=${encodeURIComponent(companyId || '')}`

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
    })

    const data = await resp.json().catch(() => ({}))
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || '获取角色失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: '未提供用户ID' }, { status: 401 })
    }
    const body = await request.json()
    const resp = await fetch(`${getBackendApiUrl()}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(body),
    })
    const data = await resp.json().catch(() => ({}))
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || '创建角色失败' }, { status: 500 })
  }
}

