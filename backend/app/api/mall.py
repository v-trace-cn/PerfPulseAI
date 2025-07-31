"""
积分商城API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.mall_service import MallService
from app.models.scoring import PurchaseStatus
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["mall"])


# Pydantic 模型
class PurchaseItemRequest(BaseModel):
    item_id: str = Field(..., description="商品ID")
    delivery_info: Optional[Dict[str, Any]] = Field(None, description="配送信息")


class CompletePurchaseRequest(BaseModel):
    delivery_info: Optional[Dict[str, Any]] = Field(None, description="发货信息")


class CancelPurchaseRequest(BaseModel):
    reason: str = Field("用户取消", description="取消原因")


class MallItemResponse(BaseModel):
    id: str
    name: str
    description: str
    points_cost: float
    category: str
    image: str
    stock: int
    is_available: bool
    tags: List[str]


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
    deliveryInfo: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    createdAt: str
    completedAt: Optional[str] = None
    isPending: bool
    isCompleted: bool
    isCancelled: bool


@router.get("/mall/items", response_model=List[MallItemResponse])
async def get_mall_items(
    category: Optional[str] = Query(None, description="商品分类过滤"),
    db: AsyncSession = Depends(get_db)
):
    """获取商城商品列表"""
    mall_service = MallService(db)
    items = await mall_service.get_mall_items()
    
    # 过滤分类
    if category:
        items = [item for item in items if item["category"] == category]
    
    return [
        MallItemResponse(
            id=item["id"],
            name=item["name"],
            description=item["description"],
            points_cost=item["pointsCost"],
            category=item["category"],
            image=item["image"],
            stock=item["stock"],
            is_available=item["isAvailable"],
            tags=item["tags"]
        )
        for item in items
    ]


@router.get("/mall/items/{item_id}")
async def get_mall_item(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """获取单个商品详情"""
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


@router.post("/mall/items/{item_id}/can-purchase")
async def can_purchase_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查是否可以购买商品"""
    mall_service = MallService(db)
    
    can_purchase, message = await mall_service.can_purchase_item(
        user_id=current_user.id,
        item_id=item_id
    )
    
    return {
        "canPurchase": can_purchase,
        "message": message
    }


@router.post("/mall/purchase", response_model=PurchaseResponse)
async def purchase_item(
    request: PurchaseItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """购买商品"""
    mall_service = MallService(db)

    try:
        purchase = await mall_service.purchase_item(
            user_id=current_user.id,
            item_id=request.item_id,
            delivery_info=request.delivery_info
        )
        return PurchaseResponse(**purchase.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/mall/purchases/my", response_model=List[PurchaseResponse])
async def get_my_purchases(
    limit: int = Query(20, description="每页数量"),
    offset: int = Query(0, description="偏移量"),
    status: Optional[str] = Query(None, description="状态过滤"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的购买记录"""
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


@router.get("/mall/purchases", response_model=List[PurchaseResponse])
async def get_all_purchases(
    limit: int = Query(20, description="每页数量"),
    offset: int = Query(0, description="偏移量"),
    status: Optional[str] = Query(None, description="状态过滤"),
    user_id: Optional[int] = Query(None, description="用户ID过滤"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取所有购买记录（管理员）"""
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


@router.get("/mall/purchases/my", response_model=List[PurchaseResponse])
async def get_my_purchases(
    status: Optional[str] = Query(None, description="购买状态过滤"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的购买记录"""
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


@router.get("/mall/purchases", response_model=List[PurchaseResponse])
async def get_all_purchases(
    status: Optional[str] = Query(None, description="购买状态过滤"),
    limit: int = Query(100, ge=1, le=200, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取所有购买记录（管理员）"""
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


@router.post("/mall/purchases/{purchase_id}/complete", response_model=PurchaseResponse)
async def complete_purchase(
    purchase_id: str,
    request: CompletePurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """完成购买（发货）"""
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


@router.post("/mall/purchases/{purchase_id}/cancel", response_model=PurchaseResponse)
async def cancel_purchase(
    purchase_id: str,
    request: CancelPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """取消购买"""
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


@router.get("/mall/statistics")
async def get_mall_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取商城统计信息（管理员）"""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")
    
    mall_service = MallService(db)
    stats = await mall_service.get_mall_statistics()
    
    return stats


@router.get("/mall/summary")
async def get_user_mall_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取用户商城使用摘要"""
    mall_service = MallService(db)
    summary = await mall_service.get_user_mall_summary(current_user.id)

    return summary


class RedemptionCodeRequest(BaseModel):
    redemption_code: str = Field(..., description="兑换密钥")


class RedemptionCodeResponse(BaseModel):
    valid: bool
    message: str
    purchase_info: Optional[Dict[str, Any]] = None


@router.post("/mall/verify-redemption-code", response_model=RedemptionCodeResponse)
async def verify_redemption_code(
    request: RedemptionCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """验证兑换密钥"""
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
                    "pointsCost": purchase.points_cost,
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


@router.post("/mall/redeem-code", response_model=PurchaseResponse)
async def redeem_code(
    request: RedemptionCodeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """使用兑换密钥核销商品"""
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
