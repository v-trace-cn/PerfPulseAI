import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Login request received:', body);
    
    // Forward the request to the backend auth 登录接口
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify(body),
    });

    console.log('Backend login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend login error response:', errorData);
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
    console.log('Backend login data:', data);
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
