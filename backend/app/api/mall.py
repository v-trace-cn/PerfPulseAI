"""积分商城API."""
from typing import Any, Optional

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.scoring import PurchaseStatus
from app.models.user import User
from app.services.mall_service import MallService
from app.services.point_service import PointConverter
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/mall", tags=["mall"])


# Pydantic 模型
class PurchaseItemRequest(BaseModel):
    item_id: str = Field(..., description="商品ID")
    delivery_info: Optional[dict[str, Any]] = Field(None, description="配送信息")


class CompletePurchaseRequest(BaseModel):
    delivery_info: Optional[dict[str, Any]] = Field(None, description="发货信息")


class CancelPurchaseRequest(BaseModel):
    reason: str = Field("用户取消", description="取消原因")


class CreateMallItemRequest(BaseModel):
    name: str = Field(..., description="商品名称")
    description: str = Field(..., description="商品描述")
    short_description: Optional[str] = Field(None, description="简短描述")
    points_cost: float = Field(..., description="积分成本")
    category: str = Field(..., description="商品分类")
    subcategory: Optional[str] = Field(None, description="子分类")
    stock: int = Field(0, description="库存数量")
    tags: Optional[list[str]] = Field(None, description="标签")
    image_url: Optional[str] = Field(None, description="图片URL")
    is_featured: bool = Field(False, description="是否推荐")
    is_limited: bool = Field(False, description="是否限量")
    sort_order: int = Field(0, description="排序")


class UpdateMallItemRequest(BaseModel):
    name: Optional[str] = Field(None, description="商品名称")
    description: Optional[str] = Field(None, description="商品描述")
    short_description: Optional[str] = Field(None, description="简短描述")
    points_cost: Optional[float] = Field(None, description="积分成本")
    category: Optional[str] = Field(None, description="商品分类")
    subcategory: Optional[str] = Field(None, description="子分类")
    stock: Optional[int] = Field(None, description="库存数量")
    tags: Optional[list[str]] = Field(None, description="标签")
    image_url: Optional[str] = Field(None, description="图片URL")
    is_available: Optional[bool] = Field(None, description="是否可用")
    is_featured: Optional[bool] = Field(None, description="是否推荐")
    is_limited: Optional[bool] = Field(None, description="是否限量")
    sort_order: Optional[int] = Field(None, description="排序")


class UpdateStockRequest(BaseModel):
    stock_change: int = Field(..., description="库存变化量")
    reason: str = Field("库存调整", description="变更原因")


class MallItemResponse(BaseModel):
    id: str
    name: str
    description: str
    points_cost: float
    category: str
    image: str
    stock: int
    is_available: bool
    tags: list[str]


class PurchaseResponse(BaseModel):
    id: str
    userId: int
    itemId: str
    itemName: str
    itemDescription: str
    pointsCost: float
    transactionId: Optional[str] = None  # 免费商品没有交易记录
    status: str
    redemptionCode: Optional[str] = None
    deliveryInfo: Optional[dict[str, Any]] = None
    notes: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None
    isPending: bool
    isCompleted: bool
    isCancelled: bool


@router.get("/items", response_model=list[MallItemResponse])
async def get_mall_items(
    category: Optional[str] = Query(None, description="商品分类过滤"),
    is_available: Optional[bool] = Query(None, description="是否可用过滤"),
    is_featured: Optional[bool] = Query(None, description="是否推荐过滤"),
    limit: Optional[int] = Query(None, description="限制数量"),
    offset: int = Query(0, description="偏移量"),
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    """获取商城商品列表 - 支持多种过滤条件.

    认证策略：
    - 无认证：只显示全局商品
    - 有认证：显示全局商品 + 用户公司的专属商品
    """
    mall_service = MallService(db)

    # 获取用户的公司ID（如果已认证）
    company_id = None
    if user_id:
        try:
            user_id_int = int(user_id)
            result = await db.execute(select(User).filter(User.id == user_id_int))
            user = result.scalar_one_or_none()
            if user:
                company_id = user.company_id
        except (ValueError, Exception):
            # 认证失败时不抛错，只显示全局商品
            pass

    # 使用新的数据库驱动方法
    items = await mall_service.get_mall_items(
        company_id=company_id,
        category=category,
        is_available=is_available,
        is_featured=is_featured,
        limit=limit,
        offset=offset
    )

    return [
        MallItemResponse(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            points_cost=item["points_cost"],
            category=item["category"],
            image=item["image"],
            stock=item["stock"],
            is_available=item["is_available"],
            tags=item["tags"]
        )
        for item in items
    ]


@router.get("/items/public", response_model=list[MallItemResponse])
async def get_public_mall_items(
    category: Optional[str] = Query(None, description="商品分类过滤"),
    is_available: Optional[bool] = Query(True, description="是否可用过滤"),
    is_featured: Optional[bool] = Query(None, description="是否推荐过滤"),
    limit: Optional[int] = Query(20, description="限制数量"),
    offset: int = Query(0, description="偏移量"),
    db: AsyncSession = Depends(get_db)
):
    """获取公开商品列表 - 无需认证.

    只显示全局商品，适用于：
    - 商品浏览
    - 搜索功能
    - 公开展示
    """
    mall_service = MallService(db)

    # 只获取全局商品，不需要认证
    items = await mall_service.get_mall_items(
        company_id=None,  # 只获取全局商品
        category=category,
        is_available=is_available,
        is_featured=is_featured,
        limit=limit,
        offset=offset
    )

    return [
        MallItemResponse(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            points_cost=item["points_cost"],
            category=item["category"],
            image=item["image"],
            stock=item["stock"],
            is_available=item["is_available"],
            tags=item["tags"]
        )
        for item in items
    ]


@router.get("/items/{item_id}")
async def get_mall_item(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取单个商品详情."""
    mall_service = MallService(db)
    item = await mall_service.get_item_by_id(item_id)

    if not item:
        raise HTTPException(status_code=404, detail="商品不存在")

    return {
        "id": item["id"],
        "name": item["name"],
        "description": item["description"],
        "pointsCost": item["pointsCost"],
        "category": item["category"],
        "image": item["image"],
        "stock": item["stock"],
        "isAvailable": item["isAvailable"],
        "tags": item["tags"]
    }


@router.post("/items/{item_id}/can-purchase")
async def can_purchase_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查是否可以购买商品."""
    mall_service = MallService(db)

    can_purchase, message = await mall_service.can_purchase_item(
        user_id=current_user.id,
        item_id=item_id
    )

    return {
        "canPurchase": can_purchase,
        "message": message
    }


@router.post("/purchase", response_model=PurchaseResponse)
async def purchase_item(
    request: PurchaseItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """购买商品 - 优化版本.

    支持功能：
    - 公司维度的积分管理
    - 库存实时检查
    - 详细的错误信息
    - 购买后统计更新
    """
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="用户未加入任何公司，无法进行积分兑换")

    mall_service = MallService(db)

    try:
        # 先检查商品是否可购买
        can_purchase, message = await mall_service.can_purchase_item(
            user_id=current_user.id,
            item_id=request.item_id,
            company_id=current_user.company_id
        )

        if not can_purchase:
            raise HTTPException(status_code=400, detail=message)

        # 执行购买
        purchase = await mall_service.purchase_item(
            user_id=current_user.id,
            item_id=request.item_id,
            delivery_info=request.delivery_info,
            company_id=current_user.company_id
        )

        return PurchaseResponse(**purchase.to_dict())

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Purchase failed for user {current_user.id}, item {request.item_id}: {e}")
        raise HTTPException(status_code=500, detail="购买失败，请稍后重试")


@router.get("/purchases/my", response_model=list[PurchaseResponse])
async def get_my_purchases(
    limit: int = Query(20, description="每页数量"),
    offset: int = Query(0, description="偏移量"),
    status: Optional[str] = Query(None, description="状态过滤"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的购买记录."""
    mall_service = MallService(db)

    try:
        purchases = await mall_service.get_user_purchases(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            status=status
        )
        return [PurchaseResponse(**purchase.to_dict()) for purchase in purchases]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取购买记录失败: {str(e)}")


@router.get("/purchases", response_model=list[PurchaseResponse])
async def get_all_purchases(
    limit: int = Query(20, description="每页数量"),
    offset: int = Query(0, description="偏移量"),
    status: Optional[str] = Query(None, description="状态过滤"),
    user_id: Optional[int] = Query(None, description="用户ID过滤"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取所有购买记录（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    mall_service = MallService(db)

    try:
        purchases = await mall_service.get_all_purchases(
            limit=limit,
            offset=offset,
            status=status,
            user_id=user_id
        )
        return [PurchaseResponse(**purchase.to_dict()) for purchase in purchases]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取购买记录失败: {str(e)}")


@router.get("/purchases/my", response_model=list[PurchaseResponse])
async def get_my_purchases(
    status: Optional[str] = Query(None, description="购买状态过滤"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的购买记录."""
    mall_service = MallService(db)

    # 转换状态字符串为枚举
    status_enum = None
    if status:
        try:
            status_enum = PurchaseStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的状态值")

    purchases = await mall_service.get_user_purchases(
        user_id=current_user.id,
        status=status_enum,
        limit=limit,
        offset=offset
    )

    return [PurchaseResponse(**purchase.to_dict()) for purchase in purchases]


@router.get("/purchases", response_model=list[PurchaseResponse])
async def get_all_purchases(
    status: Optional[str] = Query(None, description="购买状态过滤"),
    limit: int = Query(100, ge=1, le=200, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取所有购买记录（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    mall_service = MallService(db)

    # 转换状态字符串为枚举
    status_enum = None
    if status:
        try:
            status_enum = PurchaseStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的状态值")

    purchases = await mall_service.get_all_purchases(
        status=status_enum,
        limit=limit,
        offset=offset
    )

    return [PurchaseResponse(**purchase.to_dict()) for purchase in purchases]


@router.get("/purchases/company")
async def get_company_purchases(
    status: Optional[str] = Query(None, description="购买状态过滤"),
    limit: int = Query(100, ge=1, le=200, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取公司级别的购买记录."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="用户未加入任何公司")

    mall_service = MallService(db)

    # 转换状态字符串为枚举
    if status:
        try:
            PurchaseStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的状态值")

    purchases = await mall_service.get_company_purchases(
        company_id=current_user.company_id,
        status=status,
        limit=limit,
        offset=offset
    )

    # 获取总数
    total_count = await mall_service.get_company_purchases_count(
        company_id=current_user.company_id,
        status=status
    )

    # 为每个购买记录添加用户信息
    purchases_with_user_info = []
    for purchase in purchases:
        purchase_dict = purchase.to_dict()
        # 添加用户信息
        if purchase.user:
            purchase_dict.update({
                "userName": purchase.user.name,
                "userAvatar": purchase.user.avatar_url,
                "userDepartment": purchase.user.department_rel.name if purchase.user.department_rel else "未知部门"
            })
        else:
            purchase_dict.update({
                "userName": "未知用户",
                "userAvatar": "/placeholder.svg?height=32&width=32",
                "userDepartment": "未知部门"
            })
        purchases_with_user_info.append(purchase_dict)

    return {
        "purchases": purchases_with_user_info,
        "totalCount": total_count,
        "page": (offset // limit) + 1,
        "pageSize": limit,
        "totalPages": (total_count + limit - 1) // limit,
        "hasNext": offset + limit < total_count,
        "hasPrev": offset > 0
    }


@router.post("/purchases/{purchase_id}/complete", response_model=PurchaseResponse)
async def complete_purchase(
    purchase_id: str,
    request: CompletePurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """完成购买（发货）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    mall_service = MallService(db)

    try:
        purchase = await mall_service.complete_purchase(
            purchase_id=purchase_id,
            delivery_info=request.delivery_info
        )
        return PurchaseResponse(**purchase.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/purchases/{purchase_id}/cancel", response_model=PurchaseResponse)
async def cancel_purchase(
    purchase_id: str,
    request: CancelPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取消购买."""
    # TODO: 添加权限检查（用户只能取消自己的购买，管理员可以取消任何购买）

    mall_service = MallService(db)

    try:
        purchase = await mall_service.cancel_purchase(
            purchase_id=purchase_id,
            reason=request.reason
        )
        return PurchaseResponse(**purchase.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/statistics")
async def get_mall_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取商城统计信息（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    mall_service = MallService(db)
    stats = await mall_service.get_mall_statistics()


    return stats


@router.get("/statistics/company")
async def get_company_mall_statistics(
    months: int = Query(6, description="获取最近几个月的数据"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取公司级别的商城统计信息."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="用户未加入任何公司")

    mall_service = MallService(db)
    stats = await mall_service.get_company_statistics(
        company_id=current_user.company_id,
        months=months
    )


    return stats


@router.get("/summary")
async def get_user_mall_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取用户商城使用摘要."""
    mall_service = MallService(db)
    summary = await mall_service.get_user_mall_summary(current_user.id)


    return summary


class RedemptionCodeRequest(BaseModel):
    redemption_code: str = Field(..., description="兑换密钥")


class RedemptionCodeResponse(BaseModel):
    valid: bool
    message: str
    purchase_info: Optional[dict[str, Any]] = None


@router.post("/verify-redemption-code", response_model=RedemptionCodeResponse)
async def verify_redemption_code(
    request: RedemptionCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """验证兑换密钥."""
    mall_service = MallService(db)

    try:
        purchase = await mall_service.verify_redemption_code(request.redemption_code)
        if purchase:
            return RedemptionCodeResponse(
                valid=True,
                message="兑换密钥验证成功",
                purchase_info={
                    "id": purchase.id,
                    "itemName": purchase.item_name,
                    "itemDescription": purchase.item_description,
                    "pointsCost": PointConverter.format_for_api(purchase.points_cost),
                    "status": purchase.status.value,
                    "createdAt": purchase.created_at.isoformat() if purchase.created_at else None
                }
            )
        else:
            return RedemptionCodeResponse(
                valid=False,
                message="无效的兑换密钥"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"验证失败: {str(e)}")


@router.post("/redeem-code", response_model=PurchaseResponse)
async def redeem_code(
    request: RedemptionCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """使用兑换密钥核销商品."""
    mall_service = MallService(db)

    try:
        purchase = await mall_service.redeem_with_code(
            redemption_code=request.redemption_code,
            user_id=current_user.id
        )
        return PurchaseResponse(**purchase.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"核销失败: {str(e)}")


# ==================== 商品管理API ====================

@router.post("/admin/items", response_model=dict[str, Any])
async def create_mall_item(
    request: CreateMallItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建商城商品 - 管理员功能."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    mall_service = MallService(db)

    try:
        item = await mall_service.create_mall_item(
            name=request.name,
            description=request.description,
            points_cost=request.points_cost,
            category=request.category,
            stock=request.stock,
            company_id=current_user.company_id,
            short_description=request.short_description,
            subcategory=request.subcategory,
            tags=request.tags or [],
            image_url=request.image_url,
            is_featured=request.is_featured,
            is_limited=request.is_limited,
            sort_order=request.sort_order
        )
        return item.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"创建商品失败: {str(e)}")


@router.put("/admin/items/{item_id}", response_model=dict[str, Any])
async def update_mall_item(
    item_id: str,
    request: UpdateMallItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新商城商品 - 管理员功能."""
    # TODO: 添加管理员权限检查

    mall_service = MallService(db)

    # 只更新非None的字段
    updates = {k: v for k, v in request.dict().items() if v is not None}

    try:
        item = await mall_service.update_mall_item(
            item_id=item_id,
            company_id=current_user.company_id,
            **updates
        )

        if not item:
            raise HTTPException(status_code=404, detail="商品不存在")

        return item.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/admin/items/{item_id}")
async def delete_mall_item(
    item_id: str,
    hard_delete: bool = Query(False, description="是否硬删除"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除商城商品 - 管理员功能."""
    # TODO: 添加管理员权限检查

    mall_service = MallService(db)

    try:
        success = await mall_service.delete_mall_item(
            item_id=item_id,
            company_id=current_user.company_id,
            hard_delete=hard_delete
        )

        if not success:
            raise HTTPException(status_code=404, detail="商品不存在")

        return {"message": "商品删除成功"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"删除商品失败: {str(e)}")


@router.put("/admin/items/{item_id}/stock")
async def update_item_stock(
    item_id: str,
    request: UpdateStockRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新商品库存 - 管理员功能."""
    # TODO: 添加管理员权限检查

    mall_service = MallService(db)

    try:
        item = await mall_service.update_stock(
            item_id=item_id,
            stock_change=request.stock_change,
            company_id=current_user.company_id,
            reason=request.reason
        )

        if not item:
            raise HTTPException(status_code=404, detail="商品不存在")

        return {
            "message": "库存更新成功",
            "newStock": item.stock,
            "stockStatus": item.stock_status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"更新库存失败: {str(e)}")


@router.get("/admin/categories")
async def get_mall_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取商品分类列表 - 管理员功能."""
    mall_service = MallService(db)

    try:
        categories = await mall_service.get_categories(
            company_id=current_user.company_id
        )
        return {"categories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取分类失败: {str(e)}")


# ==================== 商城统计分析API ====================

@router.get("/analytics/overview")
async def get_mall_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取商城分析概览."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="用户未加入任何公司")

    mall_service = MallService(db)

    try:
        # 获取基础统计
        summary = await mall_service.get_user_mall_summary(current_user.id)

        # 获取商品统计
        from app.models.reward import MallItem
        from sqlalchemy import func, select

        # 商品总数和可用商品数
        items_result = await db.execute(
            select(
                func.count(MallItem.id).label('total_items'),
                func.sum(func.case((MallItem.is_available, 1), else_=0)).label('available_items'),
                func.sum(func.case((MallItem.stock <= MallItem.low_stock_threshold, 1), else_=0)).label('low_stock_items')
            ).where(
                and_(
                    MallItem.deleted_at.is_(None),
                    or_(
                        MallItem.company_id.is_(None),
                        MallItem.company_id == current_user.company_id
                    )
                )
            )
        )
        items_stats = items_result.first()

        # 热门商品
        popular_items_result = await db.execute(
            select(MallItem.name, MallItem.purchase_count, MallItem.view_count)
            .where(
                and_(
                    MallItem.deleted_at.is_(None),
                    MallItem.is_available,
                    or_(
                        MallItem.company_id.is_(None),
                        MallItem.company_id == current_user.company_id
                    )
                )
            )
            .order_by(desc(MallItem.purchase_count))
            .limit(5)
        )
        popular_items = [
            {
                "name": item.name,
                "purchaseCount": item.purchase_count,
                "viewCount": item.view_count
            }
            for item in popular_items_result.fetchall()
        ]

        return {
            "userSummary": summary,
            "itemsStats": {
                "totalItems": items_stats.total_items or 0,
                "availableItems": items_stats.available_items or 0,
                "lowStockItems": items_stats.low_stock_items or 0
            },
            "popularItems": popular_items
        }

    except Exception as e:
        logger.error(f"Failed to get mall analytics: {e}")
        raise HTTPException(status_code=500, detail="获取商城分析数据失败")


@router.get("/analytics/trends")
async def get_mall_trends(
    days: int = Query(30, description="统计天数"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取商城趋势数据."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="用户未加入任何公司")

    try:
        from datetime import datetime, timedelta, timezone

        from app.models.scoring import PointPurchase
        from app.models.user import User as UserModel
        from sqlalchemy import func, select

        # 计算日期范围
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        # 每日兑换趋势
        daily_trends_result = await db.execute(
            select(
                func.date(PointPurchase.created_at).label('date'),
                func.count(PointPurchase.id).label('redemptions'),
                func.sum(PointPurchase.points_cost).label('points_spent'),
                func.count(func.distinct(PointPurchase.user_id)).label('unique_users')
            )
            .join(UserModel, PointPurchase.user_id == UserModel.id)
            .where(
                and_(
                    UserModel.company_id == current_user.company_id,
                    PointPurchase.created_at >= start_date,
                    PointPurchase.status != PurchaseStatus.CANCELLED
                )
            )
            .group_by(func.date(PointPurchase.created_at))
            .order_by(func.date(PointPurchase.created_at))
        )

        daily_trends = []
        for row in daily_trends_result.fetchall():
            daily_trends.append({
                "date": row.date.isoformat(),
                "redemptions": row.redemptions,
                "pointsSpent": PointConverter.to_display(row.points_spent or 0),
                "uniqueUsers": row.unique_users
            })

        # 分类统计
        category_stats_result = await db.execute(
            select(
                MallItem.category,
                func.count(PointPurchase.id).label('redemptions'),
                func.sum(PointPurchase.points_cost).label('points_spent')
            )
            .join(PointPurchase, MallItem.id == PointPurchase.item_id)
            .join(UserModel, PointPurchase.user_id == UserModel.id)
            .where(
                and_(
                    UserModel.company_id == current_user.company_id,
                    PointPurchase.created_at >= start_date,
                    PointPurchase.status != PurchaseStatus.CANCELLED
                )
            )
            .group_by(MallItem.category)
            .order_by(desc(func.count(PointPurchase.id)))
        )

        category_stats = []
        for row in category_stats_result.fetchall():
            category_stats.append({
                "category": row.category,
                "redemptions": row.redemptions,
                "pointsSpent": PointConverter.to_display(row.points_spent or 0)
            })

        return {
            "dailyTrends": daily_trends,
            "categoryStats": category_stats,
            "period": {
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "days": days
            }
        }

    except Exception as e:
        logger.error(f"Failed to get mall trends: {e}")
        raise HTTPException(status_code=500, detail="获取趋势数据失败")


# ==================== 商品搜索和推荐API ====================

@router.get("/search")
async def search_mall_items(
    q: str = Query(..., description="搜索关键词"),
    category: Optional[str] = Query(None, description="分类过滤"),
    min_points: Optional[float] = Query(None, description="最低积分"),
    max_points: Optional[float] = Query(None, description="最高积分"),
    sort_by: str = Query("relevance", description="排序方式: relevance, points_asc, points_desc, popularity"),
    limit: int = Query(20, description="限制数量"),
    offset: int = Query(0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """商品搜索API.

    支持功能：
    - 关键词搜索（名称、描述）
    - 多维度过滤
    - 多种排序方式
    - 搜索结果高亮
    """
    try:
        from app.models.reward import MallItem
        from sqlalchemy import and_, asc, desc, or_, select

        # 构建基础查询
        query = select(MallItem).where(
            and_(
                MallItem.deleted_at.is_(None),
                MallItem.is_available,
                MallItem.stock > 0,
                or_(
                    MallItem.company_id.is_(None),
                    MallItem.company_id == current_user.company_id
                )
            )
        )

        # 关键词搜索
        if q:
            search_condition = or_(
                MallItem.name.ilike(f"%{q}%"),
                MallItem.description.ilike(f"%{q}%"),
                MallItem.short_description.ilike(f"%{q}%")
            )
            query = query.where(search_condition)

        # 分类过滤
        if category:
            query = query.where(MallItem.category == category)

        # 积分范围过滤
        if min_points is not None:
            min_points_storage = PointConverter.to_storage(min_points)
            query = query.where(MallItem.points_cost >= min_points_storage)

        if max_points is not None:
            max_points_storage = PointConverter.to_storage(max_points)
            query = query.where(MallItem.points_cost <= max_points_storage)

        # 排序
        if sort_by == "points_asc":
            query = query.order_by(asc(MallItem.points_cost))
        elif sort_by == "points_desc":
            query = query.order_by(desc(MallItem.points_cost))
        elif sort_by == "popularity":
            query = query.order_by(desc(MallItem.purchase_count), desc(MallItem.view_count))
        else:  # relevance
            # 简单的相关性排序：推荐商品优先，然后按浏览量
            query = query.order_by(desc(MallItem.is_featured), desc(MallItem.view_count))

        # 分页
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        items = result.scalars().all()

        # 转换为API响应格式
        search_results = []
        for item in items:
            item_data = item.to_api_response()

            # 添加搜索高亮（简单实现）
            if q:
                item_data["highlight"] = {
                    "name": q.lower() in item.name.lower(),
                    "description": q.lower() in (item.description or "").lower()
                }

            search_results.append(item_data)

        return {
            "items": search_results,
            "total": len(search_results),
            "query": q,
            "filters": {
                "category": category,
                "minPoints": min_points,
                "maxPoints": max_points,
                "sortBy": sort_by
            },
            "pagination": {
                "limit": limit,
                "offset": offset
            }
        }

    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail="搜索失败")


@router.get("/recommendations")
async def get_recommendations(
    limit: int = Query(10, description="推荐数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取个性化推荐商品.

    推荐策略：
    1. 用户历史购买偏好
    2. 热门商品
    3. 推荐商品
    4. 积分范围匹配
    """
    try:
        from app.models.reward import MallItem
        from app.models.scoring import PointPurchase
        from app.services.point_service import PointService
        from sqlalchemy import desc, func, select

        # 获取用户当前积分
        point_service = PointService(db)
        user_balance = await point_service.get_user_balance_for_display_by_company(
            current_user.id, current_user.company_id
        )

        # 获取用户购买历史的分类偏好
        user_categories_result = await db.execute(
            select(
                MallItem.category,
                func.count(PointPurchase.id).label('purchase_count')
            )
            .join(PointPurchase, MallItem.id == PointPurchase.item_id)
            .where(
                and_(
                    PointPurchase.user_id == current_user.id,
                    PointPurchase.status != PurchaseStatus.CANCELLED
                )
            )
            .group_by(MallItem.category)
            .order_by(desc(func.count(PointPurchase.id)))
            .limit(3)
        )

        preferred_categories = [row.category for row in user_categories_result.fetchall()]

        # 构建推荐查询
        query = select(MallItem).where(
            and_(
                MallItem.deleted_at.is_(None),
                MallItem.is_available,
                MallItem.stock > 0,
                MallItem.points_cost <= PointConverter.to_storage(user_balance * 1.2),  # 稍微超出预算的商品也推荐
                or_(
                    MallItem.company_id.is_(None),
                    MallItem.company_id == current_user.company_id
                )
            )
        )

        # 推荐排序策略
        if preferred_categories:
            # 有购买历史：偏好分类 + 热门度 + 推荐标记
            category_condition = MallItem.category.in_(preferred_categories)
            query = query.order_by(
                desc(category_condition),  # 偏好分类优先
                desc(MallItem.is_featured),  # 推荐商品优先
                desc(MallItem.purchase_count),  # 热门度
                desc(MallItem.view_count)
            )
        else:
            # 无购买历史：推荐商品 + 热门度
            query = query.order_by(
                desc(MallItem.is_featured),
                desc(MallItem.purchase_count),
                desc(MallItem.view_count)
            )

        query = query.limit(limit)

        result = await db.execute(query)
        items = result.scalars().all()

        recommendations = []
        for item in items:
            item_data = item.to_api_response()

            # 添加推荐原因
            reasons = []
            if item.category in preferred_categories:
                reasons.append("基于您的购买偏好")
            if item.is_featured:
                reasons.append("热门推荐")
            if item.purchase_count > 10:
                reasons.append("用户喜爱")
            if not reasons:
                reasons.append("为您精选")

            item_data["recommendationReasons"] = reasons
            recommendations.append(item_data)

        return {
            "recommendations": recommendations,
            "userBalance": user_balance,
            "preferredCategories": preferred_categories,
            "total": len(recommendations)
        }

    except Exception as e:
        logger.error(f"Get recommendations failed: {e}")
        raise HTTPException(status_code=500, detail="获取推荐失败")
