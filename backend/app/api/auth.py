# backend/app/api/auth.py
"""授权管理 API 模块包."""
import uuid
from dataclasses import dataclass
from typing import Any, Optional

from app.core.database import get_db
from app.core.security import decrypt_rsa, get_public_key_pem
from app.models.user import User
from fastapi import APIRouter, Body, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/auth", tags=["auth"])

@dataclass
class Response:
    """回复模型."""

    data: dict[str, Any]
    message: str
    status_code: int = 200
    success: bool = True

@router.post("/public_key")
def public_key():
    """获取公钥."""
    return Response(
        data={"public_key": get_public_key_pem()},
        message="Get public key successfully"
    )

@router.post("/login")
async def login(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """用户登录."""
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        return Response(data={}, message="登录失败，没有该用户，请注册", status_code=404, success=False)
    if user and user.check_password(password):
        return Response(data={"email": user.email, "name": user.name, "userId": user.id}, message="登录成功")
    return Response(data={}, message="密码错误", status_code=401, success=False)

@router.post("/register")
async def register(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """注册新用户."""
    # 前端数据加密，先解密
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    if not all([ email, password]):
        raise HTTPException(status_code=400, detail="缺少必填字段")
    result = await db.execute(select(User).filter(User.email == email))
    if result.scalars().first():
        return Response(data={}, message="该邮箱已被注册", status_code=400, success=False)
    name = email.split("@")[0]
    new_user = User(name=name, email=email)
    new_user.set_password(password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # # 发送欢迎邮件
    # subject = "欢迎加入 PerfPulseAI！"
    # body = f"<p>尊敬的 {new_user.name}，</p><p>欢迎您加入 PerfPulseAI！我们很高兴您能成为我们的一员。</p><p>如果您有任何问题，请随时联系我们。</p><p>此致，</p><p>PerfPulseAI 团队</p>"
    # # 注意：在生产环境中，这里应该使用异步任务队列（如 Celery）来避免阻塞请求
    # # 但为了演示目的，我们直接调用 await
    # asyncio.create_task(send_email(subject, [new_user.email], body))

    return Response(data={"email": new_user.email, "name": new_user.name, "userId": new_user.id}, message="注册成功")

@router.post("/logout")
async def logout():
    """用户登出路由."""
    return Response(data={}, message="登出成功")

@router.post("/reset-password")
async def reset_password(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """重置用户密码."""
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return Response(data={}, message="缺少邮箱或密码", status_code=400, success=False)
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        return Response(data={}, message="用户不存在", status_code=404, success=False)
    # 更新密码
    user.set_password(password)
    await db.commit()
    return Response(data={}, message="重置密码成功")

@router.get("/session")
async def get_session():
    """检查当前会话状态."""
    return Response(data={"authenticated": False}, message="")

# 加载测试数据的路由
@router.post("/setup")
async def setup_test_user(db: AsyncSession = Depends(get_db)):
    """创建测试用户."""
    result = await db.execute(select(User).filter(User.username == 'admin'))
    if result.scalars().first():
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
    await db.commit()

    return Response(data={
        "id": test_user.id,
        "username": test_user.username,
        "name": test_user.name,
        "email": test_user.email
    }, message="测试用户创建成功", success=True)

@router.post("/verify-invite-code")
async def verify_invite_code(data: dict = Body(...)):
    """验证邀请码."""
    import os

    invite_code = data.get("inviteCode")
    if not invite_code:
        return Response(
            data={"valid": False},
            message="邀请码不能为空",
            status_code=400,
            success=False
        )

    # 从环境变量获取有效的邀请码
    valid_invite_code = os.getenv("INVITE_CODE")

    if invite_code == valid_invite_code:
        return Response(
            data={"valid": True},
            message="邀请码验证成功"
        )
    else:
        return Response(
            data={"valid": False},
            message="邀请码无效",
            status_code=401,
            success=False
        )


# 依赖函数，用于获取当前用户
async def get_current_user(
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """获取当前用户的依赖函数, 从请求头中获取用户ID, 后数据库查询用户信息."""
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="未提供用户ID，请先登录"
        )

    try:
        user_id_int = int(user_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="无效的用户ID格式"
        )

    result = await db.execute(select(User).filter(User.id == user_id_int))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="用户不存在"
        )

    return user

async def require_company_member(current_user: User = Depends(get_current_user)) -> None:
    """用于验证当前用户是否是公司成员."""
    if current_user.company_id is None:
        raise HTTPException(status_code=403, detail="NO_COMPANY")
