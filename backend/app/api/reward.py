import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.base_api import BaseAPIRouter
from app.core.decorators import handle_api_errors, transaction
from app.models.reward import Reward, Redemption, RewardSuggestion
from app.models.user import User

# Initialize router using base class
base_router = BaseAPIRouter(prefix="/api/reward", tags=["reward"])
router = base_router.router

@router.get("/")
@handle_api_errors
async def get_rewards(page: int = 1, per_page: int = 10, db: AsyncSession = Depends(get_db)):
    """获取奖励列表"""
    stmt = select(Reward).filter_by(available=True)
    total_result = await db.execute(select(func.count()).select_from(stmt.subquery()))
    total = total_result.scalar_one()
    items_result = await db.execute(stmt.order_by(Reward.created_at.desc()).offset((page-1)*per_page).limit(per_page))
    items = items_result.scalars().all()

    rewards_data = [r.to_dict() for r in items]
    return base_router.paginated_response(
        items=rewards_data,
        total=total,
        page=page,
        per_page=per_page,
        message="查询成功"
    )

@router.get("/{reward_id}")
@handle_api_errors
async def get_reward(reward_id: str, db: AsyncSession = Depends(get_db)):
    """获取单个奖励详情"""
    result = await db.execute(select(Reward).filter(Reward.id == reward_id))
    reward = result.scalars().first()
    if not reward:
        base_router.error_response("找不到奖励", 404)
    return base_router.success_response(reward.to_dict(), "查询成功")

@router.post("/")
@handle_api_errors
@transaction
async def create_reward(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """创建新奖励"""
    new_reward = Reward(
        id=str(uuid.uuid4()),
        name=data.get("name"),
        description=data.get("description"),
        cost=int(data.get("cost", 0)),
        icon=data.get("icon"),
        available=data.get("available", True)
    )
    db.add(new_reward)
    await db.flush()
    await db.refresh(new_reward)
    return base_router.success_response(new_reward.to_dict(), "创建成功")

@router.post("/{reward_id}/redeem")
@handle_api_errors
@transaction
async def redeem_reward(reward_id: str, data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """兑换奖励"""
    user_result = await db.execute(select(User).filter(User.id == data.get("user_id")))
    user = user_result.scalars().first()
    reward_result = await db.execute(select(Reward).filter(Reward.id == reward_id))
    reward = reward_result.scalars().first()

    if not user:
        base_router.error_response("找不到用户", 404)
    if not reward:
        base_router.error_response("找不到奖励", 404)
    if not reward.available:
        base_router.error_response("该奖励不可用", 400)
    if user.points < reward.cost:
        base_router.error_response("积分不足", 400)

    user.points -= reward.cost
    redemption = Redemption(
        id=str(uuid.uuid4()),
        user_id=user.id,
        reward_id=reward_id,
        timestamp=datetime.utcnow(),
        status="pending"
    )
    db.add(redemption)
    await db.flush()
    await db.refresh(redemption)
    return base_router.success_response(redemption.to_dict(), "奖励兑换成功")

@router.get("/redemptions")
@handle_api_errors
async def get_redemptions(user_id: str = None, db: AsyncSession = Depends(get_db)):
    """获取兑换记录"""
    stmt = select(Redemption)
    if user_id:
        stmt = stmt.filter(Redemption.user_id == user_id)
    items_result = await db.execute(stmt.order_by(Redemption.timestamp.desc()))
    items = items_result.scalars().all()
    return base_router.success_response([r.to_dict() for r in items], "查询成功")

@router.post("/{reward_id}/like")
@handle_api_errors
@transaction
async def like_reward(reward_id: str, db: AsyncSession = Depends(get_db)):
    """点赞奖励"""
    result = await db.execute(select(Reward).filter(Reward.id == reward_id))
    reward = result.scalars().first()
    if not reward:
        base_router.error_response("找不到奖励", 404)
    reward.likes = (reward.likes or 0) + 1
    await db.flush()
    return base_router.success_response({"likes": reward.likes}, "点赞成功")

@router.post("/{reward_id}/suggest")
@handle_api_errors
@transaction
async def suggest_reward_change(reward_id: str, data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """建议奖励修改"""
    suggestion = RewardSuggestion(
        id=str(uuid.uuid4()),
        user_id=data.get("user_id", "anonymous"),
        reward_id=reward_id if reward_id != "new" else None,
        suggestion_text=data.get("suggestion", ""),
        suggested_value=data.get("suggested_value"),
        timestamp=datetime.utcnow(),
        status="pending"
    )
    db.add(suggestion)
    await db.flush()
    await db.refresh(suggestion)
    return base_router.success_response({"suggestion_id": suggestion.id}, "建议已提交，感谢您的反馈！")

@router.post("/suggest-new")
@handle_api_errors
@transaction
async def suggest_new_reward(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """建议新奖励"""
    suggestion = RewardSuggestion(
        id=str(uuid.uuid4()),
        user_id=data.get("user_id", "anonymous"),
        reward_id=None,
        suggestion_text=data.get("suggestion", ""),
        suggested_value=data.get("suggested_value"),
        timestamp=datetime.utcnow(),
        status="pending"
    )
    db.add(suggestion)
    await db.flush()
    await db.refresh(suggestion)
    return base_router.success_response({"suggestion_id": suggestion.id}, "新奖励建议已提交，感谢反馈！")
