# 通知与时区系统

## 概述

通知与时区系统是 PerfPulseAI 的核心功能模块，提供完整的通知创建、管理、查询、实时推送功能，以及统一的时间显示和时区转换。系统采用前后端分离架构，支持多种通知类型、实时SSE推送、高性能查询和时区自动转换。

**功能边界：**
- 通知创建/查询/实时推送（SSE）
- 统一时间显示与时区转换
- 高性能缓存机制

**时间戳约定：**
- 后端统一返回：UTC + 'Z' 后缀
- 前端统一展示：中国时区（UTC+8）
- 显示策略：相对时间优先，完整时间作为补充

## 架构与数据流

```
前端组件层 ← → 前端API路由 ← → 后端API ← → SSE
    ↓              ↓           ↓        ↓
通知中心组件    通知API路由   通知服务   数据库模型
通知详情页面    SSE端点      SSE管理    性能索引
时区处理工具    批量操作     缓存策略   权限控制
```

时间戳规范贯穿全链路：UTC+Z → 前端自动转换为中国时区

## 前端组件

### NotificationCenter (`components/notification-center.tsx`)

Header中的通知铃铛组件，显示未读通知数量和最近通知列表。

**主要功能：**
- 显示未读通知数量徽章
- 下拉显示最近通知列表
- 支持标记已读和删除操作
- 点击通知跳转到详情页面
- 实时SSE通知更新

**使用方式：**
```tsx
import NotificationCenter from '@/components/notification-center'

// 在Header中使用
<NotificationCenter />
```

### NotificationItem（时间展示范式）

通知项组件的标准时间显示模式：

```tsx
// 标准时间显示模式
function NotificationItem({ notification }) {
  const relativeTime = formatRelativeTime(notification.createdAt)
  const fullTime = getFullChinaTime(notification.createdAt)
  
  return (
    <div>
      <h3>{notification.title}</h3>
      <p>{notification.content}</p>
      {/* 相对时间作为主显示，完整时间作为title提示 */}
      <time title={fullTime}>{relativeTime}</time>
    </div>
  )
}
```

### 通知详情页面 (`app/notifications/page.tsx`)

完整的通知管理页面，支持分类、搜索、筛选等功能。

**主要功能：**
- 分类显示（全部、未读、公告、个人）
- 搜索和筛选功能
- 批量操作（标记已读、删除）
- 高亮显示指定通知
- 分页加载
- URL参数支持（高亮特定通知）

## 数据管理与实时

### useNotifications (`hooks/useNotifications.ts`)

统一的通知数据管理Hook，提供数据获取、状态管理和操作方法。

**主要功能：**
- 通知列表获取和缓存
- 标记已读/未读操作
- 删除通知操作
- SSE实时通知集成
- 错误处理和重试机制

**使用方式：**
```tsx
const {
  notifications,
  loading,
  error,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = useNotifications()
```

### useNotificationSSE (`hooks/useNotificationSSE.ts`)

提供SSE连接管理，实现通知的实时推送。

**主要功能：**
- 自动连接和重连
- 心跳保持连接
- 新通知实时推送
- Toast通知显示
- 连接状态监控

**使用方式：**
```tsx
useNotificationSSE({
  onNewNotification: (notification) => {
    // 处理新通知
  },
  onUnreadCountChange: (count) => {
    // 处理未读数量变化
  }
})
```

## 时间与时区处理

### 核心工具 (`lib/timezone-utils.ts`)

提供统一的时间格式化和时区转换功能，包含高性能缓存机制。

#### formatRelativeTime()
格式化相对时间显示（如"2分钟前"），带30秒缓存机制。

```tsx
import { formatRelativeTime } from '@/lib/timezone-utils'

const relativeTime = formatRelativeTime('2025-08-01T02:13:37Z')
// 输出: "2分钟前"
```

#### getFullChinaTime()
获取完整的中国时区时间字符串，带缓存机制。

```tsx
import { getFullChinaTime } from '@/lib/timezone-utils'

const fullTime = getFullChinaTime('2025-08-01T02:13:37Z')
// 输出: "2025/08/01 10:13:37"
```

#### 性能监控工具
```tsx
import { getCacheStats, clearCache } from '@/lib/timezone-utils'

// 获取缓存统计
const stats = getCacheStats()
console.log('缓存命中率:', stats.hitRate)

// 清空缓存
clearCache()
```

### 缓存机制

**缓存特性：**
- 缓存时长：30秒
- 最大条目：100个
- 自动清理过期条目
- 性能提升：3-10倍
- LRU策略：最近最少使用的条目优先清理

### 时间格式标准化

**统一时间格式：**
- 数据库存储：UTC时间
- API返回：UTC + 'Z'后缀
- SSE推送：UTC + 'Z'后缀
- 前端显示：自动转换为中国时区（UTC+8）

```python
# 后端模型序列化
"createdAt": self.created_at.isoformat() + 'Z' if self.created_at else None

# SSE广播
"createdAt": notification.created_at.isoformat() + 'Z' if notification.created_at else None
```

## API集成

### 主要端点

#### GET /api/notifications
获取通知列表，支持类型和状态筛选、分页查询

#### GET /api/notifications/summary
获取通知摘要（仅未读数量）
```python
@router.get("/notifications/summary")
async def get_notification_summary():
    """获取通知摘要（仅未读数量）"""
    unread_count = await notification_service.get_unread_count(current_user.id)
    return NotificationSummaryResponse(unreadCount=unread_count)
```

#### POST /api/notifications/mark-read
批量标记通知为已读

#### DELETE /api/notifications/{notification_id}
删除指定通知

#### GET /api/notifications/stream
SSE实时通知流
```python
@router.get("/notifications/stream")
async def stream_notifications():
    """SSE端点，用于实时推送通知"""
```

### 前端API路由 (`app/api/notifications/route.ts`)

前端API路由，代理后端通知接口。

**支持的操作：**
- 获取通知列表
- 标记已读
- 删除通知
- 获取未读数量

## SSE实时推送

### 消息格式

#### 连接确认
```json
{
    "type": "connected",
    "message": "SSE连接已建立",
    "timestamp": "2025-08-01T10:13:37Z"
}
```

#### 新通知推送
```json
{
    "type": "new_notification",
    "notification": {
        "id": "notification-uuid",
        "title": "通知标题",
        "content": "通知内容",
        "type": "REDEMPTION",
        "createdAt": "2025-08-01T02:13:37Z",
        "read": false
    }
}
```

#### 心跳消息
```json
{
    "type": "heartbeat",
    "timestamp": "2025-08-01T10:13:37Z"
}
```

### 连接管理特性
- 支持多客户端连接
- 自动心跳保持连接
- 连接异常自动清理
- 断线重连机制

## 性能优化

### 数据库优化
- 移除了性能瓶颈的 `get_total_count()` 方法
- 只保留高效的 `get_unread_count()` 查询
- 简化API响应结构

### 前端优化
- **时间格式化缓存**：避免重复的时间计算，减少DOM更新频率
- **通知总数移除**：移除性能瓶颈的总数查询，只保留必要的未读数量显示
- **SSE连接优化**：统一时间格式，自动重连机制，心跳保持连接稳定

### 缓存策略
- 30秒TTL缓存机制
- 最大100个缓存条目
- 自动清理过期缓存
- 3-10倍性能提升

## 使用示例

### 创建通知（后端）
```python
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType

notification_service = NotificationService(db)

# 创建兑换通知
await notification_service.create_notification(
    user_id=user.id,
    notification_type=NotificationType.REDEMPTION,
    title="兑换成功",
    content="恭喜您成功兑换商品",
    extra_data={
        "redeemCode": "ABC123",
        "item": "商品名称",
        "points": 50
    }
)
```

### 前端组件使用
```tsx
// 通知中心组件
import NotificationCenter from '@/components/notification-center'

function Header() {
  return (
    <header>
      <NotificationCenter />
    </header>
  )
}

// 通知数据管理
function NotificationPage() {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification
  } = useNotifications()

  return (
    <div>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
        />
      ))}
    </div>
  )
}
```

## 最佳实践

### 时间显示
- 统一使用 `formatRelativeTime()` 显示相对时间
- 使用 `getFullChinaTime()` 显示完整时间
- 避免直接操作Date对象
- 确保时间戳包含'Z'后缀

### 通知操作
- 使用 `useNotifications` Hook管理状态
- 批量操作提升性能
- 及时清理不需要的通知
- 合理使用缓存机制

### 性能监控
- 定期检查缓存命中率
- 监控SSE连接状态
- 关注页面渲染性能
- 监控数据库查询性能

### 安全考虑
- 用户只能访问自己的通知
- API接口需要身份验证
- SSE连接需要用户验证
- 敏感信息不在通知中明文显示

## 故障排除

### 时间显示不一致
1. 检查时间戳格式是否包含'Z'后缀
2. 验证SSE推送的时间格式
3. 清空缓存重新测试
4. 检查时区转换逻辑

### 通知不实时更新
1. 检查SSE连接状态
2. 验证后端广播逻辑
3. 检查网络连接
4. 验证用户权限

### 性能问题
1. 查看缓存统计信息
2. 检查是否有内存泄漏
3. 优化通知列表渲染
4. 检查数据库索引效果

### SSE连接问题
1. 检查连接状态
2. 验证心跳机制
3. 检查重连逻辑
4. 监控连接数量

## 扩展性考虑

### 水平扩展
- 支持多实例部署
- SSE连接可分布式管理
- 数据库读写分离
- 缓存集群支持

### 功能扩展
- 支持新的通知类型
- 可配置的通知规则
- 批量通知发送
- 通知模板系统

### 监控和维护
- 性能监控指标
- 数据清理策略
- 错误日志记录
- 用户行为分析

## 迁移说明

本文档合并自：
- 原 `NOTIFICATION_SYSTEM.md`
- 原 `TIMEZONE_HANDLING.md`

若存在外部链接，请更新到本页相应章节。
