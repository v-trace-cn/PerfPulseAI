from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.department import Department

import os
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["user"])

@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).filter(User.id == user_id).options(selectinload(User.department_rel))
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    department_name = user.department_rel.name if user.department_rel else None

    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "githubUrl": user.github_url,
        "avatar": user.avatar_url,
        "department": department_name,
        "departmentId": user.department_id,
        "position": user.position,
        "phone": user.phone,
        "joinDate": user.join_date.isoformat() if isinstance(user.join_date, datetime) else user.join_date,
        "points": user.points,
        "total_points": user.points,  # 添加 total_points 字段以保持一致性
        "level": user.level,
        "completed_activities_count": user.completed_tasks,
        "pendingTasks": user.pending_tasks,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None
    }

    return {"data": user_data, "message": "查询成功", "success": True}

@router.get("/{user_id}/achievements")
async def get_achievements(user_id: int, db: AsyncSession = Depends(get_db)):
    # TODO: implement achievement logic
    return {"data": [], "message": "查询成功", "success": True}

@router.post("/{user_id}/updateInfo")
async def update_user(user_id: int, data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 处理部门更新
    if "departmentId" in data and data["departmentId"] is not None:
        department_id = int(data["departmentId"])
        dept_result = await db.execute(select(Department).filter(Department.id == department_id))
        department_obj = dept_result.scalars().first()
        if not department_obj:
            raise HTTPException(status_code=400, detail="指定的部门不存在")
        user.department_id = department_id
    elif "departmentId" in data and data["departmentId"] is None:
        user.department_id = None

    # 处理其他允许更新的字段
    update_fields = {"name": "name", "email": "email", "position": "position", "phone": "phone", "githubUrl": "github_url"}
    for frontend_field, db_field in update_fields.items():
        if frontend_field in data and data[frontend_field] is not None:
            if frontend_field == "email":
                existing_result = await db.execute(select(User).filter(User.email == data[frontend_field], User.id != user_id))
                existing = existing_result.scalars().first()
                if existing:
                    raise HTTPException(status_code=400, detail="该邮箱已被注册")
            setattr(user, db_field, data[frontend_field])
        elif frontend_field in data and data[frontend_field] is None:
            setattr(user, db_field, None)

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    await db.commit()
    await db.refresh(user)
    return {"data": user.to_dict(), "message": "用户信息更新成功", "success": True}

@router.post("/{user_id}/upload_avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 确保保存目录存在
    upload_dir = "./static/avatars"
    os.makedirs(upload_dir, exist_ok=True)

    # 生成唯一文件名
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # 保存文件
    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(8192)
            if not chunk:
                break
            buffer.write(chunk)

    # 更新用户头像 URL
    user.avatar_url = f"/static/avatars/{unique_filename}" # URL 应该是可访问的静态文件路径
    await db.commit()
    await db.refresh(user)

    return {"data": user.to_dict(), "message": "头像上传成功", "success": True}
