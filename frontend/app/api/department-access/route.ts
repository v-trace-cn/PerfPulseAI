import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// 临时存储部门访问令牌（在生产环境中应该使用 Redis 或数据库）
const accessTokens = new Map<string, { departmentId: number; timestamp: number }>()

// 清理过期的令牌（30分钟过期）
const EXPIRY_TIME = 30 * 60 * 1000 // 30分钟

function cleanExpiredTokens() {
  const now = Date.now()
  for (const [token, data] of accessTokens.entries()) {
    if (now - data.timestamp > EXPIRY_TIME) {
      accessTokens.delete(token)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { departmentId } = await request.json()
    
    if (!departmentId || typeof departmentId !== 'number') {
      return NextResponse.json(
        { error: '无效的部门ID' },
        { status: 400 }
      )
    }

    // 清理过期令牌
    cleanExpiredTokens()

    // 生成访问令牌
    const accessToken = nanoid(32)
    accessTokens.set(accessToken, {
      departmentId,
      timestamp: Date.now()
    })

    return NextResponse.json({
      success: true,
      accessToken,
      redirectUrl: `/org/details/view?token=${accessToken}`
    })

  } catch (error) {
    console.error('部门访问API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少访问令牌',
          needsNewToken: true
        },
        { status: 400 }
      )
    }

    // 清理过期令牌
    cleanExpiredTokens()

    const tokenData = accessTokens.get(token)
    if (!tokenData) {
      return NextResponse.json(
        {
          success: false,
          error: '无效或过期的访问令牌',
          needsNewToken: true
        },
        { status: 401 }
      )
    }

    // 验证令牌是否过期
    if (Date.now() - tokenData.timestamp > EXPIRY_TIME) {
      accessTokens.delete(token)
      return NextResponse.json(
        {
          success: false,
          error: '访问令牌已过期',
          needsNewToken: true
        },
        { status: 401 }
      )
    }

    // 延长令牌有效期（刷新时间戳）
    tokenData.timestamp = Date.now()

    return NextResponse.json({
      success: true,
      departmentId: tokenData.departmentId
    })

  } catch (error) {
    console.error('令牌验证API错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误',
        needsNewToken: true
      },
      { status: 500 }
    )
  }
}
