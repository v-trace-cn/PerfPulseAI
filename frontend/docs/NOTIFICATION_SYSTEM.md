# 通知系统文档

## 概述

通知系统提供实时通知功能，包括通知中心、SSE实时推送和时间显示优化。

## 核心组件

### 1. 通知中心组件 (`components/notification-center.tsx`)

Header中的通知铃铛组件，显示未读通知数量和最近通知列表。

**主要功能：**
- 显示未读通知数量徽章
- 下拉显示最近通知列表
- 支持标记已读和删除操作
- 点击通知跳转到详情页面

**使用方式：**
```typescript
import NotificationCenter from '@/components/notification-center'

// 在Header中使用
<NotificationCenter />
```

### 2. 通知详情页面 (`app/notifications/page.tsx`)

完整的通知管理页面，支持分类、搜索、筛选等功能。

**主要功能：**
- 分类显示（全部、未读、公告、个人）
- 搜索和筛选功能
- 批量操作（标记已读、删除）
- 高亮显示指定通知
- 分页加载

### 3. 通知数据管理 (`hooks/useNotifications.ts`)

统一的通知数据管理Hook，提供数据获取、状态管理和操作方法。

**主要功能：**
- 通知列表获取和缓存
- 标记已读/未读操作
- 删除通知操作
- SSE实时通知集成

**使用方式：**
```typescript
const {
  notifications,
  loading,
  error,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = useNotifications()
```

## 时间显示优化

### 时区处理 (`lib/timezone-utils.ts`)

提供统一的时间格式化和时区转换功能，包含性能优化的缓存机制。

**核心函数：**

#### formatRelativeTime()
格式化相对时间显示（如"2分钟前"），带30秒缓存机制。

```typescript
import { formatRelativeTime } from '@/lib/timezone-utils'

const relativeTime = formatRelativeTime('2025-08-01T02:13:37Z')
// 输出: "2分钟前"
```

#### getFullChinaTime()
获取完整的中国时区时间字符串，带缓存机制。

```typescript
import { getFullChinaTime } from '@/lib/timezone-utils'

const fullTime = getFullChinaTime('2025-08-01T02:13:37Z')
// 输出: "2025/08/01 10:13:37"
```

### 性能优化特性

**缓存机制：**
- 缓存时长：30秒
- 最大条目：100个
- 自动清理过期条目
- 性能提升：3-10倍

**监控工具：**
```typescript
import { getCacheStats, clearCache } from '@/lib/timezone-utils'

// 获取缓存统计
const stats = getCacheStats()
console.log('缓存命中率:', stats.hitRate)

// 清空缓存
clearCache()
```

## SSE实时通知

### 实时连接 (`hooks/useNotificationSSE.ts`)

提供SSE连接管理，实现通知的实时推送。

**主要功能：**
- 自动连接和重连
- 心跳保持连接
- 新通知实时推送
- Toast通知显示

**使用方式：**
```typescript
useNotificationSSE({
  onNewNotification: (notification) => {
    // 处理新通知
  },
  onUnreadCountChange: (count) => {
    // 处理未读数量变化
  }
})
```

## API集成

### 通知API (`app/api/notifications/route.ts`)

前端API路由，代理后端通知接口。

**支持的操作：**
- 获取通知列表
- 标记已读
- 删除通知
- 获取未读数量

## 性能优化总结

### 1. 时间格式化缓存
- 避免重复的时间计算
- 减少DOM更新频率
- 提升大量通知的渲染性能

### 2. 通知总数移除
- 移除性能瓶颈的总数查询
- 只保留必要的未读数量显示
- 简化UI，提升用户体验

### 3. SSE连接优化
- 统一时间格式，确保一致性
- 自动重连机制
- 心跳保持连接稳定

## 最佳实践

### 1. 时间显示
- 统一使用 `formatRelativeTime()` 显示相对时间
- 使用 `getFullChinaTime()` 显示完整时间
- 避免直接操作Date对象

### 2. 通知操作
- 使用 `useNotifications` Hook管理状态
- 批量操作提升性能
- 及时清理不需要的通知

### 3. 性能监控
- 定期检查缓存命中率
- 监控SSE连接状态
- 关注页面渲染性能

## 故障排除

### 时间显示不一致
1. 检查时间戳格式是否包含'Z'后缀
2. 验证SSE推送的时间格式
3. 清空缓存重新测试

### 通知不实时更新
1. 检查SSE连接状态
2. 验证后端广播逻辑
3. 检查网络连接

### 性能问题
1. 查看缓存统计信息
2. 检查是否有内存泄漏
3. 优化通知列表渲染
