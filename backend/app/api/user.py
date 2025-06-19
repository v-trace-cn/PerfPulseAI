from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User

import os
import uuid

router = APIRouter(prefix="/api/users", tags=["user"])

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": user.to_dict(), "message": "查询成功", "success": True}

@router.get("/{user_id}/achievements")
def get_achievements(user_id: int, db: Session = Depends(get_db)):
    # TODO: implement achievement logic
    return {"data": [], "message": "查询成功", "success": True}

@router.post("/{user_id}/updateInfo")
def update_user(user_id: int, data: dict = Body(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 允许更新的字段
    for field in ["name", "email", "department", "position", "phone", "github_url"]:
        if field in data and data[field]:
            if field == "email":
                # 检查邮箱唯一性
                existing = db.query(User).filter(User.email == data[field], User.id != user_id).first()
                if existing:
                    raise HTTPException(status_code=400, detail="该邮箱已被注册")
            setattr(user, field, data[field])

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.commit()
    db.refresh(user)
    return {"data": user.to_dict(), "message": "用户信息更新成功", "success": True}

@router.post("/{user_id}/upload_avatar")
async def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
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
        await file.read(buffer.write)

    # 更新用户头像 URL
    user.avatar_url = f"/static/avatars/{unique_filename}" # URL 应该是可访问的静态文件路径
    db.commit()
    db.refresh(user)

    return {"data": user.to_dict(), "message": "头像上传成功", "success": True}
