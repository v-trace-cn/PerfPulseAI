# backend/app/api/activity.py
"""活动管理 API 模块包."""
import asyncio
import uuid
from typing import Optional

from app.api.auth import get_current_user
from app.core.base_api import BaseAPIRouter, PaginationParams
from app.core.database import get_db
from app.core.decorators import handle_api_errors, require_authenticated
from app.core.logging_config import logger
from app.core.permissions import simple_user_required
from app.core.scheduler import process_pending_tasks
from app.models.activity import Activity
from app.models.user import User
from app.services.activity_service import ActivityService
from fastapi import (
    BackgroundTasks,
    Depends,
    HTTPException,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession


# Pydantic schemas
class ActivityCreate(BaseModel):
    """创建活动的model."""

    title: str
    description: Optional[str] = None
    points: int = 0
    user_id: str

class ActivityUpdate(BaseModel):
    """更新活动的model."""

    title: Optional[str] = None
    description: Optional[str] = None
    points: Optional[int] = None
    status: Optional[str] = None

class ActivityQuery(PaginationParams):
    """查询活动的model."""

    search: Optional[str] = ""
    user_id: Optional[str] = None

# Initialize router using base class
base_router = BaseAPIRouter(prefix="/api/activities", tags=["activity"])
router = base_router.router

@router.get("/")
@handle_api_errors
async def get_activities(
    query: ActivityQuery = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """获取活动列表."""
    from sqlalchemy import desc, select

    # 构建查询
    query_stmt = select(Activity)

    if query.user_id:
        query_stmt = query_stmt.filter(Activity.user_id == query.user_id)

    if query.search:
        search_filter = Activity.title.contains(query.search) | Activity.description.contains(query.search)
        query_stmt = query_stmt.filter(search_filter)

    query_stmt = query_stmt.order_by(desc(Activity.created_at))

    # 执行查询
    result = await db.execute(query_stmt)
    activities = result.scalars().all()

    return base_router.success_response(
        data=[a.to_dict() for a in activities],
        message="查询成功"
    )

@router.get("/recent")
@handle_api_errors
async def get_recent_activities(
    query: ActivityQuery = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """获取最近的活动."""
    from sqlalchemy import desc, func, select
    from sqlalchemy.orm import selectinload

    # 获取分页参数
    page = getattr(query, 'page', 1)
    per_page = getattr(query, 'per_page', 10)
    offset = (page - 1) * per_page

    # 构建查询，预加载用户关系
    query_stmt = select(Activity).options(selectinload(Activity.user)).order_by(desc(Activity.created_at))

    if query.user_id:
        query_stmt = query_stmt.filter(Activity.user_id == query.user_id)

    # 获取总数
    count_stmt = select(func.count(Activity.id))
    if query.user_id:
        count_stmt = count_stmt.filter(Activity.user_id == query.user_id)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # 执行分页查询
    paginated_query = query_stmt.offset(offset).limit(per_page)
    result = await db.execute(paginated_query)
    activities = result.scalars().all()

    return base_router.success_response(
        data={
            "activities": [a.to_dict() for a in activities],
            "total": total,
            "page": page,
            "per_page": per_page
        },
        message="查询成功"
    )

@router.post("/")
@handle_api_errors
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建新活动."""
    service = ActivityService(db)

    activity = await service.create_activity(
        title=data.title,
        description=data.description,
        points=data.points,
        user_id=data.user_id,
        show_id=str(uuid.uuid4())
    )

    return base_router.success_response(
        data=activity.to_dict(),
        message="创建成功"
    )

@router.get("/{activity_id}")
@handle_api_errors
async def get_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db)
):
    """根据ID获取活动详情."""
    service = ActivityService(db)

    activity = await service.get_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="找不到活动")

    return base_router.success_response(
        data=activity.to_dict(),
        message="查询成功"
    )

@router.get("/show/{show_id}")
@handle_api_errors
async def get_activity_by_show_id(
    show_id: str,
    db: AsyncSession = Depends(get_db)
):
    """根据show_id获取活动详情."""
    service = ActivityService(db)

    activity = await service.get_by_show_id(show_id)
    if not activity:
        raise HTTPException(status_code=404, detail="找不到活动")

    return base_router.success_response(
        data=activity.to_dict(),
        message="查询成功"
    )

@router.put("/{activity_id}")
@handle_api_errors
async def update_activity(
    activity_id: str,
    data: ActivityUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新活动信息."""
    service = ActivityService(db)

    activity = await service.update_activity(
        activity_id,
        data.dict(exclude_unset=True)
    )

    if not activity:
        raise HTTPException(status_code=404, detail="找不到活动")

    # 如果状态更新为completed，触发后台任务
    if data.status == "completed":
        asyncio.create_task(process_pending_tasks())

    return base_router.success_response(
        data=activity.to_dict(),
        message="更新成功"
    )

@router.delete("/{activity_id}")
@handle_api_errors
@require_authenticated
async def delete_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除活动."""
    service = ActivityService(db)

    success = await service.delete(activity_id)
    if not success:
        raise HTTPException(status_code=404, detail="找不到活动")

    return base_router.success_response(message="删除成功")

@router.post("/{activity_id}/reset-points")
@handle_api_errors
async def reset_activity_points(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """重置活动的积分，并同步回退用户积分."""
    service = ActivityService(db)

    try:
        result = await service.reset_activity_points(activity_id)
        return base_router.success_response(
            data=result,
            message="重置成功，积分已回退，可重新计算"
        )
    except ValueError as e:
        # 活动未找到
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error resetting activity points for {activity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"重置积分时发生内部错误: {e}")


@router.post("/{activity_id}/award-points")
@handle_api_errors
async def award_activity_points(
    activity_id: str,
    points: int,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """为活动授予积分."""
    service = ActivityService(db)

    try:
        result = await service.award_activity_points(
            activity_id=activity_id,
            points=points,
            description=description
        )
        return base_router.success_response(
            data=result,
            message=f"成功授予 {points} 积分"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error awarding points for activity {activity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"授予积分时发生内部错误: {e}")


@router.get("/{activity_id}/points-status")
@handle_api_errors
async def get_activity_points_status(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取活动的积分状态."""
    service = ActivityService(db)

    try:
        result = await service.get_activity_points_status(activity_id)
        return base_router.success_response(
            data=result,
            message="获取积分状态成功"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting points status for activity {activity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"获取积分状态时发生内部错误: {e}")
