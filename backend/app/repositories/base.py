import logging
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

ModelType = TypeVar('ModelType')


class BaseRepository(Generic[ModelType]):
    """基础仓储类，提供通用的数据库操作"""

    def __init__(self, model_class: Type[ModelType], db: AsyncSession):
        self.model_class = model_class
        self.db = db

    async def get_by_id(
        self,
        id: Any,
        eager_load: Optional[List[str]] = None,
        raise_not_found: bool = False
    ) -> Optional[ModelType]:
        """根据ID获取单个实体"""
        stmt = select(self.model_class).filter(self.model_class.id == id)

        if eager_load:
            for relation in eager_load:
                if hasattr(self.model_class, relation):
                    stmt = stmt.options(selectinload(getattr(self.model_class, relation)))

        result = await self.db.execute(stmt)
        entity = result.scalars().first()

        if raise_not_found and not entity:
            raise ValueError(f"{self.model_class.__name__} with id {id} not found")

        return entity

    async def get_by_field(
        self,
        field_name: str,
        field_value: Any,
        eager_load: Optional[List[str]] = None
    ) -> Optional[ModelType]:
        """根据字段值获取单个实体"""
        if not hasattr(self.model_class, field_name):
            raise ValueError(f"Field {field_name} does not exist on {self.model_class.__name__}")

        stmt = select(self.model_class).filter(
            getattr(self.model_class, field_name) == field_value
        )

        if eager_load:
            for relation in eager_load:
                if hasattr(self.model_class, relation):
                    stmt = stmt.options(selectinload(getattr(self.model_class, relation)))

        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        eager_load: Optional[List[str]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = True
    ) -> List[ModelType]:
        """获取所有实体"""
        stmt = select(self.model_class)

        # 应用过滤条件
        if filters:
            conditions = []
            for key, value in filters.items():
                if hasattr(self.model_class, key):
                    if value is not None:
                        conditions.append(getattr(self.model_class, key) == value)
            if conditions:
                stmt = stmt.filter(and_(*conditions))

        # 应用预加载
        if eager_load:
            for relation in eager_load:
                if hasattr(self.model_class, relation):
                    stmt = stmt.options(selectinload(getattr(self.model_class, relation)))

        # 应用排序
        if order_by and hasattr(self.model_class, order_by):
            order_field = getattr(self.model_class, order_by)
            stmt = stmt.order_by(order_field.desc() if order_desc else order_field)

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_paginated(
        self,
        page: int = 1,
        per_page: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        search_fields: Optional[Dict[str, str]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = True,
        eager_load: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """获取分页数据"""
        stmt = select(self.model_class)

        # 应用过滤条件
        if filters:
            conditions = []
            for key, value in filters.items():
                if hasattr(self.model_class, key) and value is not None:
                    conditions.append(getattr(self.model_class, key) == value)
            if conditions:
                stmt = stmt.filter(and_(*conditions))

        # 应用搜索条件
        if search_fields:
            search_conditions = []
            for field, search_value in search_fields.items():
                if hasattr(self.model_class, field) and search_value:
                    search_conditions.append(
                        getattr(self.model_class, field).ilike(f"%{search_value}%")
                    )
            if search_conditions:
                stmt = stmt.filter(or_(*search_conditions))

        # 应用预加载
        if eager_load:
            for relation in eager_load:
                if hasattr(self.model_class, relation):
                    stmt = stmt.options(selectinload(getattr(self.model_class, relation)))

        # 计算总数
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # 应用排序
        if order_by and hasattr(self.model_class, order_by):
            order_field = getattr(self.model_class, order_by)
            stmt = stmt.order_by(order_field.desc() if order_desc else order_field)

        # 应用分页
        stmt = stmt.offset((page - 1) * per_page).limit(per_page)

        # 执行查询
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 0
        }

    async def create(self, **kwargs) -> ModelType:
        """创建实体"""
        try:
            instance = self.model_class(**kwargs)
            self.db.add(instance)
            await self.db.commit()
            await self.db.refresh(instance)
            return instance
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating {self.model_class.__name__}: {e}")
            raise

    async def update(self, id: Any, **kwargs) -> Optional[ModelType]:
        """更新实体"""
        try:
            instance = await self.get_by_id(id)
            if not instance:
                return None

            for key, value in kwargs.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)

            await self.db.commit()
            await self.db.refresh(instance)
            return instance
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating {self.model_class.__name__}: {e}")
            raise

    async def delete(self, id: Any) -> bool:
        """删除实体"""
        try:
            instance = await self.get_by_id(id)
            if not instance:
                return False

            await self.db.delete(instance)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting {self.model_class.__name__}: {e}")
            raise

    async def bulk_create(self, items: List[Dict[str, Any]]) -> List[ModelType]:
        """批量创建实体"""
        try:
            instances = [self.model_class(**item) for item in items]
            self.db.add_all(instances)
            await self.db.commit()

            # 刷新所有实例
            for instance in instances:
                await self.db.refresh(instance)

            return instances
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error bulk creating {self.model_class.__name__}: {e}")
            raise

    async def exists(self, **kwargs) -> bool:
        """检查实体是否存在"""
        stmt = select(self.model_class)

        conditions = []
        for key, value in kwargs.items():
            if hasattr(self.model_class, key) and value is not None:
                conditions.append(getattr(self.model_class, key) == value)

        if conditions:
            stmt = stmt.filter(and_(*conditions))

        stmt = stmt.limit(1)
        result = await self.db.execute(stmt)
        return result.scalars().first() is not None

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """计算实体数量"""
        stmt = select(func.count()).select_from(self.model_class)

        if filters:
            conditions = []
            for key, value in filters.items():
                if hasattr(self.model_class, key) and value is not None:
                    conditions.append(getattr(self.model_class, key) == value)
            if conditions:
                stmt = stmt.filter(and_(*conditions))

        result = await self.db.execute(stmt)
        return result.scalar_one()
