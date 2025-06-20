import os
import openai
import json
import httpx
import certifi
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

async def perform_pr_analysis(pr_node_id: str, diff_url: str) -> dict:
    """
    执行指定 PR 的 AI 分析，不触及数据库。
    """
    if not diff_url:
        raise ValueError(f"Pull Request {pr_node_id} does not have a diff URL.")

    diff_content = ""
    try:
        headers = {
            "User-Agent": "PerfPulseAI-Bot/1.0 (https://github.com/v-trace-cn/PerfPulseAI)",
            "Accept": "application/vnd.github.v3.diff"
        }
        async with httpx.AsyncClient(verify=certifi.where()) as client:
            response = await client.get(diff_url, headers=headers, follow_redirects=True)
            response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
            diff_content = response.text
    except httpx.RequestError as e:
        raise ValueError(f"Failed to fetch diff from {diff_url}: {e}")
    except Exception as e:
        # Catch any other unexpected errors during the fetch operation
        raise ValueError(f"An unexpected error occurred while fetching diff from {diff_url}: {e}")

    try:
        ai_analysis_result = analyze_pr_diff(diff_content)
        return ai_analysis_result
    except Exception as e:
        print(f"Error during AI analysis for PR {pr_node_id}: {e}")
        raise 
    
def calculate_points_from_analysis(analysis_result: dict) -> dict:
    """
    根据 AI 分析结果，调用 AI 模型判断应授予的积分。
    """

    # 构造一个新的 Prompt，专注于根据分析结果计算积分
    prompt = (
        "你是一位专业的绩效评估顾问。你的任务是根据为你提供的绩效分析报告，公正地为员工的工作成果评定积分。"
        "请仔细阅读以下分析结果，它包含了对某项工作成果的总体评分以及多个维度的详细评分。"
        "根据这份分析，请决定应授予的总积分（0-10分），并为分析报告中提到的每一个维度都评定相应的详细积分。"
        "最终返回一个 JSON 对象，包含以下字段："
        "- `total_points`: 基于整体表现计算出的总积分（整数）。"
        "- `detailed_points`: 一个对象，其中包含分析报告中每个维度的详细积分。对象的键（key）应该与分析报告中的维度名称完全一致，值（value）为该维度对应的积分（整数）。"
        "请确保所有积分都是整数，并且详细积分的总和应与总积分大致相符。"
        f"\n\n分析结果:\n```json\n{json.dumps(analysis_result, indent=2, ensure_ascii=False)}\n```"
    )

    try:
        client = OpenAI(
            api_key=DOUBAO_API_KEY, 
            base_url=DOUBAO_URLS,
        )

        completion = client.chat.completions.create(
            model=DOUBAO_MODEL,
            messages=[
                {"role": "system", "content": "你是一个专业的积分评估助手，请根据提供的分析结果给出一个合理的积分。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2, # 降低随机性，使积分更稳定
        )
        content = completion.choices[0].message.content
        points_data = json.loads(content)
        
        total_points = int(points_data.get("total_points", 0))
        detailed_points = points_data.get("detailed_points", {})
        
        # 确保 detailed_points 中的值是整数
        for key, value in detailed_points.items():
            detailed_points[key] = int(value)

        return {"total_points": total_points, "detailed_points": detailed_points}
    except Exception as e:
        print(f"根据分析结果计算积分失败: {e}")
        # 如果计算失败，返回默认值
        return {"total_points": 0, "detailed_points": {}} 