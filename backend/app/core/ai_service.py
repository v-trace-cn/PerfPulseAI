import os
import openai
import json
from openai import OpenAI
from app.core.config import Settings


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
            # 将推理接入点 <Model>替换为 Model ID
            model=DOUBAO_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的代码审查助手。"},
                {"role": "user", "content": prompt}
            ],
        )
        content = completion.choices[0].message
        print(content)
        result = json.loads(content)
        return result
    except Exception as e:
        print(f"AI 分析 PR 失败: {e}")
        return {"overall_score": 0, "dimensions": {}, "suggestions": [{"type": "negative", "content": f"AI 分析失败: {e}"}]} 