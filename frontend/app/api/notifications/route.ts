import { NextRequest, NextResponse } from 'next/server'

// 模拟通知存储（在生产环境中应该使用数据库）
const notifications: any[] = []

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json()
    
    // 验证必需字段
    if (!notification.type || !notification.title || !notification.message || !notification.userId) {
      return NextResponse.json(
        { error: '缺少必需字段' },
        { status: 400 }
      )
    }

    // 创建通知记录
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
      category: getNotificationCategory(notification.type)
    }

    notifications.unshift(newNotification)

    // 模拟发送推送通知（在实际应用中这里会调用推送服务）
    console.log('发送通知:', newNotification)

    return NextResponse.json({
      success: true,
      notification: newNotification
    })

  } catch (error) {
    console.error('通知API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    let filteredNotifications = notifications

    // 按用户ID过滤
    if (userId) {
      filteredNotifications = filteredNotifications.filter(n => n.userId.toString() === userId)
    }

    // 按分类过滤
    if (category && category !== 'all') {
      filteredNotifications = filteredNotifications.filter(n => n.category === category)
    }

    // 限制数量
    filteredNotifications = filteredNotifications.slice(0, limit)

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      total: filteredNotifications.length
    })

  } catch (error) {
    console.error('获取通知API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 标记通知为已读
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()
    
    const notification = notifications.find(n => n.id === notificationId && n.userId === userId)
    
    if (!notification) {
      return NextResponse.json(
        { error: '通知不存在' },
        { status: 404 }
      )
    }

    notification.read = true

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('标记通知API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 获取通知分类
function getNotificationCategory(type: string): string {
  switch (type) {
    case 'redemption_success':
    case 'redemption_failed':
      return 'personal_business'
    case 'points_earned':
    case 'points_deducted':
      return 'personal_data'
    case 'system_announcement':
    case 'company_news':
      return 'announcement'
    default:
      return 'personal_business'
  }
}
