import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/config/api-config';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // 获取用户ID和请求数据
    const params = await context.params;
    const userId = params.userId;
    const data = await request.json();

    // 转发请求到后端API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(`${getBackendApiUrl()}/api/users/by-id/${userId}/updateInfo`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': getBackendApiUrl()
      },
      body: JSON.stringify(data),
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok) {
      console.error('Backend API error:', result);
      return NextResponse.json(
        { success: false, message: result.detail || result.message || '更新用户信息失败' },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    if (error.name === 'AbortError') {
      console.error('Update user info timeout:', message);
      return NextResponse.json(
        { success: false, message: '请求超时，请稍后重试' },
        { status: 504 }
      );
    }
    console.error('更新用户信息时出错:', error);
    return NextResponse.json(
      { success: false, message: '处理用户信息更新请求时出错' },
      { status: 500 }
    );
  }
}
