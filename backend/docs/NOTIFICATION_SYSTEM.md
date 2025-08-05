# 通知系统后端文档

## 概述

通知系统后端提供通知的创建、管理、查询和实时推送功能，支持多种通知类型和高性能查询。

## 核心模块

### 1. 数据模型 (`app/models/notification.py`)

#### 通知类型枚举
```python
class NotificationType(PyEnum):
    ANNOUNCEMENT = "ANNOUNCEMENT"      # 公告通知
    PERSONAL_DATA = "PERSONAL_DATA"    # 个人数据通知
    PERSONAL_BUSINESS = "PERSONAL_BUSINESS"  # 个人业务通知
    REDEMPTION = "REDEMPTION"          # 兑换通知
    POINTS = "POINTS"                  # 积分通知
    SYSTEM = "SYSTEM"                  # 系统通知
```

#### 通知状态枚举
```python
class NotificationStatus(PyEnum):
    UNREAD = "UNREAD"      # 未读
    READ = "READ"          # 已读
    ARCHIVED = "ARCHIVED"  # 已归档
```

#### 通知模型
```python
class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    read_at = Column(DateTime, nullable=True)
```

### 2. 服务层 (`app/services/notification_service.py`)

#### NotificationService类

**主要方法：**

##### create_notification()
创建新通知并触发SSE广播
```python
async def create_notification(
    self,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    content: str,
    extra_data: Optional[Dict[str, Any]] = None
) -> Notification
```

##### get_user_notifications()
获取用户通知列表，支持分页和筛选
```python
async def get_user_notifications(
    self,
    user_id: int,
    notification_type: Optional[NotificationType] = None,
    status: Optional[NotificationStatus] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Notification]
```

##### get_unread_count()
高效获取用户未读通知数量
```python
async def get_unread_count(self, user_id: int) -> int
```

##### mark_as_read()
标记通知为已读
```python
async def mark_as_read(self, notification_id: str, user_id: int) -> bool
```

### 3. API接口 (`app/api/notifications.py`)

#### 主要端点

##### GET /api/notifications
获取通知列表
- 支持类型和状态筛选
- 分页查询
- 返回标准化的通知数据

##### GET /api/notifications/summary
获取通知摘要（仅未读数量）
```python
@router.get("/notifications/summary")
async def get_notification_summary():
    """获取通知摘要（仅未读数量）"""
    unread_count = await notification_service.get_unread_count(current_user.id)
    return NotificationSummaryResponse(unreadCount=unread_count)
```

##### POST /api/notifications/mark-read
批量标记通知为已读
```python
@router.post("/notifications/mark-read")
async def mark_notifications_as_read(request: MarkAsReadRequest):
    """批量标记通知为已读"""
```

##### DELETE /api/notifications/{notification_id}
删除指定通知
```python
@router.delete("/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    """删除通知"""
```

##### GET /api/notifications/stream
SSE实时通知流
```python
@router.get("/notifications/stream")
async def stream_notifications():
    """SSE端点，用于实时推送通知"""
```

## SSE实时推送

### 连接管理
- 支持多客户端连接
- 自动心跳保持连接
- 连接异常自动清理

### 消息格式
```python
# 连接确认
{
    "type": "connected",
    "message": "SSE连接已建立",
    "timestamp": "2025-08-01T10:13:37Z"
}

# 新通知推送
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

# 心跳消息
{
    "type": "heartbeat",
    "timestamp": "2025-08-01T10:13:37Z"
}
```

## 性能优化

### 1. 数据库索引优化

已添加的性能索引：
```sql
-- 用户通知查询索引
CREATE INDEX idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- 未读通知统计索引
CREATE INDEX idx_notifications_user_status 
ON notifications(user_id, status);

-- 通知类型查询索引
CREATE INDEX idx_notifications_user_type_created 
ON notifications(user_id, type, created_at DESC);

-- 复合查询索引
CREATE INDEX idx_notifications_user_status_type_created 
ON notifications(user_id, status, type, created_at DESC);
```

### 2. 查询优化

#### 移除总数查询
- 移除了性能瓶颈的 `get_total_count()` 方法
- 只保留高效的 `get_unread_count()` 查询
- 简化API响应结构

#### 高效的COUNT查询
```python
async def get_unread_count(self, user_id: int) -> int:
    """获取用户未读通知数量"""
    query = select(func.count(Notification.id)).where(
        and_(
            Notification.user_id == user_id,
            Notification.status == NotificationStatus.UNREAD
        )
    )
    result = await self.db.execute(query)
    return result.scalar() or 0
```

### 3. 时间格式标准化

#### 统一时间格式
- 数据库存储：UTC时间
- API返回：UTC + 'Z'后缀
- SSE推送：UTC + 'Z'后缀

```python
# 模型序列化
"createdAt": self.created_at.isoformat() + 'Z' if self.created_at else None

# SSE广播
"createdAt": notification.created_at.isoformat() + 'Z' if notification.created_at else None
```

## 数据库迁移

### 性能索引迁移
```python
# alembic/versions/add_notification_performance_indexes.py
def upgrade():
    """添加通知系统性能优化索引"""
    op.create_index(
        'idx_notifications_user_created',
        'notifications',
        ['user_id', sa.text('created_at DESC')]
    )
    # ... 其他索引
```

## 使用示例

### 创建通知
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

### 查询通知
```python
# 获取用户未读通知
notifications = await notification_service.get_user_notifications(
    user_id=user.id,
    status=NotificationStatus.UNREAD,
    limit=20
)

# 获取未读数量
unread_count = await notification_service.get_unread_count(user.id)
```

## 监控和维护

### 性能监控
- 监控数据库查询性能
- 跟踪SSE连接数量
- 监控通知创建频率

### 数据清理
- 定期清理过期通知
- 监控数据库大小
- 优化索引使用

### 故障排除
- 检查SSE连接状态
- 验证数据库索引效果
- 监控API响应时间

## 安全考虑

### 权限验证
- 用户只能访问自己的通知
- API接口需要身份验证
- SSE连接需要用户验证

### 数据保护
- 敏感信息不在通知中明文显示
- 兑换码等信息通过extra_data安全传输
- 定期清理过期数据

## 扩展性

### 水平扩展
- 支持多实例部署
- SSE连接可分布式管理
- 数据库读写分离

### 功能扩展
- 支持新的通知类型
- 可配置的通知规则
- 批量通知发送
