# backend/app/api/webhook.py
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Header, Response
from typing import Optional

from app.core.config import settings

router = APIRouter(prefix="/api/webhook", tags=["webhook"])
GITHUB_WEBHOOK_SECRET = settings.GITHUB_WEBHOOK_SECRET  # 替换为你在GitHub设置的密钥


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
    x_github_event: str = Header(..., alias="X-GitHub-Event"), # 获取事件类型
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256") # GitHub 新版签名
):
    """
    接收并处理来自 GitHub 的 Webhook 请求。
    """
    if x_hub_signature_256:
        await verify_signature(request, x_hub_signature_256)
    else:
        # 如果没有签名头，则取决于你的安全策略。
        # 对于生产环境，强烈建议始终要求签名。
        print("Warning: X-Hub-Signature-256 header not found. Skipping signature verification.")
        # raise HTTPException(status_code=403, detail="Missing X-Hub-Signature-256 header")

    payload = await request.json()

    print(f"Received GitHub event: {x_github_event}")
    # print(f"Payload: {payload}") # 在生产环境中，避免打印整个payload，因为它可能很大且包含敏感信息

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

            # 在这里添加你的业务逻辑
            # 例如：
            # - 将 PR 数据保存到数据库
            # - 触发 CI/CD 流程
            # - 发送通知 (邮件, Slack, Teams)
            # - 更新前端界面
            if action == "opened":
                print(f"    New pull request opened!")
            elif action == "closed":
                if pull_request.get("merged"):
                    print(f"    Pull request merged!")
                else:
                    print(f"    Pull request closed without merging.")
            elif action == "reopened":
                print(f"    Pull request reopened!")
            # 更多 action 类型请参考 GitHub Webhook 文档
            # https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request

        else:
            print("  Received pull_request event but missing pull_request or repository data.")
    elif x_github_event == "ping":
        # GitHub 在设置 Webhook 后会发送一个 "ping" 事件来测试连接
        print("  Successfully received ping event from GitHub!")
    else:
        print(f"  Unhandled event type: {x_github_event}")

    # GitHub 期望你的服务器返回 200 OK 状态码
    return Response(status_code=200)
