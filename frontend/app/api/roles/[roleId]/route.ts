import { NextRequest, NextResponse } from 'next/server'
import { getBackendApiUrl } from '@/lib/config/api-config'

function getUserId(req: NextRequest): string | null {
  const headerId = req.headers.get('X-User-Id')
  const url = new URL(req.url)
  const qpId = url.searchParams.get('userId')
  const cookieId = req.cookies.get('userId')?.value
  return headerId || qpId || cookieId || null
}

export async function PUT(request: NextRequest, context: { params: { roleId: string } }) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: '\u672a\u63d0\u4f9b\u7528\u6237ID' }, { status: 401 })
    }
    const { roleId } = context.params
    const body = await request.json()

    const resp = await fetch(`${getBackendApiUrl()}/api/roles/${encodeURIComponent(roleId)}`, {
      method: 'PUT',
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
    return NextResponse.json({ success: false, message: e?.message || '\u66f4\u65b0\u89d2\u8272\u5931\u8d25' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: { roleId: string } }) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, message: '\u672a\u63d0\u4f9b\u7528\u6237ID' }, { status: 401 })
    }
    const { roleId } = context.params

    const resp = await fetch(`${getBackendApiUrl()}/api/roles/${encodeURIComponent(roleId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
    })
    const data = await resp.json().catch(() => ({}))
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || '\u5220\u9664\u89d2\u8272\u5931\u8d25' }, { status: 500 })
  }
}

