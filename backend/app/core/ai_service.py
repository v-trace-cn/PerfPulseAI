import os
import openai
import json
from app.core.config import Settings

# 从环境变量或 settings 中获取 OpenAI API Key
# 如果豆包模型兼容 OpenAI API，可以使用 api_base 和 api_key
openai.api_key = Settings.DOUBAO_API_KEY or os.getenv("OPENAI_API_KEY")
if Settings.DOUBAO_API_BASE:
    openai.api_base = Settings.DOUBAO_API_BASE


def analyze_pr_diff(diff_text: str) -> dict:
    """
    调用 AI API 对 PR diff 文本进行分析和评分，返回包含 score（评分）和 analysis（分析理由）的字典。
    """
    # 构造提示信息，让模型返回 JSON 格式结果
    prompt = (
        "你是一个代码审查专家。" \
        "请分析以下 GitHub Pull Request 的代码 diff，并从 0 到 100 进行评分，" \
        "评分标准基于代码质量、可读性、逻辑正确性和最佳实践。" \
        "返回 JSON 格式，包含两个字段: score（数值）和 analysis（简要说明评分理由）。" \
        f"\n\n```diff\n{diff_text}\n```"
    )
    try:
        response = openai.ChatCompletion.create(
            model="doubao",
            messages=[
                {"role": "system", "content": "你是一个专业的代码审查助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=512,
        )
        content = response.choices[0].message.content.strip()
        # 解析 JSON
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"AI 分析 PR 失败: {e}")
        return {"score": 0, "analysis": f"AI 分析失败: {e}"} 