from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User

import os
import uuid

router = APIRouter(prefix="/api/users", tags=["user"])

@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": user.to_dict(), "message": "查询成功", "success": True}

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

    # 允许更新的字段
    for field in ["name", "email", "department", "position", "phone", "github_url"]:
        if field in data and data[field]:
            if field == "email":
                # 检查邮箱唯一性
                existing_result = await db.execute(select(User).filter(User.email == data[field], User.id != user_id))
                existing = existing_result.scalars().first()
                if existing:
                    raise HTTPException(status_code=400, detail="该邮箱已被注册")
            setattr(user, field, data[field])

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
