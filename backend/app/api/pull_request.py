from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.models.pull_request import PullRequest
from app.models.activity import Activity
from app.models.pull_request_result import PullRequestResult
from app.core.ai_service import perform_pr_analysis, calculate_points_from_analysis
from app.models.user import User
from datetime import datetime, timezone
from typing import List
from fastapi.responses import StreamingResponse
import asyncio
import json
from app.core.logging_config import logger

router = APIRouter(prefix="/api/pr", tags=["Pull Requests"])

# 用于存储活跃的 SSE 客户端连接
connections: dict[str, List[asyncio.Queue]] = {}

async def _full_pr_analysis_and_save(activity_show_id: str):
    """
    在后台执行完整的 PR AI 分析并保存结果到数据库。
    """
    async with AsyncSessionLocal() as db:
        try:
            activity_result = await db.execute(select(Activity).filter(Activity.show_id == activity_show_id))
            activity = activity_result.scalars().first()
            if not activity:
                print(f"Background task: Activity with show ID {activity_show_id} not found.")
                return
            print(f"Background task: Activity found: {activity.show_id}")

            pr_result = await db.execute(select(PullRequest).filter(PullRequest.pr_node_id == activity.id))
            pr = pr_result.scalars().first()
            if not pr:
                print(f"Background task: Pull Request with node ID {activity.id} not found for activity {activity.show_id}.")
                return
            print(f"Background task: Pull Request found: {pr.pr_node_id}")

            # 通知分析开始
            notify_clients(activity_show_id, {"status": "ai_analysis_started", "message": "AI 分析已开始..."})
            # 更新 activity 状态到 analyzing，并保存开始时间
            activity.status = "analyzing"
            activity.ai_analysis_started_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(activity)
            notify_clients(activity_show_id, {"status": activity.status, "message": "活动状态: 正在分析"})

            print(f"Background task: Starting AI analysis for PR {pr.pr_node_id}")
            try:
                analysis_result = await perform_pr_analysis(pr)
                print(f"Background task: AI analysis completed for PR {pr.pr_node_id}. Raw Result: {analysis_result}")
            except Exception as e:
                print(f"Background task: Error during perform_pr_analysis for PR {pr.pr_node_id}: {e}")
                # 保存一个失败的分析结果，以便后续排查
                analysis_result = {"error": str(e), "status": "analysis_failed"}
                overall_score = None # 确保整体评分设置为None

            overall_score = analysis_result.get("overall_score")
            if overall_score is None:
                print(f"Background task: Warning - overall_score is None for PR {pr.pr_node_id}. Full analysis_result: {analysis_result}")

            pr.score = int(overall_score) if overall_score is not None else None
            print(f"Background task: PR score set to: {pr.score}")

            pr_result_db = await db.execute(select(PullRequestResult).filter(PullRequestResult.pr_node_id == pr.pr_node_id))
            pr_result_obj = pr_result_db.scalars().first()

            if not pr_result_obj:
                print(f"Background task: Creating new PullRequestResult object for {pr.pr_node_id}")
                pr_result_obj = PullRequestResult(
                    pr_node_id=pr.pr_node_id,
                    pr_number=pr.pr_number,
                    repository=pr.repository,
                    action="analyzed",
                    ai_analysis_started_at=datetime.now(timezone.utc),
                    ai_analysis_result=analysis_result # Always save the full analysis_result
                )
                db.add(pr_result_obj)
                print(f"Background task: New PullRequestResult added to session for {pr.pr_node_id}. pr_result_obj.ai_analysis_result type: {type(pr_result_obj.ai_analysis_result)}")
            else:
                print(f"Background task: Updating existing PullRequestResult object for {pr.pr_node_id}. Current ai_analysis_result type: {type(pr_result_obj.ai_analysis_result)}")
                if pr_result_obj.ai_analysis_started_at is None:
                    pr_result_obj.ai_analysis_started_at = datetime.now(timezone.utc)
                pr_result_obj.ai_analysis_result = analysis_result # Always update with the full analysis_result
                pr_result_obj.updated_at = datetime.now(timezone.utc) # Update the updated_at field
                print(f"Background task: Updated pr_result_obj.ai_analysis_result for {pr.pr_node_id}. New type: {type(pr_result_obj.ai_analysis_result)}")
                pr_result_obj.action = "analyzed"
                print(f"Background task: Existing PullRequestResult updated in session for {pr.pr_node_id}. New ai_analysis_result type: {type(pr_result_obj.ai_analysis_result)}")

            if overall_score is not None:
                activity.status = "analyzed"
                print(f"Background task: Activity status set to analyzed for {activity_show_id}.")
                pr_result_obj.action = "analyzed"
                pr_result_obj.notification_message = f"PR #{pr.pr_number} 分析完成，得分：{overall_score}"
                # 通知分析完成和得分
                notify_clients(activity_show_id, {"status": activity.status, "message": "AI 分析完成", "overall_score": overall_score})
            else:
                activity.status = "analysis_failed"
                print(f"Background task: Activity status set to analysis_failed for {activity_show_id}.")
                pr_result_obj.action = "analysis_failed"
                print(f"Background task: AI analysis failed for {pr.pr_node_id}, overall_score is None, but full analysis_result is saved.")
                # 通知分析失败
                notify_clients(activity_show_id, {"status": activity.status, "message": "AI 分析失败", "error": analysis_result.get("error")})

            print(f"Background task: Attempting to commit changes for PR {pr.pr_node_id}.")
            await db.commit()
            print(f"Background task: Changes committed for PR {pr.pr_node_id}.")
            await db.refresh(pr)
            print(f"Background task: PR refreshed for {pr.pr_node_id}.")
            await db.refresh(activity)
            print(f"Background task: Activity refreshed for {activity_show_id}. Current status: {activity.status}")
            await db.refresh(pr_result_obj)
            print(f"Background task: PullRequestResult refreshed for {pr_result_obj.id}. Current ai_analysis_result type: {type(pr_result_obj.ai_analysis_result)}")
            print(f"Background task: AI analysis result for PR {pr.pr_node_id} saved/updated successfully. Final activity status: {activity.status}. PullRequestResult ID: {pr_result_obj.id}")

        except Exception as e:
            print(f"Background task: FATAL ERROR during full AI analysis and save for PR {activity_show_id}: {e}")
            import traceback
            traceback.print_exc() # 打印完整的堆栈信息
            await db.rollback()
            # 确保即使回滚，Activity 状态也能反映失败
            async with AsyncSessionLocal() as db_inner:
                activity_to_update = await db_inner.execute(select(Activity).filter(Activity.show_id == activity_show_id))
                activity_to_update = activity_to_update.scalars().first()
                if activity_to_update:
                    activity_to_update.status = "analysis_failed"
                    await db_inner.commit()
                    print(f"Background task: Activity {activity_show_id} status updated to analysis_failed after rollback.")
                    notify_clients(activity_show_id, {"status": "analysis_failed", "message": "AI 分析发生严重错误，请查看日志。"})

async def _event_generator(activity_show_id: str):
    """
    用于 SSE 的事件生成器。
    """
    # 为当前连接创建一个专属队列
    q = asyncio.Queue()
    if activity_show_id not in connections:
        connections[activity_show_id] = []
    connections[activity_show_id].append(q)

    try:
        while True:
            # 等待事件，超时是为了在客户端断开时能及时清理
            event_data = await asyncio.wait_for(q.get(), timeout=300)
            yield f"data: {json.dumps(event_data)}\n\n"
    except asyncio.TimeoutError:
        print(f"SSE client for {activity_show_id} timed out.")
    except asyncio.CancelledError:
        print(f"SSE client for {activity_show_id} disconnected.")
    except Exception as e:
        print(f"SSE event generator error for {activity_show_id}: {e}")
    finally:
        # 清理断开的连接
        if q in connections.get(activity_show_id, []):
            connections[activity_show_id].remove(q)
        if not connections[activity_show_id]:
            del connections[activity_show_id]

def notify_clients(activity_show_id: str, data: dict):
    """
    向所有订阅了特定 activity_show_id 的客户端发送通知。
    """
    if activity_show_id in connections:
        # 使用 asyncio.create_task 确保发送操作是非阻塞的
        for q in connections[activity_show_id]:
            try:
                asyncio.create_task(q.put(data))
            except Exception as e:
                print(f"Error putting data to queue for {activity_show_id}: {e}")

@router.get("/stream-analysis-updates/{activity_show_id}")
async def stream_analysis_updates(activity_show_id: str):
    """
    SSE 端点，用于客户端订阅 AI 分析状态更新。
    """
    return StreamingResponse(_event_generator(activity_show_id), media_type="text/event-stream")

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

@router.post("/{activity_show_id}/calculate-points")
async def calculate_pr_points(
    activity_show_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    根据 AI 评分结果计算并授予指定 PR 的积分。
    确保一个活动只能兑换一次积分。
    """
    try:
        activity_result = await db.execute(select(Activity).filter(Activity.show_id == activity_show_id).options(joinedload(Activity.pull_request_result)))
        activity = activity_result.scalars().first()

        if not activity:
            raise HTTPException(status_code=404, detail=f"Activity with show ID {activity_show_id} not found.")
        
        # 检查是否已存在 AI 分析结果
        if not activity.pull_request_result or not activity.pull_request_result.ai_analysis_result:
            raise HTTPException(status_code=400, detail="缺少 AI 分析结果，请先进行 AI 评分。")

        analysis_result = activity.pull_request_result.ai_analysis_result # 直接使用已存在的分析结果

        # 如果活动已完成且已存在 points 字段，则不重复授予，直接返回现有积分
        if activity.status == "completed" and activity.points is not None and activity.points > 0:
            print(f"[积分发放] 活动 {activity_show_id} 已完成且已发放积分 {activity.points}，不再重复授予。")
            return {"message": "Points already awarded for this activity.", "points_awarded": activity.points}

        score_result = analysis_result.get("score") or {
            "overall_score": analysis_result.get("overall_score"),
            "dimensions": analysis_result.get("dimensions")
        }

        # 始终重新计算积分，确保精确性
        points_calculation_result = await calculate_points_from_analysis(score_result)
        points_to_award = points_calculation_result["total_points"]
        detailed_points = points_calculation_result["detailed_points"]

        # 记录本次发放的积分，用于后续的活动积分显示
        activity.points = points_to_award
        activity.status = "completed"
        activity.completed_at = datetime.utcnow()

        # 将积分信息写回 analysis_result 中，方便前端一次性获取
        activity.pull_request_result.ai_analysis_result["points"] = points_calculation_result

        # 加载用户并更新其总积分
        user_result = await db.execute(select(User).filter(User.id == activity.user_id))
        user = user_result.scalars().first()
        if user:
            # 累加积分，而不是复杂的加减
            user.points = (user.points or 0) + points_to_award
            print(f"[积分发放] user_id={user.id}, activity_id={activity.id}, awarded={points_to_award}, new_total_points={user.points}")
        else:
            print(f"Could not find user with id {activity.user_id} to award points.")
        
        await db.commit()
        await db.refresh(activity)
        if user:
            await db.refresh(user)

        return {"message": f"Successfully awarded {points_to_award} points for activity {activity_show_id}.", "points_awarded": points_to_award}

    except HTTPException as e:
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to calculate and award points: {e}")

@router.post("/{activity_show_id}/analyze")
async def analyze_pull_request(
    activity_show_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    触发指定 PR 的 AI 评分。
    该接口将立即返回，AI 分析在后台异步执行。
    """
    print(f"Received analyze request for activity_show_id: {activity_show_id}")
    try:
        activity_result = await db.execute(select(Activity).filter(Activity.show_id == activity_show_id))
        activity = activity_result.scalars().first()
        if not activity:
            raise HTTPException(status_code=404, detail=f"Activity with show ID {activity_show_id} not found.")
        
        # 将耗时的 AI 分析和数据库保存操作放到后台任务中
        background_tasks.add_task(_full_pr_analysis_and_save, activity_show_id)

        return {"message": "PR AI analysis triggered successfully. Analysis will be performed in the background."}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger AI analysis: {e}") 