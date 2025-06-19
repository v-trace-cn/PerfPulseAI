import asyncio
import requests
from requests.exceptions import RequestException
from uuid import uuid4
from app.core.database import SessionLocal
from app.models.activity import Activity
from app.models.scoring import ScoreEntry
from app.core.ai_service import analyze_pr_diff

async def process_pending_tasks():
    """
    处理所有 pending 状态的 Activity，一次性拉取 diff 并进行 AI 分析评分
    """
    db = SessionLocal()
    try:
        pending = db.query(Activity).filter(Activity.status == 'pending').all()
        for act in pending:
            try:
                if not act.diff_url:
                    continue
                resp = requests.get(act.diff_url, headers={"Accept": "application/vnd.github.v3.diff"}, timeout=10)
                resp.raise_for_status()
                diff_text = resp.text
                result = analyze_pr_diff(diff_text)
                score = int(result.get("score", 0))
                analysis = result.get("analysis", "")
                act.description = analysis
                act.points = score
                act.status = 'completed'
                db.add(act)
                entry = ScoreEntry(
                    id=str(uuid4()), user_id=act.user_id, activity_id=act.id,
                    criteria_id=None, score=score, factors={"analysis": analysis},
                    notes="事件触发 AI 自动评分"
                )
                db.add(entry)
                db.commit()
                print(f"[任务执行] PR {act.id} 评分完成，得分：{score}")
            except RequestException as e:
                db.rollback()
                print(f"[任务执行] 拉取 PR {act.id} diff 失败：{e}")
            except Exception as e:
                db.rollback()
                print(f"[任务执行] PR {act.id} 分析失败：{e}")
    finally:
        db.close() 