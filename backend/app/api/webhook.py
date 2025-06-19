# backend/app/api/webhook.py
import hmac
import hashlib
import requests
import os
import json
import asyncio

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
            pr_number = pull_request.get("number")
            pr_title = pull_request.get("title")
            user_login = pull_request.get("user", {})
            user_github_url = user_login.get("html_url")

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

            # 将 PR 任务标记为待处理，仅保存 diff_url
            if action in ["opened", "synchronize", "reopened"]:
                diff_url = pull_request.get("diff_url")
                pr_node_id = pull_request.get("node_id") or str(pull_request.get("id"))
                pr_title = pull_request.get("title")
                existing_activity = db.query(Activity).filter(Activity.id == pr_node_id).first()
                try:
                    if not existing_activity:
                        activity = Activity(title=pr_title, description=None, points=0, user_id=user_id, status="pending")
                        activity.id = pr_node_id
                        activity.diff_url = diff_url
                        db.add(activity)
                    else:
                        existing_activity.status = "pending"
                        existing_activity.diff_url = diff_url
                    db.commit()
                    print(f"    Pending task for PR #{pr_number} saved/updated successfully.")
                    # 触发即时处理所有 pending 任务
                    asyncio.create_task(process_pending_tasks())
                except Exception as e:
                    db.rollback()
                    print(f"    Error saving/updating pending task for PR #{pr_number}: {e}")
        else:
            print("  Received pull_request event but missing pull_request or repository data.")
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

    elif x_github_event == "ping":
        # GitHub 在设置 Webhook 后会发送一个 "ping" 事件来测试连接
        print(" Successfully received ping event from GitHub!")
    else:
        print(f"  Unhandled event type: {x_github_event}")

    # GitHub 期望你的服务器返回 200 OK 状态码
    return Response(status_code=200)
