from datetime import datetime
from uuid import uuid4

from app.core.ai_service import perform_pr_analysis
from app.core.database import AsyncSessionLocal
from app.core.logging_config import logger
from app.models.activity import Activity
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent
from app.models.pull_request_result import PullRequestResult
from app.models.scoring import ScoreEntry
from sqlalchemy import select


async def process_pending_tasks():
    """处理所有 pending 状态的 Activity，一次性拉取 diff 并进行 AI 分析评分."""
    async with AsyncSessionLocal() as db:
        try:
            pending_result = await db.execute(select(Activity).filter(Activity.status == 'pending'))
            pending = pending_result.scalars().all()
            for act in pending:
                try:
                    if not act.diff_url:
                        continue

                    # 根据 activity.id (即 pr_node_id) 查询 PullRequest 对象
                    pr_obj_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == act.id))
                    pr_obj = pr_obj_result.scalars().first()

                    if not pr_obj:
                        logger.warning(f"PullRequest object not found for activity ID {act.id}. Skipping analysis.")
                        continue

                    # 现在将 PullRequest 对象传递给 perform_pr_analysis
                    result = await perform_pr_analysis(pr_obj)

                    # 从 AI 分析结果中提取总分和建议
                    total_points_from_ai = result.get("points", {}).get("total_points", 0)
                    suggestions_text = " ".join([s.get("content", "") for s in result.get("suggestions", [])])

                    # 更新 Activity
                    act.description = suggestions_text
                    act.points = total_points_from_ai
                    act.status = 'completed'
                    db.add(act)

                    # 更新 PullRequest 表
                    pr_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == act.id))
                    pr = pr_result.scalars().first()
                    if pr:
                        pr.score = total_points_from_ai
                        pr.analysis = suggestions_text
                        db.add(pr)

                        # 保存完整的 AI 分析结果到 PullRequestResult 表
                        existing_pr_analysis_result = await db.execute(
                            select(PullRequestResult).filter(PullRequestResult.pr_node_id == act.id)
                        )
                        pr_analysis_entry = existing_pr_analysis_result.scalars().first()

                        if not pr_analysis_entry:
                            # 如果不存在，则创建新记录
                            pr_analysis_entry = PullRequestResult(
                                pr_node_id=act.id,
                                pr_number=pr.pr_number,
                                repository=pr.repository,
                                action="ai_analyzed", # 表示由 AI 分析
                                ai_analysis_result=result, # 存储完整的 JSON 结果
                                created_at=datetime.utcnow()
                            )
                            db.add(pr_analysis_entry)
                        else:
                            # 如果已存在，则更新记录
                            pr_analysis_entry.ai_analysis_result = result
                            pr_analysis_entry.created_at = datetime.utcnow()
                            db.add(pr_analysis_entry)
                    else:
                        logger.warning(f"PullRequest with node_id {act.id} not found when processing pending task.")

                    # 创建时间线事件
                    event = PullRequestEvent(
                        pr_node_id=act.id,
                        event_type='ai_evaluation',
                        event_time=datetime.utcnow(),
                        details=suggestions_text
                    )
                    db.add(event)

                    entry = ScoreEntry(
                        id=str(uuid4()), user_id=act.user_id, activity_id=act.id,
                        criteria_id=None, score=total_points_from_ai, factors={"analysis": suggestions_text},
                        notes="事件触发 AI 自动评分"
                    )
                    db.add(entry)
                    await db.commit()
                    logger.info(f"[任务执行] PR {act.id} 评分完成，得分：{total_points_from_ai}")
                except ValueError as e: # 捕获来自 perform_pr_analysis 的 ValueError
                    await db.rollback()
                    # 提供更友好的提示
                    logger.error(f"[任务执行] PR {act.id} 分析失败：无法联调 GitHub。错误详情：{e}")
                except Exception as e:
                    await db.rollback()
                    logger.error(f"[任务执行] PR {act.id} 分析失败：{e}")
        except Exception as e:
            logger.error(f"[任务调度器] 处理待处理任务时发生异步操作错误，请检查数据库连接和事件循环配置: {e}")
