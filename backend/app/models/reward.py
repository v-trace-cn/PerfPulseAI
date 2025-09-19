"""商城相关数据模型 - 按照编码共识标准设计
"""
import uuid
from datetime import datetime, timezone

from app.core.database import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship


class MallItem(Base):
    """商城商品模型 - 按照编码共识设计的专业商品管理

    设计理念：
    - 支持多公司商品隔离
    - 完整的库存管理
    - 灵活的定价策略
    - 丰富的商品属性
    - 性能优化的索引设计
    """

    __tablename__ = 'mall_items'

    # 主键和基础信息
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)  # 简短描述，用于列表展示

    # 定价信息（使用后端存储格式，放大10倍）
    points_cost = Column(Integer, nullable=False, default=0, index=True)  # 积分成本
    original_price = Column(Float, nullable=True)  # 原价（用于显示折扣）

    # 分类和标签
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), nullable=True)
    tags = Column(JSON, nullable=True)  # 标签数组

    # 库存管理
    stock = Column(Integer, nullable=False, default=0, index=True)
    initial_stock = Column(Integer, nullable=False, default=0)  # 初始库存
    low_stock_threshold = Column(Integer, nullable=False, default=10)  # 低库存阈值

    # 状态管理
    is_available = Column(Boolean, nullable=False, default=True, index=True)
    is_featured = Column(Boolean, nullable=False, default=False)  # 是否推荐
    is_limited = Column(Boolean, nullable=False, default=False)  # 是否限量

    # 多媒体资源
    image_url = Column(String(500), nullable=True)
    image_urls = Column(JSON, nullable=True)  # 多图片支持
    icon = Column(String(200), nullable=True)  # 图标

    # 公司隔离
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True, index=True)  # null表示全局商品

    # 统计信息
    view_count = Column(Integer, nullable=False, default=0)
    purchase_count = Column(Integer, nullable=False, default=0)
    like_count = Column(Integer, nullable=False, default=0)

    # 排序和展示
    sort_order = Column(Integer, nullable=False, default=0, index=True)

    # 时间戳
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(microsecond=0))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
                       onupdate=lambda: datetime.now(timezone.utc).replace(microsecond=0))

    # 软删除
    deleted_at = Column(DateTime, nullable=True)

    # 关联关系
    purchases = relationship('PointPurchase', foreign_keys='PointPurchase.item_id',
                           primaryjoin='MallItem.id == PointPurchase.item_id')

    # 复合索引优化查询性能
    __table_args__ = (
        Index('idx_mall_items_company_category', 'company_id', 'category'),
        Index('idx_mall_items_available_stock', 'is_available', 'stock'),
        Index('idx_mall_items_featured_sort', 'is_featured', 'sort_order'),
    )

    @hybrid_property
    def points_cost_display(self) -> float:
        """返回前端展示格式的积分成本"""
        from app.services.point_service import PointConverter
        return PointConverter.to_display(self.points_cost)

    @hybrid_property
    def is_in_stock(self) -> bool:
        """检查是否有库存"""
        return self.stock > 0

    @hybrid_property
    def is_low_stock(self) -> bool:
        """检查是否库存不足"""
        return self.stock <= self.low_stock_threshold

    @hybrid_property
    def stock_status(self) -> str:
        """获取库存状态"""
        if self.stock <= 0:
            return "out_of_stock"
        elif self.stock <= self.low_stock_threshold:
            return "low_stock"
        else:
            return "in_stock"

    def to_dict(self) -> dict:
        """转换为字典格式，用于API响应

        Returns:
            dict: 商品信息字典

        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "shortDescription": self.short_description,
            "pointsCost": self.points_cost_display,  # 前端展示格式
            "originalPrice": self.original_price,
            "category": self.category,
            "subcategory": self.subcategory,
            "tags": self.tags or [],
            "stock": self.stock,
            "initialStock": self.initial_stock,
            "lowStockThreshold": self.low_stock_threshold,
            "isAvailable": self.is_available and self.is_in_stock,
            "isFeatured": self.is_featured,
            "isLimited": self.is_limited,
            "imageUrl": self.image_url,
            "imageUrls": self.image_urls or [],
            "icon": self.icon,
            "companyId": self.company_id,
            "viewCount": self.view_count,
            "purchaseCount": self.purchase_count,
            "likeCount": self.like_count,
            "sortOrder": self.sort_order,
            "stockStatus": self.stock_status,
            "isInStock": self.is_in_stock,
            "isLowStock": self.is_low_stock,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

    def to_api_response(self) -> dict:
        """转换为API响应格式（兼容现有前端）

        Returns:
            dict: API响应格式

        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "points_cost": self.points_cost_display,
            "category": self.category,
            "image": self.image_url or "/images/default-product.png",
            "stock": self.stock,
            "is_available": self.is_available and self.is_in_stock,
            "tags": self.tags or []
        }


class MallCategory(Base):
    """商城分类模型 - 支持层级分类管理
    """

    __tablename__ = 'mall_categories'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(200), nullable=True)
    parent_id = Column(String(36), ForeignKey('mall_categories.id'), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)  # null表示全局分类

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(microsecond=0))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc).replace(microsecond=0),
                       onupdate=lambda: datetime.now(timezone.utc).replace(microsecond=0))

    # 自关联关系
    children = relationship('MallCategory', backref='parent', remote_side=[id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "parentId": self.parent_id,
            "sortOrder": self.sort_order,
            "isActive": self.is_active,
            "companyId": self.company_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }





