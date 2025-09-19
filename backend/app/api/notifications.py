"""通知API."""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.notification import (
    NotificationCategory,
    NotificationStatus,
)
from app.models.user import User
from app.services.notification_service import NotificationService
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api", tags=["notifications"])


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


class MarkAsReadRequest(BaseModel):
    notification_ids: list[str] = Field(..., description="通知ID列表")


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    type: Optional[str] = Query(None, description="通知类型过滤"),
    status: Optional[str] = Query(None, description="通知状态过滤"),
    limit: int = Query(50, ge=1, le=100, description="每页数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取用户通知列表."""
    notification_service = NotificationService(db)

    # 转换类型参数
    notification_category = None
    if type:
        try:
            notification_category = NotificationCategory(type.upper())
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
        category=notification_category,
        status=notification_status,
        limit=limit,
        offset=offset
    )

    return [
        NotificationResponse(
            id=notification.id,
            userId=notification.user_id,
            type=notification.category.value,  # 使用新的 category 字段
            title=notification.title,
            content=notification.summary or "",  # 使用 summary 作为 content
            status=notification.status.value,
            extraData=notification.payload,  # 使用新的 payload 字段
            createdAt=notification.created_at.isoformat() + 'Z' if notification.created_at else "",
            readAt=notification.read_at.isoformat() + 'Z' if notification.read_at else None,
            isUnread=notification.status == NotificationStatus.PENDING,  # 使用新的状态
            isRead=notification.status == NotificationStatus.READ,
            isArchived=notification.status == NotificationStatus.DISMISSED
        )
        for notification in notifications
    ]


@router.get("/notifications/summary", response_model=NotificationSummaryResponse)
async def get_notification_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取通知摘要（仅未读数量）."""
    notification_service = NotificationService(db)

    # 只查询未读数量，提升性能
    unread_count = await notification_service.get_unread_count(current_user.id)

    return NotificationSummaryResponse(
        unreadCount=unread_count
    )


@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """标记单个通知为已读."""
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
    """标记所有通知为已读."""
    notification_service = NotificationService(db)

    count = await notification_service.mark_all_as_read(current_user.id)

    return {"message": f"已标记 {count} 条通知为已读"}


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除通知."""
    notification_service = NotificationService(db)

    success = await notification_service.delete_notification(notification_id, current_user.id)

    if not success:
        raise HTTPException(status_code=404, detail="通知不存在")

    return {"message": "通知已删除"}


# SSE 连接管理
notification_connections = {}  # {user_id: [queue1, queue2, ...]}
logger = logging.getLogger(__name__)


async def notification_event_generator(user_id: int):
    """为特定用户生成 SSE 事件流."""
    queue = asyncio.Queue()

    # 将连接添加到管理器
    if user_id not in notification_connections:
        notification_connections[user_id] = []
    notification_connections[user_id].append(queue)

    try:
        # 发送初始连接确认
        initial_message = {
            'type': 'connected',
            'message': 'SSE连接已建立',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        yield f"data: {json.dumps(initial_message, ensure_ascii=False)}\n\n"

        # 持续监听队列中的新通知
        while True:
            try:
                # 等待新通知，设置超时以发送心跳
                notification_data = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(notification_data, ensure_ascii=False)}\n\n"
            except asyncio.TimeoutError:
                # 发送心跳保持连接
                heartbeat_message = {
                    'type': 'heartbeat',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                yield f"data: {json.dumps(heartbeat_message, ensure_ascii=False)}\n\n"
            except Exception as e:
                logger.error(f"SSE 事件生成错误: {e}")
                break

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"SSE 连接错误: {e}")
    finally:
        # 清理连接
        if user_id in notification_connections:
            try:
                notification_connections[user_id].remove(queue)
                if not notification_connections[user_id]:
                    del notification_connections[user_id]
            except ValueError:
                pass


def broadcast_notification_to_user(user_id: int, notification_data: dict):
    """向特定用户的所有 SSE 连接广播通知."""
    if user_id in notification_connections:
        for queue in notification_connections[user_id]:
            try:
                # 使用 put_nowait 避免阻塞
                queue.put_nowait(notification_data)
            except asyncio.QueueFull:
                logger.warning(f"用户 {user_id} 的通知队列已满")
            except Exception as e:
                logger.error(f"向用户 {user_id} 广播通知失败: {e}")


async def get_current_user_for_sse(
    request: Request,
    user_id: Optional[str] = Query(None, alias="user_id"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """用于 SSE 的用户认证."""
    # 从查询参数获取用户ID
    if user_id:
        try:
            user_id_int = int(user_id)
        except ValueError:
            raise HTTPException(status_code=401, detail="无效的用户ID")
    else:
        # 尝试从请求头获取用户ID
        user_id_header = request.headers.get("X-User-Id")
        if user_id_header:
            try:
                user_id_int = int(user_id_header)
            except ValueError:
                raise HTTPException(status_code=401, detail="无效的用户ID")
        else:
            raise HTTPException(status_code=401, detail="用户ID未提供")

    # 验证用户是否存在
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id_int))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    return user


@router.get("/notifications/stream")
async def stream_notifications(
    current_user: User = Depends(get_current_user_for_sse)
):
    """SSE 端点，用于实时推送通知."""
    return StreamingResponse(
        notification_event_generator(current_user.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control, X-User-Id",
            "Access-Control-Allow-Methods": "GET",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8"
        }
    )



