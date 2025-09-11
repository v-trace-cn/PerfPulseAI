from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.scoring import PointTransaction, TransactionType, PointPurchase
from app.models.user import User
from app.services.point_service import PointService
from app.services.mall_service import MallService

from app.services.point_service import PointConverter

router = APIRouter(prefix="/api", tags=["points-spec"])


# ---------- Pydantic models ----------
class LedgerItem(BaseModel):
    id: str
    change: float
    type: str
    sourceType: Optional[str] = None
    sourceId: Optional[str] = None
    createdAt: str


class LedgerResponse(BaseModel):
    list: List[LedgerItem]
    total: int


class AccrueRequest(BaseModel):
    userId: int
    companyId: Optional[int] = None
    sourceType: str = Field(..., description="activity|task 等")
    sourceId: str
    points: float


class AccrueResponse(BaseModel):
    ok: bool
    idempotent: bool = False


class RedeemRequest(BaseModel):
    rewardId: str


class RedeemResponse(BaseModel):
    orderId: str
    balance: float


# ---------- Helpers ----------

def _map_txn_to_ledger_item(txn: PointTransaction) -> LedgerItem:
    from app.services.point_service import PointConverter
    change = PointConverter.format_for_api(txn.amount)
    ttype = (txn.transaction_type.value if txn.transaction_type else "").lower()
    return LedgerItem(
        id=txn.id,
        change=change,
        type=ttype,
        sourceType=txn.reference_type,
        sourceId=txn.reference_id,
        createdAt=txn.created_at.isoformat() if hasattr(txn, "created_at") and txn.created_at else datetime.utcnow().isoformat()
    )


# ---------- Spec endpoints ----------
@router.get("/points/overview")
async def points_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """按规范返回 { totalEarned, totalSpent, balance }"""
    svc = PointService(db)
    stats = await svc.get_user_statistics(current_user.id, current_user.company_id)
    return {
        "totalEarned": stats.get("totalEarned", 0.0),
        "totalSpent": stats.get("totalSpent", 0.0),
        "balance": stats.get("currentBalance", 0.0),
    }


@router.get("/points/ledger", response_model=LedgerResponse)
async def points_ledger(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None, description="earn|spend|adjust"),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """按规范返回分页流水 { list, total }"""
    offset = (page - 1) * pageSize

    # 构建查询
    query = select(PointTransaction).filter(PointTransaction.user_id == current_user.id)
    # 公司维度过滤（A方案）
    if current_user.company_id is not None:
        query = query.filter(PointTransaction.company_id == current_user.company_id)

    if type:
        try:
            t_enum = TransactionType(type.upper())
            query = query.filter(PointTransaction.transaction_type == t_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的type参数")

    # 处理时间范围
    def _parse_dt(s: Optional[str]) -> Optional[datetime]:
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        except Exception:
            return None

    df = _parse_dt(dateFrom)
    dt = _parse_dt(dateTo)
    if df:
        query = query.filter(PointTransaction.created_at >= df)
    if dt:
        query = query.filter(PointTransaction.created_at <= dt)

    # 关键字（描述/来源ID/来源类型）
    if keyword:
        from sqlalchemy import or_
        kw = f"%{keyword}%"
        query = query.filter(
            or_(
                PointTransaction.description.ilike(kw),
                PointTransaction.reference_id.ilike(kw),
                PointTransaction.reference_type.ilike(kw)
            )
        )

    # 统计总数
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = int(total_res.scalar() or 0)

    # 获取数据
    res = await db.execute(query.order_by(desc(PointTransaction.created_at)).limit(pageSize).offset(offset))
    txns: List[PointTransaction] = res.scalars().all()

    items = [_map_txn_to_ledger_item(t) for t in txns]
    return LedgerResponse(list=items, total=total)


@router.post("/points/accrue", response_model=AccrueResponse)
async def points_accrue(
    req: AccrueRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """根据规范进行积分入账（当前限制：仅允许本人触发；公司校验为当前公司）。"""
    # 基本鉴权：用户需为本人
    if req.userId != current_user.id:
        raise HTTPException(status_code=403, detail="无权限为其他用户入账")

    # 公司校验与归一
    company_id = req.companyId if req.companyId is not None else current_user.company_id
    if company_id is None or current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="未加入指定公司")

    svc = PointService(db)

    # 幂等：先检查是否已有相同来源的 EARN 交易（按公司维度）
    existing = await svc._check_duplicate_transaction(
        user_id=current_user.id,
        reference_id=req.sourceId,
        reference_type=req.sourceType,
        transaction_type=TransactionType.EARN,
        company_id=company_id,
    )
    if existing:
        return AccrueResponse(ok=True, idempotent=True)

    # 入账
    try:
        await svc.earn_points(
            user_id=current_user.id,
            amount=req.points,
            reference_id=req.sourceId,
            reference_type=req.sourceType,
            description=f"{req.sourceType}:{req.sourceId}",
            company_id=company_id,
            is_display_amount=True,
        )
        return AccrueResponse(ok=True, idempotent=False)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/points/redeem", response_model=RedeemResponse)
async def points_redeem(
    req: RedeemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """根据规范兑换奖励，返回订单ID与最新余额。"""
    mall = MallService(db)
    svc = PointService(db)
    try:
        purchase = await mall.purchase_item(user_id=current_user.id, item_id=req.rewardId, company_id=current_user.company_id)
        balance = await svc.get_user_balance_for_display_by_company(current_user.id, current_user.company_id)
        return RedeemResponse(orderId=purchase.id, balance=balance)
    except ValueError as e:
        # 对齐文档错误语义
        msg = str(e)
        if "库存" in msg:
            raise HTTPException(status_code=409, detail="OUT_OF_STOCK")
        if "不可用" in msg:
            raise HTTPException(status_code=409, detail="REWARD_OFFLINE")
        if "余额不足" in msg or "积分余额不足" in msg:
            raise HTTPException(status_code=409, detail="BALANCE_NOT_ENOUGH")
        raise HTTPException(status_code=400, detail=msg)


@router.get("/rewards")
async def list_rewards(db: AsyncSession = Depends(get_db)):
    """规范别名：使用商城静态商品作为可兑换项，返回 { id, title, cost, stock, status }。"""
    items = await MallService(db).get_mall_items()
    return {
        "list": [
            {
                "id": it["id"],
                "title": it["name"],
                "description": it["description"],
                "cost": it["pointsCost"],
                "stock": it.get("stock", 0),
                "status": "on" if it.get("isAvailable", False) else "off",
            }
            for it in items
        ],
        "total": len(items),
    }


@router.get("/redeemOrders")
async def list_redeem_orders(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """规范别名：返回兑换订单列表 { list, total }。"""
    offset = (page - 1) * pageSize

    # 基础查询（按当前用户）
    query = select(PointPurchase).filter(PointPurchase.user_id == current_user.id)
    if current_user.company_id is not None:
        query = query.filter(PointPurchase.company_id == current_user.company_id)

    # 状态过滤
    if status:
        try:
            from app.models.scoring import PurchaseStatus
            query = query.filter(PointPurchase.status == PurchaseStatus(status.upper()))
        except ValueError:
            raise HTTPException(status_code=400, detail="无效的status参数")

    # 时间过滤
    def _parse_dt(s: Optional[str]) -> Optional[datetime]:
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace('Z', '+00:00'))
        except Exception:
            return None

    df = _parse_dt(dateFrom)
    dt = _parse_dt(dateTo)
    if df:
        query = query.filter(PointPurchase.created_at >= df)
    if dt:
        query = query.filter(PointPurchase.created_at <= dt)

    # 关键字：商品名/描述
    if keyword:
        from sqlalchemy import or_
        kw = f"%{keyword}%"
        query = query.filter(or_(PointPurchase.item_name.ilike(kw), PointPurchase.item_description.ilike(kw)))

    # 统计
    count_q = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_q)
    total = int(total_res.scalar() or 0)

    # 数据
    res = await db.execute(query.order_by(desc(PointPurchase.created_at)).limit(pageSize).offset(offset))
    orders = res.scalars().all()

    # 映射到规范结构
    def _map_order(o: PointPurchase) -> Dict[str, Any]:
        return {
            "id": o.id,
            "rewardId": o.item_id,
            "costSnapshot": PointConverter.format_for_api(o.points_cost),
            "status": o.status.value if o.status else None,
            "createdAt": o.created_at.isoformat() if o.created_at else None,
        }

    return {"list": [_map_order(o) for o in orders], "total": total}

