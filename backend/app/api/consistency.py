"""积分系统一致性检查API."""

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.consistency_service import ConsistencyService
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api", tags=["consistency"])


class ConsistencyCheckResponse(BaseModel):
    check_time: str
    duration: float
    total_issues: int
    is_consistent: bool
    issues: dict
    summary: dict


@router.post("/consistency/check")
async def run_consistency_check(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """运行完整的一致性检查（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)

    # 在后台运行一致性检查
    background_tasks.add_task(consistency_service.run_full_consistency_check)

    return {"message": "一致性检查已启动，将在后台运行"}


@router.get("/consistency/check/sync")
async def run_consistency_check_sync(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """同步运行一致性检查（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)
    report = await consistency_service.run_full_consistency_check()

    return report


@router.get("/consistency/balance/{target_user_id}")
async def check_user_balance_consistency(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查特定用户的积分余额一致性."""
    # TODO: 添加权限检查（用户只能查看自己的，管理员可以查看任何用户的）

    consistency_service = ConsistencyService(db)
    issues = await consistency_service.check_user_balance_consistency(target_user_id)

    return {
        "userId": target_user_id,
        "issues": issues,
        "isConsistent": len(issues) == 0
    }


@router.post("/consistency/balance/{target_user_id}/fix")
async def fix_user_balance_inconsistency(
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """修复特定用户的积分余额不一致问题（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)

    try:
        result = await consistency_service.fix_user_balance_inconsistency(target_user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"修复失败: {e}")


@router.post("/consistency/balance/fix-all")
async def fix_all_balance_inconsistencies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """修复所有用户的积分余额不一致问题（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)
    results = await consistency_service.fix_all_balance_inconsistencies()

    fixed_count = sum(1 for r in results if r.get("fixed", False))

    return {
        "message": f"批量修复完成，成功修复 {fixed_count} 个用户的积分余额",
        "totalProcessed": len(results),
        "fixedCount": fixed_count,
        "results": results
    }


@router.get("/consistency/health")
async def get_system_health_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取系统健康指标."""
    consistency_service = ConsistencyService(db)
    metrics = await consistency_service.get_system_health_metrics()

    return metrics


@router.get("/consistency/negative-balances")
async def check_negative_balances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查负余额情况（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)
    issues = await consistency_service.check_negative_balances()

    return {
        "negativeBalanceIssues": issues,
        "count": len(issues),
        "hasIssues": len(issues) > 0
    }


@router.get("/consistency/orphaned-records")
async def check_orphaned_records(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查孤立记录（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)
    orphaned = await consistency_service.check_orphaned_records()

    total_orphaned = len(orphaned["disputes"]) + len(orphaned["purchases"])

    return {
        "orphanedRecords": orphaned,
        "totalOrphaned": total_orphaned,
        "hasOrphaned": total_orphaned > 0
    }


@router.get("/consistency/sequence-issues")
async def check_sequence_issues(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """检查交易序列一致性问题（管理员）."""
    # TODO: 添加管理员权限检查
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="需要管理员权限")

    consistency_service = ConsistencyService(db)
    issues = await consistency_service.check_transaction_sequence_consistency()

    return {
        "sequenceIssues": issues,
        "count": len(issues),
        "hasIssues": len(issues) > 0
    }
