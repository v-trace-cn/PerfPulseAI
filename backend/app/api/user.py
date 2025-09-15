from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.core.database import get_db
from app.core.base_api import BaseAPIRouter
from app.core.decorators import handle_api_errors, transaction
from app.models.user import User
from app.models.department import Department
from app.services.point_service import PointConverter

import os
import uuid
from datetime import datetime

# Initialize router using base class
base_router = BaseAPIRouter(prefix="/api/users", tags=["user"])
router = base_router.router


@router.get("/by-id/{user_id}")
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
        "points": PointConverter.format_for_api(user.points or 0),
        "total_points": PointConverter.format_for_api(user.points or 0),  # 添加 total_points 字段以保持一致性
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


@router.post("/by-id/{user_id}/updateInfo")
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
        if frontend_field in data:
            value = data[frontend_field]
            # 特殊处理 githubUrl：空字符串按 None 处理，并校验唯一
            if frontend_field == "githubUrl":
                if value is None or (isinstance(value, str) and value.strip() == ""):
                    setattr(user, db_field, None)
                else:
                    # 唯一性校验（忽略大小写差异可按需扩展）
                    existing_result = await db.execute(
                        select(User).filter(User.github_url == value, User.id != user_id)
                    )
                    existing = existing_result.scalars().first()
                    if existing:
                        base_router.error_response("该 GitHub 地址已被其他用户使用", 400)
                    setattr(user, db_field, value)
                continue

            # email 唯一校验（保留原逻辑）
            if frontend_field == "email" and value is not None:
                existing_result = await db.execute(
                    select(User).filter(User.email == value, User.id != user_id)
                )
                existing = existing_result.scalars().first()
                if existing:
                    base_router.error_response("该邮箱已被注册", 400)

            # 其余字段：None 直写，字符串可保留空字符串（按现有表约束）
            setattr(user, db_field, value)

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    await db.flush()
    await db.refresh(user)
    print(f"用户信息更新成功: {user.to_dict()}")
    return base_router.success_response(user.to_dict(), "用户信息更新成功")


@router.post("/by-id/{user_id}/upload_avatar")
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


# 列出公司成员（支持搜索与分页）
@router.get("/company-members")
@handle_api_errors
async def list_company_members(
    companyId: int | None = None,
    q: str | None = None,
    page: int = 1,
    pageSize: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    获取公司成员列表。若未提供 companyId，尝试通过 X-User-Id 识别当前用户并使用其 company_id。
    查询参数：companyId, q(搜索), page, pageSize
    返回：items[], total, page, pageSize
    """

    # 基础查询
    query = select(User).filter(User.company_id == companyId)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((User.name.ilike(like)) | (User.email.ilike(like)))

    total_result = await db.execute(query)
    all_users = total_result.scalars().all()
    total = len(all_users)

    # 分页
    start = (page - 1) * pageSize
    end = start + pageSize
    page_users = all_users[start:end]

    items = []
    for u in page_users:
        items.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "avatar": u.avatar_url,
            "companyId": u.company_id,
            "departmentId": u.department_id,
        })

    return base_router.success_response({
        "items": items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
    }, "获取公司成员成功")
