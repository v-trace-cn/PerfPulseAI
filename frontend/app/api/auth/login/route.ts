import { NextResponse } from 'next/server';
import { backendUrl } from '../../../../lib/config/api-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Forward the request to the backend auth 登录接口
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': backendUrl
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend login error response:', errorData);
      // 优先使用后端提供的 detail 或 message，然后回退到中文通用提示
      const errorMsg = errorData.detail || errorData.message || `后端错误: ${response.status}`;
      return NextResponse.json(
        {
          success: false,
          message: errorMsg,
          error: errorMsg
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process login request',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
