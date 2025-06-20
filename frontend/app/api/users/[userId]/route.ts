import { NextResponse } from 'next/server';
import { backendUrl } from '../../../../lib/config/server-api-config';

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
        'Origin': 'http://192.168.0.29:3000'
      }
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json(
      { error: '获取用户资料失败', details: String(error) },
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
        'Origin': 'http://192.168.0.29:3000'
      },
      body: JSON.stringify(body),
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: '更新用户资料失败', details: String(error) },
      { status: 500 }
    );
  }
}
