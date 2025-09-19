"""
创建商城相关表结构 - 按照编码共识标准设计

Revision ID: mall_tables_001
Revises: 
Create Date: 2025-01-17 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers
revision = 'mall_tables_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """创建商城相关表"""
    
    # 创建商城分类表
    op.create_table(
        'mall_categories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('icon', sa.String(200), nullable=True),
        sa.Column('parent_id', sa.String(36), nullable=True),
        sa.Column('sort_order', sa.Integer, nullable=False, default=0),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('company_id', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        
        # 外键约束
        sa.ForeignKeyConstraint(['parent_id'], ['mall_categories.id']),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        
        # 索引
        sa.Index('idx_mall_categories_company', 'company_id'),
        sa.Index('idx_mall_categories_parent', 'parent_id'),
        sa.Index('idx_mall_categories_sort', 'sort_order'),
    )
    
    # 创建商城商品表
    op.create_table(
        'mall_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('short_description', sa.String(500), nullable=True),
        
        # 定价信息
        sa.Column('points_cost', sa.Integer, nullable=False, default=0),
        sa.Column('original_price', sa.Float, nullable=True),
        
        # 分类和标签
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('subcategory', sa.String(50), nullable=True),
        sa.Column('tags', sa.JSON, nullable=True),
        
        # 库存管理
        sa.Column('stock', sa.Integer, nullable=False, default=0),
        sa.Column('initial_stock', sa.Integer, nullable=False, default=0),
        sa.Column('low_stock_threshold', sa.Integer, nullable=False, default=10),
        
        # 状态管理
        sa.Column('is_available', sa.Boolean, nullable=False, default=True),
        sa.Column('is_featured', sa.Boolean, nullable=False, default=False),
        sa.Column('is_limited', sa.Boolean, nullable=False, default=False),
        
        # 多媒体资源
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('image_urls', sa.JSON, nullable=True),
        sa.Column('icon', sa.String(200), nullable=True),
        
        # 公司隔离
        sa.Column('company_id', sa.Integer, nullable=True),
        
        # 统计信息
        sa.Column('view_count', sa.Integer, nullable=False, default=0),
        sa.Column('purchase_count', sa.Integer, nullable=False, default=0),
        sa.Column('like_count', sa.Integer, nullable=False, default=0),
        
        # 排序和展示
        sa.Column('sort_order', sa.Integer, nullable=False, default=0),
        
        # 时间戳
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.Column('deleted_at', sa.DateTime, nullable=True),
        
        # 外键约束
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        
        # 复合索引优化查询性能
        sa.Index('idx_mall_items_name', 'name'),
        sa.Index('idx_mall_items_points_cost', 'points_cost'),
        sa.Index('idx_mall_items_category', 'category'),
        sa.Index('idx_mall_items_stock', 'stock'),
        sa.Index('idx_mall_items_available', 'is_available'),
        sa.Index('idx_mall_items_company_category', 'company_id', 'category'),
        sa.Index('idx_mall_items_available_stock', 'is_available', 'stock'),
        sa.Index('idx_mall_items_featured_sort', 'is_featured', 'sort_order'),
    )


def downgrade():
    """删除商城相关表"""
    op.drop_table('mall_items')
    op.drop_table('mall_categories')
