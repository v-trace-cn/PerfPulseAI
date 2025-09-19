import logging
from typing import Any, Generic, Optional, TypeVar

from app.core.base_api import PaginatedResponse
from app.repositories.base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

ModelType = TypeVar('ModelType')
CreateSchemaType = TypeVar('CreateSchemaType')
UpdateSchemaType = TypeVar('UpdateSchemaType')


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """基础服务类，提供通用的业务逻辑."""

    def __init__(
        self,
        model_class: type[ModelType],
        db: AsyncSession
    ):
        self.model_class = model_class
        self.db = db
        self.repository = BaseRepository(model_class, db)

    async def get_by_id(
        self,
        id: Any,
        eager_load: Optional[list[str]] = None
    ) -> Optional[ModelType]:
        """根据ID获取实体."""
        return await self.repository.get_by_id(id, eager_load=eager_load)

    async def get_by_id_or_404(
        self,
        id: Any,
        eager_load: Optional[list[str]] = None,
        error_message: str = "数据不存在"
    ) -> ModelType:
        """根据ID获取实体，不存在则抛出异常."""
        entity = await self.repository.get_by_id(id, eager_load=eager_load)
        if not entity:
            raise ValueError(error_message)
        return entity

    async def get_all(
        self,
        filters: Optional[dict[str, Any]] = None,
        eager_load: Optional[list[str]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = True
    ) -> list[ModelType]:
        """获取所有实体."""
        return await self.repository.get_all(
            filters=filters,
            eager_load=eager_load,
            order_by=order_by,
            order_desc=order_desc
        )

    async def get_paginated(
        self,
        page: int = 1,
        per_page: int = 10,
        filters: Optional[dict[str, Any]] = None,
        search_fields: Optional[dict[str, str]] = None,
        order_by: Optional[str] = None,
        order_desc: bool = True,
        eager_load: Optional[list[str]] = None
    ) -> PaginatedResponse[ModelType]:
        """获取分页数据."""
        result = await self.repository.get_paginated(
            page=page,
            per_page=per_page,
            filters=filters,
            search_fields=search_fields,
            order_by=order_by,
            order_desc=order_desc,
            eager_load=eager_load
        )

        return PaginatedResponse.from_query_result(
            items=result["items"],
            total=result["total"],
            page=result["page"],
            per_page=result["per_page"]
        )

    async def create(
        self,
        data: CreateSchemaType,
        **extra_fields
    ) -> ModelType:
        """创建实体."""
        create_data = data.dict() if hasattr(data, 'dict') else data
        create_data.update(extra_fields)

        # 移除None值
        create_data = {k: v for k, v in create_data.items() if v is not None}

        return await self.repository.create(**create_data)

    async def update(
        self,
        id: Any,
        data: UpdateSchemaType,
        **extra_fields
    ) -> Optional[ModelType]:
        """更新实体."""
        update_data = data.dict(exclude_unset=True) if hasattr(data, 'dict') else data
        update_data.update(extra_fields)

        # 移除None值
        update_data = {k: v for k, v in update_data.items() if v is not None}

        return await self.repository.update(id, **update_data)

    async def delete(self, id: Any) -> bool:
        """删除实体."""
        return await self.repository.delete(id)

    async def exists(self, **kwargs) -> bool:
        """检查实体是否存在."""
        return await self.repository.exists(**kwargs)

    async def count(self, filters: Optional[dict[str, Any]] = None) -> int:
        """计算实体数量."""
        return await self.repository.count(filters=filters)

    async def bulk_create(
        self,
        items: list[CreateSchemaType],
        **extra_fields
    ) -> list[ModelType]:
        """批量创建实体."""
        create_items = []
        for item in items:
            item_data = item.dict() if hasattr(item, 'dict') else item
            item_data.update(extra_fields)
            create_items.append(item_data)

        return await self.repository.bulk_create(create_items)

    async def validate_unique(
        self,
        field_name: str,
        field_value: Any,
        exclude_id: Optional[Any] = None,
        error_message: Optional[str] = None
    ) -> None:
        """验证字段唯一性."""
        existing = await self.repository.get_by_field(field_name, field_value)

        if existing and (not exclude_id or existing.id != exclude_id):
            if not error_message:
                error_message = f"{field_name} 已存在"
            raise ValueError(error_message)

    async def validate_exists(
        self,
        id: Any,
        error_message: str = "数据不存在"
    ) -> ModelType:
        """验证实体是否存在."""
        entity = await self.repository.get_by_id(id)
        if not entity:
            raise ValueError(error_message)
        return entity
