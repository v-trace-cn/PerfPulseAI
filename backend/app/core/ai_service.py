import os
import openai
import json
import requests
from openai import OpenAI
from sqlalchemy.orm import Session
from app.core.config import Settings
from app.models.pull_request import PullRequest
from app.models.activity import Activity


DOUBAO_MODEL=Settings.DOUBAO_MODEL
DOUBAO_API_KEY=Settings.DOUBAO_API_KEY
DOUBAO_URLS=Settings.DOUBAO_URLS

def analyze_pr_diff(diff_text: str) -> dict:
    """
    调用 AI API 对 PR diff 文本进行分析和评分，返回包含 score（评分）和 analysis（分析理由）的字典。
    """
    # 构造提示信息，让模型返回 JSON 格式结果
    prompt = (
        "你是一个代码审查专家。" 
        "请分析以下 GitHub Pull Request 的代码 diff，并从 0 到 10 进行评分。" 
        "评分标准基于代码质量、创新性、文档完整性、测试覆盖率和性能优化。" 
        "返回一个 JSON 格式的结果，包含以下字段：" 
        "- `overall_score`: 综合评分 (0-10 之间的浮点数)。" 
        "- `dimensions`: 一个对象，包含以下维度的评分 (0-10 之间的浮点数)：" 
        "  - `code_quality`: 代码质量。" 
        "  - `innovation`: 创新性。" 
        "  - `documentation_completeness`: 文档完整性。" 
        "  - `test_coverage`: 测试覆盖率。" 
        "  - `performance_optimization`: 性能优化。" 
        "  - `suggestions`: 一个数组，包含 AI 评估意见。每个意见是一个对象，包含：" 
        "  - `type`: 意见类型 ('positive', 'neutral', 'negative'，或表示建议的类型如 'suggestion')。" 
        "  - `content`: 意见的具体内容（字符串）。" 
        "请确保所有的评分都在 0 到 10 之间。" 
        f"\n\n```diff\n{diff_text}\n```"
    )
    try:
        client = OpenAI(
            api_key=DOUBAO_API_KEY, 
            base_url=DOUBAO_URLS,
        )

        completion = client.chat.completions.create(
            model=DOUBAO_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的代码审查助手。"},
                {"role": "user", "content": prompt}
            ],
        )
        content = completion.choices[0].message.content
        print(content)
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"AI 分析 PR 失败: {e}")
        return {"overall_score": 0, "dimensions": {}, "suggestions": [{"type": "negative", "content": f"AI 分析失败: {e}"}]}

def trigger_pr_analysis(db: Session, pr_node_id: str):
    """
    触发指定 PR 的 AI 分析并更新数据库。
    """
    pr = db.query(PullRequest).filter(PullRequest.pr_node_id == pr_node_id).first()
    if not pr:
        raise ValueError(f"Pull Request with node ID {pr_node_id} not found.")

    if not pr.diff_url:
        raise ValueError(f"Pull Request {pr_node_id} does not have a diff URL.")

    try:
        response = requests.get(pr.diff_url)
        response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
        diff_content = response.text
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to fetch diff from {pr.diff_url}: {e}")

    try:
        ai_analysis_result = analyze_pr_diff(diff_content)
        
        pr.score = ai_analysis_result.get("overall_score")
        pr.analysis = json.dumps(ai_analysis_result) # 将字典转换为 JSON 字符串保存

        # 更新关联的 Activity
        activity = db.query(Activity).filter(Activity.id == pr_node_id).first()
        if activity:
            activity.score = pr.score
            activity.analysis = pr.analysis
            activity.status = "completed" # 假设分析完成后状态变为 completed

        db.commit()
        db.refresh(pr) # 刷新 PR 对象以获取最新的数据
        if activity:
            db.refresh(activity)
        
        return ai_analysis_result
    except Exception as e:
        db.rollback() # 出现异常时回滚
        print(f"Error during AI analysis and DB update for PR {pr_node_id}: {e}")
        raise 