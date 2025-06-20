from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.models.pull_request import PullRequest
from app.models.activity import Activity
from app.models.pull_request_result import PullRequestResult
from app.core.ai_service import perform_pr_analysis

router = APIRouter(prefix="/api/pr", tags=["Pull Requests"])

async def _save_analysis_to_db(activity_show_id: str, analysis_result: dict):
    """
    将 AI 分析结果异步保存到数据库。
    """
    async with AsyncSessionLocal() as db:
        try:
            activity_result = await db.execute(select(Activity).filter(Activity.show_id == activity_show_id))
            activity = activity_result.scalars().first()
            if not activity:
                print(f"Background task: Activity with show ID {activity_show_id} not found, cannot save analysis result.")
                return

            pr_node_id = activity.id
            pr_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == pr_node_id))
            pr = pr_result.scalars().first()
            if not pr:
                print(f"Background task: Pull Request with node ID {pr_node_id} (from activity.id) not found, cannot save analysis result.")
                return

            # 更新 PullRequest 的 score
            pr.score = analysis_result.get("overall_score")

            # 保存或更新 AI 分析结果到 PullRequestResult 表
            pr_result_query = await db.execute(select(PullRequestResult).filter(PullRequestResult.pr_node_id == pr_node_id))
            pr_result = pr_result_query.scalars().first()
            if not pr_result:
                pr_result = PullRequestResult(
                    pr_node_id=pr_node_id,
                    pr_number=pr.pr_number,
                    repository=pr.repository,
                    action="analyzed",
                    ai_analysis_result=analysis_result
                )
                db.add(pr_result)
            else:
                pr_result.ai_analysis_result = analysis_result
                pr_result.action = "analyzed"

            # 更新关联的 Activity
            activity.score = pr.score
            activity.status = "completed"

            await db.commit()
            await db.refresh(pr)
            await db.refresh(activity)
            await db.refresh(pr_result)
            print(f"Background task: AI analysis result for PR {pr_node_id} saved/updated successfully.")

        except Exception as e:
            await db.rollback()
            print(f"Background task: Error saving AI analysis result for PR {activity_show_id}: {e}")

@router.get("/{pr_node_id}")
async def get_pull_request_details(pr_node_id: str, db: AsyncSession = Depends(get_db)):
    """
    根据 PR 的 Node ID 获取其详细信息和时间线事件。
    """
    result = await db.execute(
        select(PullRequest)
        .options(joinedload(PullRequest.events))
        .filter(PullRequest.pr_node_id == pr_node_id)
    )
    pr = result.scalars().first()
    
    if not pr:
        raise HTTPException(status_code=404, detail="Pull Request not found")
        
    # 对事件按时间升序排序
    if pr.events:
        pr.events.sort(key=lambda event: event.event_time)
        
    return pr.to_dict()

@router.post("/{activity_show_id}/analyze")
async def analyze_pull_request(
    activity_show_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    触发指定 PR 的 AI 评分。
    优先返回 AI 分析结果给前端，然后异步更新表数据。
    """
    try:
        activity_result = await db.execute(select(Activity).filter(Activity.show_id == activity_show_id))
        activity = activity_result.scalars().first()
        if not activity:
            raise HTTPException(status_code=404, detail=f"Activity with show ID {activity_show_id} not found.")
        
        pr_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == activity.id))
        pr = pr_result.scalars().first()
        if not pr:
            raise HTTPException(status_code=404, detail=f"Pull Request with node ID {activity.id} (from activity.id) not found.")

        analysis_result = await perform_pr_analysis(pr.pr_node_id, pr.diff_url)
        
        response_data = {"message": "PR AI analysis triggered successfully", "analysis_result": analysis_result}

        background_tasks.add_task(_save_analysis_to_db, activity_show_id, analysis_result)

        return response_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger AI analysis: {e}") 