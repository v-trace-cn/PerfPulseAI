import asyncio
import httpx
from datetime import datetime
from uuid import uuid4
from app.core.database import AsyncSessionLocal
from app.models.activity import Activity
from app.models.scoring import ScoreEntry
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent
from app.core.ai_service import analyze_pr_diff
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def process_pending_tasks():
    """
    处理所有 pending 状态的 Activity，一次性拉取 diff 并进行 AI 分析评分
    """
    async with AsyncSessionLocal() as db:
        try:
            pending_result = await db.execute(select(Activity).filter(Activity.status == 'pending'))
            pending = pending_result.scalars().all()
            for act in pending:
                try:
                    if not act.diff_url:
                        continue
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(act.diff_url, headers={"Accept": "application/vnd.github.v3.diff"}, timeout=10)
                        resp.raise_for_status()
                        diff_text = resp.text
                    result = analyze_pr_diff(diff_text)
                    score = int(result.get("score", 0))
                    analysis = result.get("analysis", "")
                    
                    # 更新 Activity
                    act.description = analysis
                    act.points = score
                    act.status = 'completed'
                    db.add(act)

                    # 更新 PullRequest 表
                    pr_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == act.id))
                    pr = pr_result.scalars().first()
                    if pr:
                        pr.score = score
                        pr.analysis = analysis
                        db.add(pr)

                    # 创建时间线事件
                    event = PullRequestEvent(
                        pr_node_id=act.id,
                        event_type='ai_evaluation',
                        event_time=datetime.utcnow(),
                        details=analysis
                    )
                    db.add(event)

                    entry = ScoreEntry(
                        id=str(uuid4()), user_id=act.user_id, activity_id=act.id,
                        criteria_id=None, score=score, factors={"analysis": analysis},
                        notes="事件触发 AI 自动评分"
                    )
                    db.add(entry)
                    await db.commit()
                    print(f"[任务执行] PR {act.id} 评分完成，得分：{score}")
                except httpx.RequestError as e:
                    await db.rollback()
                    print(f"[任务执行] 拉取 PR {act.id} diff 失败：{e}")
                except Exception as e:
                    await db.rollback()
                    print(f"[任务执行] PR {act.id} 分析失败：{e}")
        except Exception as e:
            print(f"[任务调度器] 处理待处理任务时发生错误: {e}") 