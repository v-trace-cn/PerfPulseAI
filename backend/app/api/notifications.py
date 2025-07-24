"""
通知API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.notification_service import NotificationService
from app.models.notification import NotificationType, NotificationStatus
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter()


# Pydantic 模型
class NotificationResponse(BaseModel):
    id: str
    userId: int
    type: str
    title: str
    content: str
    status: str
    extraData: Optional[dict] = None
    createdAt: str
    readAt: Optional[str] = None
    isUnread: bool
    isRead: bool
    isArchived: bool


class NotificationSummaryResponse(BaseModel):
    unreadCount: int
    totalCount: int


class MarkAsReadRequest(BaseModel):
    notification_ids: List[str] = Field(..., description="通知ID列表")


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    type: Optional[str] = Query(None, description="通知类型过滤"),
    status: Optional[str] = Query(None, description="通知状态过滤"),
    limit: int = Query(50, ge=1, le=100, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取用户通知列表"""
    notification_service = NotificationService(db)
    
    # 转换类型参数
    notification_type = None
    if type:
        try:
            notification_type = NotificationType(type.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的通知类型")
    
    notification_status = None
    if status:
        try:
            notification_status = NotificationStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的通知状态")
    
    notifications = await notification_service.get_user_notifications(
        user_id=current_user.id,
        notification_type=notification_type,
        status=notification_status,
        limit=limit,
        offset=offset
    )
    
    return [
        NotificationResponse(
            id=notification.id,
            userId=notification.user_id,
            type=notification.type.value,
            title=notification.title,
            content=notification.content,
            status=notification.status.value,
            extraData=notification.extra_data,
            createdAt=notification.created_at.isoformat() if notification.created_at else "",
            readAt=notification.read_at.isoformat() if notification.read_at else None,
            isUnread=notification.status == NotificationStatus.UNREAD,
            isRead=notification.status == NotificationStatus.READ,
            isArchived=notification.status == NotificationStatus.ARCHIVED
        )
        for notification in notifications
    ]


@router.get("/notifications/summary", response_model=NotificationSummaryResponse)
async def get_notification_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取通知摘要"""
    notification_service = NotificationService(db)
    
    unread_count = await notification_service.get_unread_count(current_user.id)
    
    # 获取总数（这里简化处理，实际可能需要更复杂的查询）
    all_notifications = await notification_service.get_user_notifications(
        user_id=current_user.id,
        limit=1000  # 临时方案，实际应该用count查询
    )
    total_count = len(all_notifications)
    
    return NotificationSummaryResponse(
        unreadCount=unread_count,
        totalCount=total_count
    )


@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记单个通知为已读"""
    notification_service = NotificationService(db)
    
    success = await notification_service.mark_as_read(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="通知不存在")
    
    return {"message": "通知已标记为已读"}


@router.post("/notifications/read-all")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记所有通知为已读"""
    notification_service = NotificationService(db)
    
    count = await notification_service.mark_all_as_read(current_user.id)
    
    return {"message": f"已标记 {count} 条通知为已读"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除通知"""
    notification_service = NotificationService(db)
    
    success = await notification_service.delete_notification(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="通知不存在")
    
    return {"message": "通知已删除"}
