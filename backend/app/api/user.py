from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.core.database import get_db
from app.core.base_api import BaseAPIRouter
from app.core.decorators import handle_api_errors, transaction
from app.models.user import User
from app.models.department import Department

import os
import uuid
from datetime import datetime

# Initialize router using base class
base_router = BaseAPIRouter(prefix="/api/users", tags=["user"])
router = base_router.router

@router.get("/{user_id}")
@handle_api_errors
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """获取用户信息"""
    result = await db.execute(
        select(User).filter(User.id == user_id).options(
            selectinload(User.department_rel),
            selectinload(User.company)
        )
    )
    user = result.scalars().first()
    if not user:
        base_router.error_response("User not found", 404)

    department_name = user.department_rel.name if user.department_rel else None
    company_name = user.company.name if user.company else None

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
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        "companyId": user.company_id,
        "companyName": company_name
    }

    return base_router.success_response(user_data, "查询成功")

@router.get("/{user_id}/achievements")
@handle_api_errors
async def get_achievements(user_id: int, db: AsyncSession = Depends(get_db)):
    """获取用户成就"""
    # TODO: implement achievement logic
    return base_router.success_response([], "查询成功")

@router.post("/{user_id}/updateInfo")
@handle_api_errors
@transaction
async def update_user(user_id: int, data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """更新用户信息"""
    print(f"更新用户信息请求: user_id={user_id}, data={data}")

    # 预加载关联对象以避免懒加载导致的异步问题
    result = await db.execute(
        select(User)
        .options(selectinload(User.department_rel), selectinload(User.company))
        .filter(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        base_router.error_response("User not found", 404)

    # 处理部门更新
    if "departmentId" in data and data["departmentId"] is not None:
        department_id = int(data["departmentId"])
        dept_result = await db.execute(select(Department).filter(Department.id == department_id))
        department_obj = dept_result.scalars().first()
        if not department_obj:
            base_router.error_response("指定的部门不存在", 400)
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
                    base_router.error_response("该邮箱已被注册", 400)
            setattr(user, db_field, data[frontend_field])
        elif frontend_field in data and data[frontend_field] is None:
            setattr(user, db_field, None)

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    await db.flush()
    await db.refresh(user)
    print(f"用户信息更新成功: {user.to_dict()}")
    return base_router.success_response(user.to_dict(), "用户信息更新成功")

@router.post("/{user_id}/upload_avatar")
@handle_api_errors
@transaction
async def upload_avatar(user_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """上传用户头像"""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        base_router.error_response("User not found", 404)

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
    await db.flush()
    await db.refresh(user)

    return base_router.success_response(user.to_dict(), "头像上传成功")
