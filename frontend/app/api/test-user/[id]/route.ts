import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  
  return NextResponse.json({ 
    message: 'Test route working',
    userId: id,
    timestamp: new Date().toISOString(),
    url: request.url
  });
}
