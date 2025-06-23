import { NextResponse } from 'next/server';
import { backendUrl } from '../../../../lib/config/api-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Reset password request received in Next.js API route:', body);
    console.log('Backend URL for reset password:', backendUrl);
    
    const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
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
  } catch (error) {
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