# backend/app/api/webhook.py
import hmac
import hashlib
import requests
import os
import json

from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import APIRouter, Request, HTTPException, Header, Response, Depends

from app.core.database import get_db
from app.core.ai_service import analyze_pr_diff
from app.models.activity import Activity
from app.models.scoring import ScoreEntry
from app.core.config import Settings
from app.models.user import User

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


@router.post("/github")
async def github_webhook_receiver(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db)
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

    file_dir = "pr_results"
    os.makedirs(file_dir, exist_ok=True)
    file_path = os.path.join(file_dir, f"{unique_id}.json")
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"    Webhook payload written to {file_path}")

    if x_github_event == "pull_request":
        action = payload.get("action")
        pull_request = payload.get("pull_request")
        repository = payload.get("repository")

        if pull_request and repository:
            pr_number = pull_request.get("number")
            pr_title = pull_request.get("title")
            repo_name = repository.get("full_name")
            sender_login = payload.get("sender", {}).get("login")

            print(f"  Repo: {repo_name}")
            print(f"  PR #{pr_number}: '{pr_title}' - Action: {action}")
            print(f"  Sender: {sender_login}")

            # 尝试从 payload 中获取用户邮箱
            sender_email = payload.get("sender", {}).get("email")
            # 获取 GitHub 个人资料 URL
            sender_github_url = payload.get("sender", {}).get("html_url")

            # 获取或创建用户
            user = None
            if sender_email:
                user = db.query(User).filter(User.email == sender_email).first()

            if not user:
                # 如果用户不存在或没有提供邮箱，则创建一个新用户
                # 注意：此处为简化处理，实际应用中可能需要更完善的用户注册流程和密码设置
                user_name = sender_login if sender_login else "Unknown GitHub User"
                final_email = sender_email if sender_email else f"{user_name.replace(' ', '.').lower()}@github.com"
                
                user = User(name=user_name, email=final_email, github_url=sender_github_url, password="123") # 使用 github_url
                try:
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    print(f"    Created new user: {user.name} (ID: {user.id}, Email: {final_email})")
                except Exception as e:
                    db.rollback()
                    print(f"    Error creating user {sender_login} with email {final_email}: {e}")
                    return Response(status_code=500, content=f"Failed to create user: {e}")

            user_id = user.id  # 获取用户ID

            # AI 分析与评分
            if action in ["opened", "synchronize"]:
                # 获取 PR diff 内容
                diff_url = pull_request.get("diff_url")
                diff_resp = requests.get(diff_url, headers={"Accept": "application/vnd.github.v3.diff"})
                diff_text = diff_resp.text
                # 调用 AI 分析 diff
                ai_result = analyze_pr_diff(diff_text)
                score = ai_result.get("score", 0)
                analysis = ai_result.get("analysis", "")
                # 构造活动记录并保存
                pr_node_id = pull_request.get("node_id") or str(pull_request.get("id"))
                # 更新文件名为 PR 的 node_id，如果文件已经用 unique_id 创建
                # 注意：这里如果文件已经写入，只是更新文件名，内容不会变
                # 如果需要内容也更新，则需要重新写入文件
                if unique_id != pr_node_id:
                    old_file_path = file_path
                    file_path = os.path.join(file_dir, f"{pr_node_id}.json")
                    os.rename(old_file_path, file_path)
                    print(f"    Renamed payload file to {file_path}")
                
                pr_title = pull_request.get("title")
                existing_activity = db.query(Activity).filter(Activity.id == pr_node_id).first()
                
                try:
                    if not existing_activity:
                        activity = Activity(id=pr_node_id, title=pr_title, description=analysis, points=int(score), user_id=user_id, status="completed")
                        db.add(activity)
                    else:
                        existing_activity.description = analysis
                        existing_activity.points = int(score)
                        existing_activity.status = "completed"
                    db.commit()
                    print(f"    Activity for PR #{pr_number} saved/updated successfully.")
                except Exception as e:
                    db.rollback()
                    print(f"    Error saving/updating activity for PR #{pr_number}: {e}")

                # 记录评分条目
                try:
                    entry = ScoreEntry(id=str(uuid4()), user_id=user_id, activity_id=pr_node_id, criteria_id=None, score=int(score), factors={"analysis": analysis}, notes="AI 自动评分")
                    db.add(entry)
                    db.commit()
                    print(f"    Score entry for PR #{pr_number} saved successfully.")
                except Exception as e:
                    db.rollback()
                    print(f"    Error saving score entry for PR #{pr_number}: {e}")

                print(f"    AI scored PR #{pr_number}: {score}")

        else:
            print("  Received pull_request event but missing pull_request or repository data.")
    elif x_github_event == "ping":
        # GitHub 在设置 Webhook 后会发送一个 "ping" 事件来测试连接
        print("  Successfully received ping event from GitHub!")
    else:
        print(f"  Unhandled event type: {x_github_event}")

    # GitHub 期望你的服务器返回 200 OK 状态码
    return Response(status_code=200)
