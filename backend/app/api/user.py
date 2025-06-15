from fastapi import APIRouter, Depends, HTTPException
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
def update_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = {"name": "", "email": "", "password": "", "department": "", "position": "", "phone": "", "updated_at": ""}
    data.update(db.query(User).filter(User.id == user_id).first().to_dict())
    data.update(db.query(User).filter(User.id == user_id).first().__dict__)

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    department = data.get('department')
    position = data.get('position')
    phone = data.get('phone')
    updated_at = data.get("updated_at")
    if name:
        user.name = name
    if email:
        user.email = email
        existing_email = db.query(User).filter_by(email=email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="该邮箱已被注册")
    if password:
        user.set_password(password)
    if department:
        user.department = department
    if position:
        user.position = position
    if phone:
        user.phone = phone
    if updated_at:
        user.updated_at = updated_at
    db.commit()
    db.close()
    return {"data": user.to_dict(), "message": "用户信息更新成功", "success": True}
