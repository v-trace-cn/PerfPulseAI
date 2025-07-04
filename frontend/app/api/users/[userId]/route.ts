import { NextResponse } from 'next/server';
import { backendUrl } from '../../../../lib/config/api-config';

export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const params = await context.params;
    const userId = params.userId;
    
    // Direct connection to the backend with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/api/users/${userId}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': backendUrl
      }
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

export async function PUT(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    const params = await context.params;
    const userId = params.userId;
    const body = await request.json();
    
    // Direct connection to the backend with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/api/users/${userId}`, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': backendUrl
      },
      body: JSON.stringify(body),
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    if (error.name === 'AbortError') {
      console.error('User update timeout:', message);
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 504 });
    }
    console.error('User update error:', message);
    return NextResponse.json(
      { error: '更新用户资料失败', details: message },
      { status: 500 }
    );
  }
}
