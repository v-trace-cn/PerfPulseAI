import os
import sys
import argparse
import asyncio
from typing import Optional, Tuple, List

# Ensure backend on sys.path when running from repo root
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.ai_service import calculate_points_from_analysis
from app.models.activity import Activity
from app.models.user import User
from app.models.scoring import PointTransaction, TransactionType
from app.models.pull_request_result import PullRequestResult
from app.services.point_service import PointService, PointConverter


async def _get_activity_expected_points(db: AsyncSession, pr_result: PullRequestResult) -> float:
    analysis = pr_result.ai_analysis_result or {}
    # 构造顶层字段，统一 0-100 尺度
    score_input = {
        "overall_score": analysis.get("overall_score", 0),
        "innovation_score": analysis.get("innovation_score", 0),
        "dimensions": analysis.get("dimensions", {}),
    }
    pts = await calculate_points_from_analysis(score_input)
    return float(pts.get("total_points", 0.0))


async def _get_activity_company_id(db: AsyncSession, user_id: int, act_ids: List[str]) -> Optional[int]:
    # 优先从已有交易中获取该活动的公司ID，其次回退用户当前公司
    res = await db.execute(
        select(PointTransaction.company_id)
        .filter(
            PointTransaction.user_id == user_id,
            PointTransaction.reference_type == "activity",
            PointTransaction.reference_id.in_(act_ids),
        )
        .limit(1)
    )
    cid = res.scalar()
    if cid is not None:
        return int(cid)
    # fallback to user's current
    res2 = await db.execute(select(User.company_id).filter(User.id == user_id))
    return res2.scalar()


async def _sum_activity_txn_display(db: AsyncSession, user_id: int, act_ids: List[str]) -> int:
    # 返回存储格式总和（更稳妥），外部再转换展示
    res = await db.execute(
        select(func.coalesce(func.sum(PointTransaction.amount), 0))
        .filter(
            PointTransaction.user_id == user_id,
            PointTransaction.reference_type == "activity",
            PointTransaction.reference_id.in_(act_ids),
        )
    )
    return int(res.scalar() or 0)


async def reconcile(dry_run: bool, limit: Optional[int] = None) -> None:
    print("[Reconcile] Target table: point_transactions (will create ADJUST records)")
    print("[Reconcile] Join: activities ⇄ pull_request_results (ai_analysis_result) → expected points from AI")
    if dry_run:
        print("[DRY RUN] No changes will be committed.")

    async with AsyncSessionLocal() as db:  # type: ignore
        # 找出具备 AI 分析结果的活动
        q = (
            select(Activity.id, Activity.show_id, Activity.user_id, PullRequestResult.id)
            .join(PullRequestResult, Activity.id == PullRequestResult.pr_node_id)
            .filter(PullRequestResult.ai_analysis_result.isnot(None))
        )
        rows = (await db.execute(q)).all()
        total_acts = len(rows)
        print(f"[Reconcile] Activities with AI result: {total_acts}")

        svc = PointService(db)
        adjustments = 0
        examined = 0

        for (act_id, show_id, user_id, _pr_id) in rows:
            examined += 1
            # 计算应得分
            pr_res = await db.get(PullRequestResult, _pr_id)
            if not pr_res:
                continue
            expected_display = await _get_activity_expected_points(db, pr_res)

            # 计算当前已入账（存储单位）
            ref_ids = [x for x in [act_id, show_id] if x]
            storage_sum = await _sum_activity_txn_display(db, user_id, ref_ids)
            current_display = PointConverter.format_for_api(storage_sum)
            diff = round(expected_display - current_display, 1)

            if abs(diff) < 0.05:
                continue

            # 决定公司ID
            company_id = await _get_activity_company_id(db, user_id, ref_ids)
            if company_id is None:
                print(f"[WARN] Skip (no company): act={show_id or act_id}, user={user_id}")
                continue

            if dry_run:
                print(f"[DRY] Would ADJUST +{diff} for act={show_id or act_id}, user={user_id}, company={company_id} (expected={expected_display}, current={current_display})")
                adjustments += 1
            else:
                # 写入调整流水（展示单位）
                await svc.adjust_points(
                    user_id=user_id,
                    amount=diff,
                    reference_id=(show_id or act_id),
                    reference_type="activity",
                    description=f"reconcile activity: {(show_id or act_id)}",
                    company_id=company_id,
                    is_display_amount=True,
                )
                adjustments += 1
                print(f"[OK] ADJUST +{diff} act={show_id or act_id}, user={user_id}, company={company_id}")

            if limit and adjustments >= limit:
                break

        print("========== SUMMARY ==========")
        print(f"Activities examined: {examined}")
        if dry_run:
            print(f"Would adjust: {adjustments}")
        else:
            print(f"Adjusted: {adjustments}")


def main():
    parser = argparse.ArgumentParser(description="Reconcile historical activity points to match AI analysis results.")
    parser.add_argument("--dry-run", action="store_true", help="Do not write changes, only report what would change")
    parser.add_argument("--limit", type=int, default=None, help="Max number of adjustments to perform")

    args = parser.parse_args()
    asyncio.run(reconcile(dry_run=args.dry_run, limit=args.limit))


if __name__ == "__main__":
    main()

