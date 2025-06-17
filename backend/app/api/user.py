from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User

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
    for field in ["name", "email", "department", "position", "phone"]:
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
