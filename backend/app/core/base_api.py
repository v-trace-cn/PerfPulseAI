from typing import TypeVar, Generic, Any, Optional, Dict, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    
    """统一的API响应格式"""
    data: T
    message: str
    success: bool = True
    status_code: int = 200


class PaginationParams(BaseModel):
    """分页参数"""
    page: int = 1
    per_page: int = 10


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应格式"""
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    @classmethod
    def from_query_result(
        cls, 
        items: List[T], 
        total: int, 
        page: int, 
        per_page: int
    ) -> 'PaginatedResponse[T]':
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )


class BaseAPIRouter:
    """基础API路由器"""
    
    def __init__(self, prefix: str, tags: list[str]):
        self.router = APIRouter(prefix=prefix, tags=tags)
        
    @staticmethod
    def success_response(data: Any = None, message: str = "操作成功") -> dict:
        """创建成功响应"""
        return {
            "data": data,
            "message": message,
            "success": True
        }
    
    @staticmethod
    def error_response(message: str, status_code: int = 400) -> HTTPException:
        """创建错误响应"""
        raise HTTPException(status_code=status_code, detail=message)
    
    @staticmethod
    def paginated_response(
        items: List[Any],
        total: int,
        page: int = 1,
        per_page: int = 10,
        message: str = "获取成功"
    ) -> dict:
        """创建分页响应"""
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return {
            "data": {
                "items": items,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "message": message,
            "success": True
        }