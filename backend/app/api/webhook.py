# backend/app/api/webhook.py
import hmac
import hashlib
import requests
import os
import json
import asyncio
from datetime import datetime

from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import APIRouter, Request, HTTPException, Header, Response, Depends

from app.core.database import get_db, SessionLocal
from app.core.ai_service import analyze_pr_diff
from app.models.activity import Activity
from app.models.scoring import ScoreEntry
from app.core.config import Settings
from app.models.user import User
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent
from app.core.scheduler import process_pending_tasks

router = APIRouter(prefix="/api/webhook", tags=["webhook"])
GITHUB_WEBHOOK_SECRET = Settings.GITHUB_WEBHOOK_SECRET


async def verify_signature(request: Request, github_signature: str):
    """
    验证 GitHub Webhook 请求的签名。
    """
    try:
        body = await request.body()
        signature_parts = github_signature.split('=', 1)
        if len(signature_parts) != 2 or signature_parts[0] != 'sha256':
            raise HTTPException(status_code=400, detail="Invalid signature format")

        digest = hmac.new(
            GITHUB_WEBHOOK_SECRET.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature_parts[1].encode('utf-8'), digest.encode('utf-8')):
            raise HTTPException(status_code=403, detail="Invalid signature")

    except Exception as e:
        # 生产环境中，这里应该有更详细的日志记录
        print(f"Signature verification failed: {e}")
        raise HTTPException(status_code=403, detail="Signature verification failed")


def parse_datetime(datetime_str: Optional[str]) -> Optional[datetime]:
    if not datetime_str:
        return None
    return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))


async def process_pull_request_event(
    payload: dict, unique_id: str
):
    """
    异步处理 pull_request 事件的详细逻辑，包括 AI 分析和数据库操作。
    """
    db = SessionLocal()
    try:
        action = payload.get("action")
        pull_request = payload.get("pull_request")
        repository = payload.get("repository")
        repo_name = repository.get("full_name")

        if pull_request and repository:
            pr_node_id = pull_request.get("node_id") or str(pull_request.get("id"))
            pr_number = pull_request.get("number")
            pr_title = pull_request.get("title")
            user_login = pull_request.get("user", {})
            user_github_url = user_login.get("html_url")
            title = f"{repo_name}-#{pr_number}-{pr_title}"

            print(f"  Repo: {repo_name}")
            print(f"  PR #{pr_number}: '{pr_title}' - Action: {action}")
            print(f"  user: {user_github_url}")

            user = None
            if user_github_url:
                # Strip whitespace to avoid mismatch issues
                user_github_url = user_github_url.strip()
                user = db.query(User).filter(User.github_url == user_github_url).first()
                print(f"Query result for user: {user}") # Added for debugging

                if not user:
                    print(f"User with GitHub URL {user_github_url} not found.")
                    return
                user_id = user.id
            else:
                print("GitHub user URL not found in payload. Skipping PR processing.")
                return

            # 当 PR 打开或同步时，创建或更新 PR 详情
            if action in ["opened", "synchronize", "reopened"]:
                pr = db.query(PullRequest).filter(PullRequest.pr_node_id == pr_node_id).first()
                if not pr:
                    pr = PullRequest(
                        pr_node_id=pr_node_id,
                        pr_number=pr_number,
                        repository=repo_name,
                        author=user_login.get("login")
                    )
                    db.add(pr)
                
                # 更新字段
                pr.title = pr_title
                pr.commit_sha = pull_request.get("head", {}).get("sha")
                pr.created_at = parse_datetime(pull_request.get("created_at"))
                pr.updated_at = parse_datetime(pull_request.get("updated_at"))
                pr.diff_url = pull_request.get("diff_url")

                # 如果是 opened 事件，创建时间线事件
                if action == "opened":
                    event = PullRequestEvent(
                        pr_node_id=pr_node_id,
                        event_type='opened',
                        event_time=pr.created_at,
                        details=f"PR #{pr_number} by {pr.author} opened."
                    )
                    db.add(event)
                
                db.commit()

                # 将分析任务放入队列
                existing_activity = db.query(Activity).filter(Activity.id == pr_node_id).first()
                try:
                    if not existing_activity:
                        activity = Activity(title=title, description=None, points=0, user_id=user.id, status="pending", created_at=pr.created_at)
                        activity.id = pr_node_id
                        activity.diff_url = pr.diff_url
                        db.add(activity)
                    else:
                        existing_activity.status = "pending"
                        existing_activity.diff_url = pr.diff_url
                        existing_activity.created_at = pr.created_at
                    db.commit()
                    print(f"    Pending task for PR #{pr_number} saved/updated successfully.")
                    asyncio.create_task(process_pending_tasks())
                except Exception as e:
                    db.rollback()
                    print(f"    Error saving/updating pending task for PR #{pr_number}: {e}")

            # 当 PR 关闭时
            elif action == "closed":
                if pull_request.get("merged"):
                    pr = db.query(PullRequest).filter(PullRequest.pr_node_id == pr_node_id).first()
                    if pr:
                        pr.merged_at = parse_datetime(pull_request.get("merged_at"))
                        event = PullRequestEvent(
                            pr_node_id=pr_node_id,
                            event_type='merged',
                            event_time=pr.merged_at,
                            details=f"PR #{pr_number} merged."
                        )
                        db.add(event)
                        db.commit()
        else:
            print("  Received pull_request event but missing pull_request or repository data.")
    finally:
        db.close()


async def process_pull_request_review_event(payload: dict):
    """处理 PR 审查事件"""
    db = SessionLocal()
    try:
        action = payload.get("action")
        review = payload.get("review")
        pull_request = payload.get("pull_request")
        
        # 我们只关心审查被提交且状态为"通过"的事件
        if action == "submitted" and review and review.get("state") == "approved":
            pr_node_id = pull_request.get("node_id")
            
            # 检查是否已存在相同的通过事件，防止重复记录
            existing_event = db.query(PullRequestEvent).filter(
                PullRequestEvent.pr_node_id == pr_node_id,
                PullRequestEvent.event_type == 'review_passed'
            ).first()

            if not existing_event:
                event = PullRequestEvent(
                    pr_node_id=pr_node_id,
                    event_type='review_passed',
                    event_time=parse_datetime(review.get("submitted_at")),
                    details=f"Code review approved by {review.get('user', {}).get('login')}."
                )
                db.add(event)
                db.commit()
                print(f"  PR {pull_request.get('number')} review approved event saved.")

    except Exception as e:
        db.rollback()
        print(f"Error processing pull request review event: {e}")
    finally:
        db.close()


@router.post("/github")
async def github_webhook_receiver(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256")
):
    """
    接收并处理来自 GitHub 的 Webhook 请求。
    """
    if x_hub_signature_256:
        await verify_signature(request, x_hub_signature_256)
    else:
        print("Warning: X-Hub-Signature-256 header not found. Skipping signature verification.")
        raise HTTPException(status_code=403, detail="Missing X-Hub-Signature-256 header")

    payload = await request.json()

    print(f"Received GitHub event: {x_github_event}")
    # 为文件保存生成一个唯一的ID，确保无论事件类型如何都能生成。
    # 对于 pull_request 事件，后续会尝试使用 PR 的 node_id。
    unique_id = str(uuid4())

    if x_github_event == "pull_request":
        # 异步处理 PR 事件，不阻塞主线程
        asyncio.create_task(process_pull_request_event(payload, unique_id))
    
    elif x_github_event == "pull_request_review":
        asyncio.create_task(process_pull_request_review_event(payload))

    elif x_github_event == "ping":
        # GitHub 在设置 Webhook 后会发送一个 "ping" 事件来测试连接
        print(" Successfully received ping event from GitHub!")
    else:
        print(f"  Unhandled event type: {x_github_event}")

    # GitHub 期望你的服务器返回 200 OK 状态码
    return Response(status_code=200)
