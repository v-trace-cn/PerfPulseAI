# backend/app/api/activity.py

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.activity import Activity

router = APIRouter(prefix="/api/activities", tags=["activity"])

@router.get("/")
def get_activities(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(Activity)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Activity.title.ilike(pattern) |
            Activity.description.ilike(pattern)
        )
    total = query.count()
    items = (
        query.order_by(Activity.created_at.desc())
             .offset((page - 1) * per_page)
             .limit(per_page)
             .all()
    )
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
def get_recent_activities(db: Session = Depends(get_db)):
    recent = (
        db.query(Activity)
          .order_by(Activity.created_at.desc())
          .limit(5)
          .all()
    )
    return {
        "data": [a.to_dict() for a in recent],
        "message": "查询成功",
        "success": True,
    }

@router.post("/")
def create_activity(
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    activity_id = str(uuid.uuid4())
    new_act = Activity(
        id=activity_id,
        title=data.get("title"),
        description=data.get("description"),
        points=int(data.get("points", 0)),
        user_id=data.get("user_id"),
        status="pending",
        created_at=datetime.utcnow(),
        completed_at=None,
    )
    db.add(new_act)
    db.commit()
    db.refresh(new_act)
    return {
        "data": new_act.to_dict(),
        "message": "创建成功",
        "success": True,
    }

@router.get("/{activity_id}")
def get_activity(activity_id: str, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    return {
        "data": act.to_dict(),
        "message": "查询成功",
        "success": True,
    }

@router.put("/{activity_id}")
def update_activity(
    activity_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
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
    db.commit()
    db.refresh(act)
    return {
        "data": act.to_dict(),
        "message": "更新成功",
        "success": True,
    }

@router.delete("/{activity_id}")
def delete_activity(activity_id: str, db: Session = Depends(get_db)):
    act = db.query(Activity).filter(Activity.id == activity_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="找不到活动")
    db.delete(act)
    db.commit()
    return {
        "message": "删除成功",
        "success": True,
    }