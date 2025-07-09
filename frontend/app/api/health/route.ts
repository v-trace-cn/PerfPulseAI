import { NextResponse } from 'next/server';
import { getBackendApiUrl, getFrontendOriginUrl } from '../../../lib/config/api-config';

export async function GET() {
  const testUrl = `${getBackendApiUrl()}/api/health`;

  try {
    // 测试性请求，添加详细日志
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': getBackendApiUrl()
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': getFrontendOriginUrl()
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '后端连接测试失败',
        diagnostic: {
          backendUrl: testUrl,
          error: (error as Error).message,
          suggestion: '请检查后端服务是否运行以及CORS配置'
        }
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': getFrontendOriginUrl()
        }
      }
    );
  }
}