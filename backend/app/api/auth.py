import uuid
import json
from dataclasses import dataclass
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_public_key_pem, decrypt_rsa
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

@dataclass
class Response:
    data: Dict[str, Any]
    message: str
    status_code: int = 200
    success: bool = True

@router.post("/public_key")
def public_key():
    # 返回 PEM 格式公钥
    return Response(
        data={"public_key": get_public_key_pem()}, 
        message="获取公钥成功"
    )

@router.post("/login")
def login(data: dict = Body(...), db: Session = Depends(get_db)):
    """用户登录"""
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return Response(data={}, message="登录失败，没有该用户，请注册", status_code=404, success=False)
    if user and user.check_password(password):
        return Response(data={"email": user.email, "name": user.name, "userId": user.id}, message="登录成功")
    raise HTTPException(status_code=401, detail=f"无效的邮箱或密码")

@router.post("/register")
def register(data: dict = Body(...), db: Session = Depends(get_db)):
    """注册新用户"""
    # 前端数据加密，先解密
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    if not all([ email, password]):
        raise HTTPException(status_code=400, detail="缺少必填字段")
    if db.query(User).filter(User.email == email).first():
        return Response(data={}, message="该邮箱已被注册", status_code=400, success=False)
    name = email.split("@")[0]
    new_user = User(name=name, email=email)
    new_user.set_password(password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return Response(data={"email": new_user.email, "name": new_user.name, "userId": new_user.id}, message="注册成功")

@router.post("/logout")
def logout():
    """用户登出路由"""
    return Response(data={}, message="登出成功")

@router.get("/session")
def get_session():
    """检查当前会话状态"""
    return Response(data={"authenticated": False}, message="")

# 加载测试数据的路由
@router.post("/setup")
def setup_test_user(db: Session = Depends(get_db)):
    """创建测试用户"""
    if db.query(User).filter(User.username == 'admin').first():
        return Response(data={}, message="测试用户已存在", status_code=400, success=False)
    
    test_user = User(
        id=str(uuid.uuid4()),
        username='admin',
        email='admin@example.com',
        name='管理员',
        role='admin'
    )
    test_user.set_password('password')
    
    db.add(test_user)
    db.commit()
    
    return Response(data={
        "id": test_user.id,
        "username": test_user.username,
        "name": test_user.name,
        "email": test_user.email
    }, message="测试用户创建成功", success=True)
