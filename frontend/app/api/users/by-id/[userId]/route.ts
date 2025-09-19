import { NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/config/api-config';

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = params;

    // 获取认证信息（可选）
    const requestUrl = new URL(request.url);
    const authUserId = request.headers.get('X-User-Id') || 
                      requestUrl.searchParams.get('authUserId') ||
                      null;

    // Direct connection to the backend with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': getBackendApiUrl()
    };

    // 如果有认证信息，则传递给后端
    if (authUserId) {
      headers['X-User-Id'] = authUserId;
    }

    const response = await fetch(`${getBackendApiUrl()}/api/users/by-id/${userId}`, {
      method: 'GET',
      signal: controller.signal,
      headers
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    if (error.name === 'AbortError') {
      console.error('User profile timeout:', message);
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
    }
    console.error('User profile error:', message);
    return NextResponse.json(
      { error: '获取用户资料失败', details: message },
      { status: 500 }
    );
  }
}
