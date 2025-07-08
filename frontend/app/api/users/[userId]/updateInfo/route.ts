import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '../../../../lib/config/api-config';

// 使用全局变量存储用户数据（在实际应用中应该使用数据库）
const userDataStore = new Map();

export async function POST(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // 获取用户ID和请求数据
    const params = await context.params;
    const userId = params.userId;
    const data = await request.json();
    
    // 更新用户数据
    const currentData = userDataStore.get(userId) || {};
    const updatedData = {
      ...currentData,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    userDataStore.set(userId, updatedData);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedData
    });
  } catch (error) {
    console.error('更新用户信息时出错:', error);
    return NextResponse.json(
      { success: false, message: '处理用户信息更新请求时出错' },
      { status: 500 }
    );
  }
}
