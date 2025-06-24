# backend/app/api/activity.py

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
import asyncio

from app.core.database import get_db
from app.models.activity import Activity
from app.core.scheduler import process_pending_tasks
from app.models.pull_request_result import PullRequestResult

router = APIRouter(prefix="/api/activities", tags=["activity"])

@router.get("/")
async def get_activities(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: Session = Depends(get_db),
):
    stmt = select(Activity).options(joinedload(Activity.pull_request_result), joinedload(Activity.user))
    if search:
        pattern = f"%{search}%"
        stmt = stmt.filter(
            Activity.title.ilike(pattern) |
            Activity.description.ilike(pattern)
        )
    total_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = total_result.scalar_one()
    items_result = (
        await db.execute(stmt.order_by(Activity.created_at.desc())
             .offset((page - 1) * per_page)
             .limit(per_page))
    )
    items = items_result.scalars().all()
    return {
        "data": {
            "activities": [a.to_dict() for a in items],
            "total": total,
            "page": page,
            "per_page": per_page,
        },
        "message": "查询成功",
        "success": True,
    }

@router.get("/recent")
async def get_recent_activities(user_id: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Activity).options(joinedload(Activity.user), joinedload(Activity.pull_request_result))
    if user_id:
        stmt = stmt.filter(Activity.user_id == user_id)
    recent_result = (
        await db.execute(stmt.order_by(Activity.created_at.desc())
          .limit(5))
    )
    recent = recent_result.scalars().all()
    return {
        "data": [a.to_dict() for a in recent],
        "message": "查询成功",
        "success": True,
    }

@router.post("/")
async def create_activity(
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    activity_uuid = str(uuid.uuid4())
    new_act = Activity(
        title=data.get("title"),
        description=data.get("description"),
        points=int(data.get("points", 0)),
        user_id=data.get("user_id"),
        status="pending",
        created_at=datetime.utcnow(),
        completed_at=None,
    )
    new_act.show_id = activity_uuid
    db.add(new_act)
    await db.commit()
    await db.refresh(new_act)

    # Fetch the newly created activity with eager loaded relationships
    result = await db.execute(select(Activity).options(joinedload(Activity.user), joinedload(Activity.pull_request_result)).filter(Activity.id == new_act.id))
    loaded_act = result.scalars().first()

    if not loaded_act:
        raise HTTPException(status_code=500, detail="无法加载新创建的活动")

    return {
        "data": loaded_act.to_dict(),
        "message": "创建成功",
        "success": True,
    }

@router.get("/{activity_id}")
async def get_activity(activity_id: str, db: Session = Depends(get_db)):
    result = await db.execute(select(Activity).options(joinedload(Activity.pull_request_result), joinedload(Activity.user)).filter(Activity.id == activity_id))
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    return {
        "data": act.to_dict(),
        "message": "查询成功",
        "success": True,
    }

@router.get("/show/{show_id}")
async def get_activity_by_show_id(show_id: str, db: Session = Depends(get_db)):
    result = await db.execute(select(Activity).options(joinedload(Activity.pull_request_result), joinedload(Activity.user)).filter(Activity.show_id == show_id))
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    return {
        "data": act.to_dict(),
        "message": "查询成功",
        "success": True,
    }

@router.put("/{activity_id}")
async def update_activity(
    activity_id: str,
    background_tasks: BackgroundTasks,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    result = await db.execute(select(Activity).options(joinedload(Activity.pull_request_result), joinedload(Activity.user)).filter(Activity.id == activity_id))
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    if "title" in data:
        act.title = data["title"]
    if "description" in data:
        act.description = data["description"]
    if "points" in data:
        act.points = int(data["points"])
    if data.get("status"):
        act.status = data["status"]
        if data["status"] == "completed" and not act.completed_at:
            act.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(act)
    # 触发即时处理所有 pending 任务
    asyncio.create_task(process_pending_tasks())
    return {
        "data": act.to_dict(),
        "message": "更新成功",
        "success": True,
    }

@router.delete("/{activity_id}")
async def delete_activity(activity_id: str, db: Session = Depends(get_db)):
    result = await db.execute(select(Activity).options(joinedload(Activity.pull_request_result), joinedload(Activity.user)).filter(Activity.id == activity_id))
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    await db.delete(act)
    await db.commit()
    return {
        "message": "删除成功",
        "success": True,
    }

@router.post("/{activity_id}/reset-points")
async def reset_activity_points(activity_id: str, db: Session = Depends(get_db)):
    """
    重置活动的积分，并同步回退用户积分，允许重新计算。
    """
    # 查找活动
    result = await db.execute(select(Activity).options(joinedload(Activity.user), joinedload(Activity.pull_request_result)).filter(Activity.id == activity_id))
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    # 查找用户
    user = act.user
    if not user:
        raise HTTPException(status_code=404, detail="找不到活动关联的用户")
    # 回退用户积分
    if act.points and act.points > 0:
        user.points = max((user.points or 0) - act.points, 0)
    # 重置活动积分和状态
    act.points = 0
    act.status = "pending"
    act.completed_at = None
    # 清空AI分析结果
    if act.pull_request_result:
        act.pull_request_result.ai_analysis_result = None
    await db.commit()
    await db.refresh(act)
    await db.refresh(user)
    return {
        "data": {
            "activity": act.to_dict(),
            "user": user.to_dict(),
        },
        "message": "重置成功，积分已回退，可重新计算",
        "success": True,
    }