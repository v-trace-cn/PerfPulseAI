# backend/app/api/activity.py

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body, BackgroundTasks, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import asyncio

from app.core.database import get_db, AsyncSessionLocal
from app.models.activity import Activity
from app.core.scheduler import process_pending_tasks
from app.models.pull_request_result import PullRequestResult
from app.models.pull_request import PullRequest
from app.core.ai_service import perform_pr_analysis, calculate_points_from_analysis
from app.models.user import User

router = APIRouter(prefix="/api/activities", tags=["activity"])

@router.get("/")
async def get_activities(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: AsyncSession = Depends(get_db),
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
async def get_recent_activities(
    user_id: str | None = None,
    page: int = 1,
    per_page: int = 10,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Activity).options(joinedload(Activity.user), joinedload(Activity.pull_request_result))
    if user_id:
        stmt = stmt.filter(Activity.user_id == user_id)
    
    # 计算总数
    total_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = total_result.scalar_one()

    # 应用分页
    recent_result = (
        await db.execute(stmt.order_by(Activity.created_at.desc())
          .offset((page - 1) * per_page)
          .limit(per_page))
    )
    recent = recent_result.scalars().all()
    return {
        "data": {
            "activities": [a.to_dict() for a in recent],
            "total": total,
            "page": page,
            "per_page": per_page,
        },
        "message": "查询成功",
        "success": True,
    }

@router.post("/")
async def create_activity(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
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
async def get_activity(activity_id: str, db: AsyncSession = Depends(get_db)):
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
async def get_activity_by_show_id(show_id: str, db: AsyncSession = Depends(get_db)):
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
    db: AsyncSession = Depends(get_db),
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
async def delete_activity(activity_id: str, db: AsyncSession = Depends(get_db)):
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
async def reset_activity_points(activity_id: str, db: AsyncSession = Depends(get_db)):
    """
    重置活动的积分，并同步回退用户积分，允许重新计算。
    """
    try:
        # 查找活动并预加载关联的用户和PR结果
        result = await db.execute(
            select(Activity)
            .options(
                joinedload(Activity.user).joinedload(User.department_rel),
                joinedload(Activity.pull_request_result)
            )
            .filter(Activity.show_id == activity_id)
        )
        act = result.scalars().first()
        if not act:
            raise HTTPException(status_code=404, detail="找不到活动")
        
        # 查找用户（此时已预加载）
        user = act.user
        if not user:
            # 如果活动没有关联用户，记录警告并继续，不抛出404
            print(f"Warning: Activity {activity_id} has no associated user. Points cannot be reset for user.")
            # 即使没有用户，也重置活动状态，以便重新计算
            act.points = 0
            act.status = "pending"
            act.completed_at = None
            if act.pull_request_result:
                act.pull_request_result.ai_analysis_result = None
            await db.commit()
            # No need for db.refresh(act) here, as we're immediately returning
            return {
                "data": {"activity": act.to_dict()},
                "message": "活动已重置，但由于未找到关联用户，用户积分未回退。",
                "success": True,
            }

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
        # No need for db.refresh(act) or db.refresh(user) here, as frontend re-fetches
        
        return {
            "data": {
                "activity": act.to_dict(),
                "user": user.to_dict(),
            },
            "message": "重置成功，积分已回退，可重新计算",
            "success": True,
        }
    except HTTPException as e:
        # 捕获 FastAPI 的 HTTPException，直接重新抛出
        raise e
    except Exception as e:
        # 捕获其他所有异常，打印日志并返回通用错误信息
        await db.rollback() # 在发生错误时回滚数据库会话
        print(f"Error resetting activity points for {activity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"重置积分时发生内部错误: {e}")