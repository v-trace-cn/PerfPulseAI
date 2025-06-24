import os
import openai
import json
import httpx
import certifi
from openai import OpenAI
from app.core.config import Settings
from app.models.pull_request import PullRequest


DOUBAO_MODEL=Settings.DOUBAO_MODEL
DOUBAO_API_KEY=Settings.DOUBAO_API_KEY
DOUBAO_URLS=Settings.DOUBAO_URLS

def analyze_pr_diff(diff_text: str, additions: int = None, deletions: int = None) -> dict:
    """
    调用 AI API 对 PR diff 文本进行分析和评分，返回包含 score（评分）和 analysis（分析理由）的字典。
    """
    # 构造提示信息，让模型返回 JSON 格式结果
    extra_info = ""
    if additions is not None and deletions is not None:
        extra_info = f"本次 PR 新增了 {additions} 行代码，删除了 {deletions} 行代码。请结合代码行数变化，综合分析和评分。\n"
    prompt = f"""你是公司资深的技术领头人以及代码架构师，对代码有着严苛要求且极具洞察力，通过深度且高质量的代码审查提升代码品质是你的首要任务，深知高质量代码和团队成长同等重要，要借此机会指导团队成员提升技术水平，使团队共同进步。
请深入理解工程师本次修改的目的，哪怕只是无实质优化，也要给出优化建议,多多提出建议。
{extra_info}请深入剖析以下 GitHub Pull Request 的代码 diff。你的分析必须全面而详实，以 JSON 格式呈现，包含以下字段：
- summary: 简要概述 PR 的优点和主要问题，突出关键。
- pr_type: PR 类型，字符串，从 'substantial'（有实质内容优化）和 'format_only'（仅格式/空格/注释/文档/无用内容删除等无实质内容优化）中选择。
- overall_score: 综合评分（0-10 之间的浮点数），严格依据代码质量、可维护性、安全性、性能优化、创新性、可观测性等多维度考量得出。
- dimensions: 对象，涵盖以下维度评分（0-10 之间浮点数）：
  - code_quality: 代码质量（可读性、简洁性、遵循最佳实践、错误处理完善度）。
  - maintainability: 可维护性（代码可扩展性、模块化程度、与现有架构契合度）。
  - security: 安全性（有无潜在安全漏洞，如注入风险、XSS 隐患、硬编码密钥等）。
  - performance_optimization: 性能优化（代码执行效率、资源占用合理性）。
  - innovation: 创新性（是否引入新功能、独特的算法、技术突破等）。
  - observability: 可观测性（监控机制、日志质量、指标完善性、追踪效果等）。
- bonus_points（对象，可选，附加分项，0-10 分）：PR 在文档完整性、测试覆盖率、CI/CD 自动化质量等有显著改进，可在相应 bonus 维度上给分；若无体现则对应维度为 0，对综合评分影响较小。
  - `documentation_completeness`: 文档完整性（代码注释、README、API 文档、架构图等）。
  - `test_coverage`: 测试覆盖率（单元/集成/端到端测试）。
  - `ci_cd_quality`: CI/CD 自动化质量（流水线流畅度、静态检查有效性、自动部署稳定性等）。

- suggestions: 建议数组，包含丰富且实用的建议。每个建议对象需具备：
  - file_path: 文件路径（string）。
  - line_range: 相关代码行号范围，如 [10, 15]（int 数组）。
  - severity: 严重程度（'critical', 'major', 'minor', 'suggestion'）。
  - growth_value: 成长价值（'high', 'medium', 'low'），突出哪些建议最值得学习
  - type: 意见类型（'positive', 'negative', 'question'）。
  - title: 简短概括该建议（string）。
  - content: 具体内容，问题分析/优点总结, 详细阐述修改原因，并给出优化后的代码示例，使开发者能直接借鉴应用。

--- 评分和建议指南 ---
1. 评分必须严格且有区分度：9-10 分仅授予设计精良、近乎完美的代码；良好 PR 通常在 6-8 分；存在明显问题的代码不超 5 分。
2. 格式/内容类限制：若 PR 仅涉及格式调整等无实质优化，`pr_type` 设为 'format_only'，`overall_score` 最高 2 分，`summary` 和 `suggestions` 必须解释清楚原因。
3. 附加分项（bonus_points）：在文档、测试覆盖率、CI/CD、可观测性等有显著提升，对应 bonus 维度高分；未体现则为 0，不影响主维度综合得分。
4. 建议质量：
    - 具体：精准定位文件和行号。
    - 可执行：提供清晰修改方案和代码示例。
    - 有深度：挖掘潜在 bug、性能瓶颈、安全风险、架构问题等。
    - 正面反馈：发现优秀设计、巧妙实现或值得称赞代码时，通过 `type: 'positive'` 给予肯定。

--- 开始分析 ---
```diff
{diff_text}
```
"""
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
        # 将行数变化加入返回结果
        if additions is not None and deletions is not None:
            result["additions"] = additions
            result["deletions"] = deletions
        return result
    except Exception as e:
        print(f"AI 分析 PR 失败: {e}")
        raise ValueError(f"AI 分析 PR 失败: {e}")

async def perform_pr_analysis(pr: PullRequest) -> dict:
    """
    执行指定 PR 的 AI 分析，不触及数据库。
    """
    owner, repo_name = pr.repository.split('/')
    pr_number = pr.pr_number

    github_api_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}/files"
    github_pr_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}"

    diff_content = ""
    additions = None
    deletions = None
    try:
        print(f"正在通过 GitHub API 获取 PR 文件列表，URL: {github_api_url}")
        headers = {
            "User-Agent": "PerfPulseAI-Bot/1.0 (https://github.com/v-trace-cn/PerfPulseAI)",
            "Accept": "application/vnd.github.v3+json"
        }

        github_pat = Settings.GITHUB_PAT
        if github_pat:
            print(f"Debug: Loaded GITHUB_PAT (first 5 and last 5 chars): {github_pat[:5]}...{github_pat[-5:]}")
            headers["Authorization"] = f"token {github_pat}"

        print(f"Debug: Sending HTTP request to GitHub API with headers: {headers}")

        async with httpx.AsyncClient(verify=False) as client:
            response = await client.get(github_api_url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            files_data = response.json()
            for file in files_data:
                if 'patch' in file and file['patch']:
                    diff_content += file['patch'] + "\n"
            # 获取 PR 详情，统计行数变化
            pr_response = await client.get(github_pr_url, headers=headers, follow_redirects=True)
            pr_response.raise_for_status()
            pr_data = pr_response.json()
            additions = pr_data.get("additions")
            deletions = pr_data.get("deletions")

    except httpx.RequestError as e:
        raise ValueError(f"无法从 GitHub API 获取 PR 文件列表。请检查网络连接或 GitHub 访问权限。错误详情: {e}")
    except httpx.HTTPStatusError as e:
        print(f"Debug: Received HTTP status error {e.response.status_code} for URL {e.request.url}")
        print(f"Debug: Response headers: {e.response.headers}")
        print(f"Debug: Response body: {e.response.text}")
        raise ValueError(f"无法从 GitHub API 获取 PR 文件列表。请检查网络连接或 GitHub 访问权限。错误详情: {e}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred while fetching diff from GitHub API: {e}")

    if not diff_content:
        print(f"Warning: No diff content found for PR {pr_number} in repository {pr.repository}.")
        raise ValueError(f"No diff content found for Pull Request {pr.pr_number} in repository {pr.repository}.")

    try:
        ai_analysis_result = analyze_pr_diff(diff_content, additions, deletions)
        return ai_analysis_result
    except Exception as e:
        print(f"Error during AI analysis for PR {pr.pr_node_id}: {e}")
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
            temperature=0.2,
        )
        content = completion.choices[0].message.content
        points_data = json.loads(content)
        
        total_points = int(points_data.get("total_points", 0))
        detailed_points = points_data.get("detailed_points", {})
        
        for key, value in detailed_points.items():
            detailed_points[key] = int(value)

        return {"total_points": total_points, "detailed_points": detailed_points}
    except Exception as e:
        print(f"根据分析结果计算积分失败: {e}")
        return {"total_points": 0, "detailed_points": {}} 