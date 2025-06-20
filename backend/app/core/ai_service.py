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
    prompt = f"""你是一位资深软件工程师，以进行深入、严格且富有建设性的代码审查而闻名。你的目标是帮助团队提升代码质量，而不仅仅是评分。
请分析以下 GitHub Pull Request 的代码 diff。你的分析需要全面，并且以 JSON 格式返回，包含以下字段：
- `overall_score`: 综合评分 (0-10 之间的浮点数)。
- `dimensions`: 一个对象，包含以下维度的评分 (0-10 之间的浮点数)：
  - `code_quality`: 代码质量（评估代码的可读性、简洁性、是否遵循最佳实践、以及错误处理的健壮性）。
  - `innovation`: 创新性（评估解决方案的新颖性或解决问题的巧妙程度）。
  - `documentation_completeness`: 文档完整性（检查代码注释、README 更新等是否清晰、完整）。
  - `performance_optimization`: 性能优化（关注代码的效率、资源使用）。
  - `test_coverage`: 测试覆盖率（**附加分项**，见下文说明）。
- `suggestions`: 一个数组，包含具体的、可执行的评估意见。每个意见对象包含：
  - `type`: 意见类型 ('positive', 'neutral', 'negative', 'suggestion')。
  - `content`: 意见的具体内容，如果适用，请提供代码示例。

--- 评分和建议指南 ---
1. **评分原则**: 评分必须严格。优秀的、堪称典范的代码才能获得 9-10 分。大多数不错的 PR 应该在 6-8 分之间。有明显问题的代码应该得到 5 分或更低。你的目标是拉开分数差距，以反映真实的代码质量差异。
2. **测试覆盖率**: 这是一个**附加分项**。如果 PR 包含了全面、有效的测试，请在此项上给予高分（最高 10 分）。如果**没有**测试，**此项得分为 0**，但这**不应**显著拉低 `overall_score`。`overall_score` 应主要基于其他核心维度。
3. **建议质量**: 提供的建议必须是**具体、可执行的**。不要说"代码可以更清晰"，而要指出**哪一行**、**哪个函数**可以如何重构，并尽可能给出代码示例。

--- 开始分析 ---
```diff
{diff_text}
```"""
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
        raise ValueError(f"无法从 GitHub 获取 PR diff。请检查网络连接或 GitHub 访问权限。错误详情: {e}")
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