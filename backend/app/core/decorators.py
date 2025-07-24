from functools import wraps
from typing import Callable, Any
from fastapi import HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
import logging
import time

logger = logging.getLogger(__name__)


def handle_api_errors(func: Callable) -> Callable:
    """处理API错误的装饰器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise  # 重新抛出HTTPException
        except ValueError as e:
            logger.warning(f"Validation error in {func.__name__}: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        except PermissionError as e:
            logger.warning(f"Permission error in {func.__name__}: {e}")
            raise HTTPException(status_code=403, detail=str(e))
        except Exception as e:
            logger.error(f"Unhandled error in {func.__name__}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="内部服务器错误")
    return wrapper


def require_authenticated(func: Callable) -> Callable:
    """需要用户认证的装饰器"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        # get_current_user 已经处理了认证检查，如果到这里说明用户已认证
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def require_admin(func: Callable) -> Callable:
    """需要管理员权限的装饰器"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="需要管理员权限")
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def require_company_admin(func: Callable) -> Callable:
    """需要公司管理员权限的装饰器"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        if not current_user.is_admin and current_user.role != 'company_admin':
            raise HTTPException(status_code=403, detail="需要公司管理员权限")
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def require_same_company(func: Callable) -> Callable:
    """需要同一公司的装饰器"""
    @wraps(func)
    async def wrapper(
        *args, 
        current_user: User = Depends(get_current_user),
        target_user_id: str = None,
        db: AsyncSession = Depends(get_db),
        **kwargs
    ):
        if target_user_id and target_user_id != current_user.id:
            # 检查目标用户是否在同一公司
            from app.models.user import User as UserModel
            stmt = select(UserModel).filter(UserModel.id == target_user_id)
            result = await db.execute(stmt)
            target_user = result.scalars().first()
            
            if not target_user or target_user.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="无权访问其他公司的用户")
                
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


def log_execution_time(func: Callable) -> Callable:
    """记录执行时间的装饰器"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        result = await func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        if execution_time > 1.0:  # 只记录超过1秒的操作
            logger.warning(f"{func.__name__} took {execution_time:.2f} seconds")
        else:
            logger.debug(f"{func.__name__} took {execution_time:.2f} seconds")
            
        return result
    return wrapper


def validate_request(schema: Any) -> Callable:
    """验证请求数据的装饰器"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, request_data: schema, **kwargs):
            # Pydantic会自动验证，这里可以添加额外的验证逻辑
            return await func(*args, request_data=request_data, **kwargs)
        return wrapper
    return decorator


def cache_result(ttl: int = 300) -> Callable:
    """缓存结果的装饰器（简单内存缓存）"""
    cache = {}
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 创建缓存键
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 检查缓存
            if cache_key in cache:
                cached_result, cached_time = cache[cache_key]
                if time.time() - cached_time < ttl:
                    logger.debug(f"Cache hit for {func.__name__}")
                    return cached_result
                    
            # 执行函数
            result = await func(*args, **kwargs)
            
            # 存储到缓存
            cache[cache_key] = (result, time.time())
            
            # 清理过期缓存
            current_time = time.time()
            expired_keys = [
                key for key, (_, cached_time) in cache.items()
                if current_time - cached_time >= ttl
            ]
            for key in expired_keys:
                del cache[key]
                
            return result
        return wrapper
    return decorator


def transaction(func: Callable) -> Callable:
    """数据库事务装饰器"""
    @wraps(func)
    async def wrapper(*args, db: AsyncSession = Depends(get_db), **kwargs):
        try:
            result = await func(*args, db=db, **kwargs)
            await db.commit()
            return result
        except Exception as e:
            await db.rollback()
            logger.error(f"Transaction failed in {func.__name__}: {e}")
            raise
    return wrapper