import { NextResponse } from 'next/server';
import { getBackendApiUrl } from '../../../../lib/config/api-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${getBackendApiUrl()}/api/auth/reset-password`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': getBackendApiUrl()
      },
      body: JSON.stringify(body),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || `Backend error: ${response.status}`,
          error: errorData.message || `Backend error: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Reset password timeout:', error);
      return NextResponse.json({ success: false, message: '请求超时，请稍后重试' }, { status: 504 });
    }
    console.error('Reset password error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process reset password request',
        error: String(error)
      },
      { status: 500 }
    );
  }
} 