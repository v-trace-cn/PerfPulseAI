"""积分异议处理API."""
from typing import Optional

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.scoring import DisputeStatus
from app.models.user import User
from app.services.dispute_service import DisputeService
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api", tags=["disputes"])


# Pydantic 模型
class CreateDisputeRequest(BaseModel):
    transaction_id: str = Field(..., description="交易ID")
    reason: str = Field(..., min_length=10, max_length=500, description="异议原因")
    requested_amount: Optional[int] = Field(None, description="请求调整的积分数量")


class ResolveDisputeRequest(BaseModel):
    approved: bool = Field(..., description="是否批准异议")
    admin_response: str = Field(..., min_length=5, max_length=500, description="管理员回复")
    adjustment_amount: Optional[int] = Field(None, description="调整积分数量")


class DisputeResponse(BaseModel):
    id: str
    transaction_id: str
    user_id: int
    reason: str
    requested_amount: int
    status: str
    admin_response: Optional[str]
    admin_user_id: Optional[int]
    created_at: str
    resolved_at: Optional[str]
    is_pending: bool
    can_edit: bool


@router.post("/disputes", response_model=DisputeResponse)
async def create_dispute(
    request: CreateDisputeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建积分异议."""
    dispute_service = DisputeService(db)

    try:
        dispute = await dispute_service.create_dispute(
            transaction_id=request.transaction_id,
            user_id=current_user.id,
            reason=request.reason,
            requested_amount=request.requested_amount
        )
        return DisputeResponse(**dispute.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/disputes/my", response_model=list[DisputeResponse])
async def get_my_disputes(
    status: Optional[str] = Query(None, description="异议状态过滤"),
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的异议列表."""
    dispute_service = DisputeService(db)

    # 转换状态字符串为枚举
    status_enum = None
    if status:
        try:
            status_enum = DisputeStatus(status.upper())
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的状态值")

    disputes = await dispute_service.get_user_disputes(
        user_id=current_user.id,
        status=status_enum,
        limit=limit,
        offset=offset
    )

    return [DisputeResponse(**dispute.to_dict()) for dispute in disputes]


@router.get("/disputes/pending", response_model=list[DisputeResponse])
async def get_pending_disputes(
    limit: int = Query(50, ge=1, le=100, description="返回数量限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取待处理异议列表（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    dispute_service = DisputeService(db)
    disputes = await dispute_service.get_pending_disputes(limit=limit, offset=offset)

    return [DisputeResponse(**dispute.to_dict()) for dispute in disputes]


@router.post("/disputes/{dispute_id}/resolve", response_model=DisputeResponse)
async def resolve_dispute(
    dispute_id: str,
    request: ResolveDisputeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """解决异议（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    dispute_service = DisputeService(db)

    try:
        dispute = await dispute_service.resolve_dispute(
            dispute_id=dispute_id,
            admin_user_id=current_user.id,
            approved=request.approved,
            admin_response=request.admin_response,
            adjustment_amount=request.adjustment_amount
        )
        return DisputeResponse(**dispute.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/disputes/{transaction_id}/can-create")
async def can_create_dispute(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查是否可以对交易创建异议."""
    dispute_service = DisputeService(db)

    can_create, message = await dispute_service.can_create_dispute(
        transaction_id=transaction_id,
        user_id=current_user.id
    )

    return {
        "canCreate": can_create,
        "message": message
    }


@router.get("/disputes/statistics")
async def get_dispute_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取异议统计信息（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    dispute_service = DisputeService(db)
    stats = await dispute_service.get_dispute_statistics()

    return stats


@router.get("/disputes/expiring")
async def get_expiring_disputes(
    days_ahead: int = Query(7, ge=1, le=30, description="提前天数"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取即将过期的异议申请机会（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    dispute_service = DisputeService(db)
    expiring = await dispute_service.get_expiring_disputes(days_ahead=days_ahead)

    return {
        "expiringOpportunities": expiring,
        "count": len(expiring)
    }
