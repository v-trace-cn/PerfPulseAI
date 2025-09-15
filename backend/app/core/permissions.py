"""
权限验证中间件和装饰器
"""
from functools import wraps
from fastapi import HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.company import Company
from typing import List, Optional, Callable, Any
import asyncio


class PermissionChecker:
    """权限检查器"""

    def __init__(self, required_permissions: List[str] = None, require_company_access: bool = True):
        self.required_permissions = required_permissions or []
        self.require_company_access = require_company_access

    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        """检查用户权限"""
        # 从请求中获取用户ID（这里简化处理，实际应该从JWT token中获取）
        user_id = request.headers.get("X-User-Id")
        if not user_id:
            # 尝试从查询参数或请求体中获取
            user_id = request.query_params.get("userId")
            if not user_id and hasattr(request, '_json'):
                body = await request.json() if request.method in ['POST', 'PUT', 'PATCH'] else {}
                user_id = body.get("userId")

        if not user_id:
            raise HTTPException(status_code=401, detail="未提供用户身份信息")

        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的用户ID")

        # 获取用户信息
        result = await db.execute(
            select(User)
            .options(selectinload(User.company))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 检查公司访问权限
        if self.require_company_access:
            company_id = self._extract_company_id(request)
            if company_id and user.company_id != company_id:
                raise HTTPException(status_code=403, detail="无权访问该公司资源")

        # 将用户信息添加到请求中，供后续使用
        request.state.current_user = user
        return user

    def _extract_company_id(self, request: Request) -> Optional[int]:
        """从请求中提取公司ID"""
        # 从路径参数中提取
        if hasattr(request, 'path_params') and 'company_id' in request.path_params:
            try:
                return int(request.path_params['company_id'])
            except ValueError:
                pass

        # 从查询参数中提取
        company_id = request.query_params.get('companyId')
        if company_id:
            try:
                return int(company_id)
            except ValueError:
                pass

        return None


def require_permissions(permissions: List[str], require_company_access: bool = True):
    """权限验证装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 这个装饰器主要用于文档说明，实际权限检查通过依赖注入进行
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user(request: Request) -> User:
    """获取当前用户"""
    if hasattr(request.state, 'current_user'):
        return request.state.current_user
    raise HTTPException(status_code=401, detail="用户未认证")


async def check_company_creator_permission(user_id: int, company_id: int, db: AsyncSession) -> bool:
    """检查用户是否是公司的创建者或管理员"""
    # 检查用户是否是公司的创建者
    result = await db.execute(
        select(Company)
        .filter(Company.id == company_id, Company.creator_user_id == user_id)
    )
    company = result.scalars().first()

    if company:
        return True

    # TODO: 这里可以添加检查用户是否有管理员角色的逻辑
    # 目前只允许创建者进行管理操作
    return False


async def ensure_company_creator_permission(user_id: int, company_id: int, db: AsyncSession):
    """确保用户是公司的创建者或管理员，否则抛出异常"""
    if not await check_company_creator_permission(user_id, company_id, db):
        raise HTTPException(status_code=403, detail="只有公司管理员才能执行此操作")


async def ensure_company_creator_or_super_admin(user_id: int, company_id: int, db: AsyncSession):
    """确保当前用户为公司创建者或超级管理员，否则抛出 403。
    兼容未完成迁移（users.is_super_admin 列缺失）场景：此时按“非超管”处理。
    """
    # 超级管理员放行（容错：列缺失时不报 500）
    try:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if user and getattr(user, 'is_super_admin', False):
            return
    except Exception as e:
        msg = str(e).lower()
        if "no such column" in msg and "is_super_admin" in msg:
            # 迁移未到位：忽略超管判断，继续按创建者校验
            pass
        else:
            raise

    # 非超管则必须是公司创建者
    if await check_company_creator_permission(user_id, company_id, db):
        return
    raise HTTPException(status_code=403, detail="暂无权限")


class CompanyCreatorChecker:
    """公司创建者权限检查器"""

    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        """检查用户是否是公司创建者"""
        # 获取用户ID
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            user_id = request.query_params.get("userId")
            if not user_id and request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    body = await request.json()
                    user_id = body.get("userId")
                except:
                    pass

        if not user_id:
            raise HTTPException(status_code=401, detail="未提供用户身份信息")

        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的用户ID")

        # 获取公司ID
        company_id = None
        if hasattr(request, 'path_params') and 'company_id' in request.path_params:
            try:
                company_id = int(request.path_params['company_id'])
            except ValueError:
                pass

        if not company_id:
            company_id = request.query_params.get('companyId')
            if company_id:
                try:
                    company_id = int(company_id)
                except ValueError:
                    pass

        if company_id:
            await ensure_company_creator_permission(user_id, company_id, db)

        # 获取用户信息
        result = await db.execute(
            select(User)
            .options(selectinload(User.company))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        request.state.current_user = user
        return user


# 公司创建者权限检查器实例
company_creator_required = CompanyCreatorChecker()


class SimpleUserChecker:
    """简单用户身份检查器 - 只验证用户身份，不验证权限"""

    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        """只检查用户身份，不验证权限"""
        # 从请求中获取用户ID
        user_id = request.headers.get("X-User-Id")
        if not user_id:
            user_id = request.query_params.get("userId")
            if not user_id and request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    body = await request.json()
                    user_id = body.get("userId")
                except:
                    pass

        if not user_id:
            raise HTTPException(status_code=401, detail="未提供用户身份信息")

        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的用户ID")

        # 获取用户信息（兼容 is_super_admin 列尚未迁移的情况）
        try:
            result = await db.execute(
                select(User)
                .options(selectinload(User.company))
                .filter(User.id == user_id)
            )
            user = result.scalars().first()
        except Exception as e:
            msg = str(e).lower()
            if "no such column" in msg and "is_super_admin" in msg:
                # 迁移未到位：退化为最小字段的原生查询
                from sqlalchemy import text
                res = await db.execute(text("SELECT id, name, email, company_id FROM users WHERE id = :id"), {"id": user_id})
                row = res.mappings().first()
                if not row:
                    raise HTTPException(status_code=404, detail="用户不存在")
                from types import SimpleNamespace
                user = SimpleNamespace(id=row.get("id"), name=row.get("name"), email=row.get("email"), company_id=row.get("company_id"))
            else:
                raise

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        request.state.current_user = user
        return user


# 简单用户检查器实例
simple_user_required = SimpleUserChecker()
