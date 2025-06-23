import { NextResponse } from 'next/server';
import { backendUrl } from '../../../../lib/config/api-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Direct connection to the backend with proper timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
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
    // The backend returns: { data: { email, name, userId }, message: '注册成功', success: true }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process registration request',
        error: String(error)
      },
      { status: 500 }
    );
  }
}
