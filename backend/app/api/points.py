"""
积分系统API - 优化版
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.point_service import PointService
from app.services.level_service import LevelService
from app.models.scoring import TransactionType
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["points"])


# Pydantic 模型
class PointTransactionResponse(BaseModel):
    id: str
    userId: int
    transactionType: str
    amount: float
    balanceAfter: float
    referenceId: Optional[str]
    referenceType: Optional[str]
    description: Optional[str]
    createdAt: str
    canDispute: bool
    disputeTimeLeft: int


class PaginatedTransactionsResponse(BaseModel):
    transactions: List[PointTransactionResponse]
    totalCount: int
    page: int
    pageSize: int
    totalPages: int
    hasNext: bool
    hasPrev: bool


class UserPointsSummaryResponse(BaseModel):
    userId: int
    currentBalance: float
    totalTransactions: int
    totalEarned: float
    totalSpent: float
    lastTransactionDate: Optional[str]
    currentLevel: Optional[dict]
    nextLevel: Optional[dict]
    pointsToNext: Optional[float]
    progressPercentage: float
    # 兑换相关统计
    totalRedemptions: int = 0
    totalPointsSpentOnRedemptions: float = 0
    monthlyRedemptions: int = 0
    monthlyPointsSpentOnRedemptions: float = 0


@router.get("/points/balance")
async def get_my_points_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的积分余额"""
    point_service = PointService(db)
    balance = await point_service.get_user_balance_for_display(current_user.id)

    return {
        "userId": current_user.id,
        "balance": balance
    }


@router.get("/points/summary", response_model=UserPointsSummaryResponse)
async def get_my_points_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的积分摘要"""
    try:
        point_service = PointService(db)
        level_service = LevelService(db)

        # 获取积分统计
        stats = await point_service.get_user_statistics(current_user.id)
        print(f"积分统计: {stats}")

        # 获取等级信息
        level_info = await level_service.get_user_level_info(current_user.id)
        print(f"等级信息: {level_info}")

        # 获取兑换统计
        redemption_stats = await point_service.get_user_redemption_stats(current_user.id)
        print(f"兑换统计: {redemption_stats}")

        return UserPointsSummaryResponse(
            userId=current_user.id,
            currentBalance=stats["currentBalance"],
            totalTransactions=stats["totalTransactions"],
            totalEarned=stats["totalEarned"],
            totalSpent=stats["totalSpent"],
            lastTransactionDate=stats.get("lastTransactionDate"),
            currentLevel=level_info["currentLevel"],
            nextLevel=level_info["nextLevel"],
            pointsToNext=level_info["pointsToNext"],
            progressPercentage=level_info["progressPercentage"],
            totalRedemptions=redemption_stats["totalRedemptions"],
            totalPointsSpentOnRedemptions=redemption_stats["totalPointsSpent"],
            monthlyRedemptions=redemption_stats["monthlyRedemptions"],
            monthlyPointsSpentOnRedemptions=redemption_stats["monthlyPointsSpent"]
        )
    except Exception as e:
        print(f"积分摘要API错误: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取积分摘要失败: {str(e)}")


@router.get("/points/transactions", response_model=PaginatedTransactionsResponse)
async def get_my_transactions(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    transaction_type: Optional[str] = Query(None, description="交易类型过滤"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的积分交易记录（分页）"""
    try:
        point_service = PointService(db)

        # 转换交易类型
        type_enum = None
        if transaction_type:
            try:
                type_enum = TransactionType(transaction_type.upper())
            except ValueError:
                raise HTTPException(status_code=400, detail="无效的交易类型")

        # 计算偏移量
        offset = (page - 1) * page_size

        # 获取交易记录和总数
        transactions, total_count = await point_service.get_user_transactions(
            user_id=current_user.id,
            limit=page_size,
            offset=offset,
            transaction_type=type_enum,
            include_disputes=True
        )

        # 计算分页信息
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_prev = page > 1

        # 转换为响应格式
        transaction_responses = []
        for transaction in transactions:
            try:
                transaction_dict = transaction.to_dict()
                transaction_responses.append(PointTransactionResponse(**transaction_dict))
            except Exception as e:
                print(f"转换交易记录失败: {e}, 交易ID: {transaction.id}")
                # 跳过有问题的记录，继续处理其他记录
                continue

        return PaginatedTransactionsResponse(
            transactions=transaction_responses,
            totalCount=total_count,
            page=page,
            pageSize=page_size,
            totalPages=total_pages,
            hasNext=has_next,
            hasPrev=has_prev
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取积分交易记录失败: {str(e)}")


@router.get("/points/transactions/summary")
async def get_my_transactions_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的交易摘要"""
    point_service = PointService(db)
    summary = await point_service.get_user_transactions_summary(current_user.id)

    return summary


@router.get("/points/monthly-stats")
async def get_my_monthly_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的本月积分统计"""
    try:
        point_service = PointService(db)
        stats = await point_service.get_user_monthly_stats(current_user.id)
        return stats
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取月度统计失败: {str(e)}")


@router.get("/points/redemption-stats")
async def get_my_redemption_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的兑换统计"""
    try:
        point_service = PointService(db)
        stats = await point_service.get_user_redemption_stats(current_user.id)
        return stats
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取兑换统计失败: {str(e)}")


@router.get("/points/weekly-stats")
async def get_my_weekly_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的本周积分统计"""
    try:
        point_service = PointService(db)
        stats = await point_service.get_user_weekly_stats(current_user.id)
        return stats
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取周度统计失败: {str(e)}")


@router.get("/points/consistency")
async def check_my_points_consistency(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查我的积分一致性"""
    point_service = PointService(db)
    consistency = await point_service.check_consistency(current_user.id)
    
    return consistency


@router.get("/points/levels")
async def get_all_levels(
    db: AsyncSession = Depends(get_db)
):
    """获取所有等级信息"""
    level_service = LevelService(db)
    levels = await level_service.get_all_levels()
    
    return {
        "levels": [level.to_dict() for level in levels],
        "count": len(levels)
    }


@router.get("/points/levels/my")
async def get_my_level_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取我的等级信息"""
    level_service = LevelService(db)
    level_info = await level_service.get_user_level_info(current_user.id)
    
    return level_info


@router.get("/points/levels/statistics")
async def get_level_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取等级统计信息"""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")
    
    level_service = LevelService(db)
    stats = await level_service.get_level_statistics()
    
    return stats


@router.post("/points/admin/adjust")
async def admin_adjust_points(
    user_id: int,
    amount: int,
    description: str = "管理员积分调整",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """管理员积分调整"""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")
    
    point_service = PointService(db)
    
    try:
        transaction = await point_service.adjust_points(
            user_id=user_id,
            amount=amount,
            description=description,
            extra_data={
                "admin_user_id": current_user.id,
                "admin_user_name": current_user.name
            }
        )
        
        return {
            "message": f"成功调整用户 {user_id} 积分 {amount}",
            "transaction": transaction.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/points/admin/user/{target_user_id}/balance")
async def admin_get_user_balance(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """管理员查看用户积分余额"""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")
    
    point_service = PointService(db)

    balance = await point_service.get_user_balance(target_user_id)
    consistency = await point_service.check_consistency(target_user_id)

    return {
        "userId": target_user_id,
        "balance": balance,
        "consistency": consistency
    }


@router.get("/points/test/db-check")
async def test_database_connection(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """测试数据库连接和表结构"""
    try:
        from sqlalchemy import text

        # 测试基本数据库连接
        result = await db.execute(text("SELECT 1"))
        db_test = result.scalar()

        # 检查用户表
        user_check = await db.execute(text("SELECT COUNT(*) FROM users WHERE id = :user_id"), {"user_id": current_user.id})
        user_exists = user_check.scalar()

        # 检查积分交易表是否存在
        try:
            table_check = await db.execute(text("SELECT COUNT(*) FROM point_transactions"))
            transaction_count = table_check.scalar()
            table_exists = True
        except Exception as e:
            table_exists = False
            transaction_count = f"表不存在: {str(e)}"

        return {
            "success": True,
            "database_connection": db_test == 1,
            "current_user_id": current_user.id,
            "user_exists": user_exists > 0,
            "point_transactions_table_exists": table_exists,
            "transaction_count": transaction_count
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"数据库检查失败: {str(e)}")


@router.post("/points/test/create-sample-data")
async def create_sample_point_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建示例积分交易数据（仅用于测试）"""
    try:
        point_service = PointService(db)

        # 创建一些示例交易记录
        transactions = []

        # 获得积分记录（使用前端展示格式）
        transaction1 = await point_service.earn_points(
            user_id=current_user.id,
            amount=10.0,  # 前端展示格式：10.0积分
            reference_id="test_activity_1",
            reference_type="activity",
            description="完成代码审查任务",
            is_display_amount=True
        )
        transactions.append(transaction1)

        transaction2 = await point_service.earn_points(
            user_id=current_user.id,
            amount=5.0,  # 前端展示格式：5.0积分
            reference_id="test_activity_2",
            reference_type="activity",
            description="提交高质量代码",
            is_display_amount=True
        )
        transactions.append(transaction2)

        transaction3 = await point_service.earn_points(
            user_id=current_user.id,
            amount=2.5,  # 前端展示格式：2.5积分
            reference_id="test_bonus_1",
            reference_type="bonus",
            description="每日签到奖励",
            is_display_amount=True
        )
        transactions.append(transaction3)

        # 消费积分记录（使用前端展示格式）
        transaction4 = await point_service.spend_points(
            user_id=current_user.id,
            amount=3.0,  # 前端展示格式：3.0积分
            reference_id="test_purchase_1",
            reference_type="purchase",
            description="兑换咖啡券",
            is_display_amount=True
        )
        transactions.append(transaction4)

        return {
            "success": True,
            "message": f"成功创建 {len(transactions)} 条示例积分交易记录",
            "transactions": [t.to_dict() for t in transactions]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"创建示例数据失败: {str(e)}")
