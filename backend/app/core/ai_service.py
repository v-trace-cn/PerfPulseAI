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
    # extra_info = ""
    # if additions is not None and deletions is not None:
    #     extra_info = f"本次 PR 新增了 {additions} 行代码，删除了 {deletions} 行代码。请结合代码行数变化，综合分析和评分。\n"
    # prompt = f"""你是公司的技术负责人和代码架构师，以进行深入、严格且极富洞察力的代码审查而闻名。你的目标不仅仅是提升代码质量，更是通过代码审查来指导和提升团队成员的技术能力。\n{extra_info}请详细分析以下 GitHub Pull Request 的代码 diff。你的分析需要非常全面，并且以 JSON 格式返回，包含以下字段：
    prompt = f"""你是公司的技术负责人和代码架构师，以进行深入、严格且极富洞察力的代码审查而闻名。你的目标不仅仅是提升代码质量，更是通过代码审查来指导和提升团队成员的技术能力。\n你的分析需要非常全面，并且以 JSON 格式返回，包含以下字段：
- `summary`: 一个简短的总体摘要，高亮PR的优点和主要需要改进的地方。
- `pr_type`: PR 类型，字符串，仅能为以下之一：'substantial'（有实质内容优化）、'format_only'（仅格式/空格/注释/文档/无用内容删除等无实质内容优化）。
- `overall_score`: 综合评分 (0-10 之间的浮点数)。
- `dimensions`: 一个对象，包含以下维度的评分 (0-10 之间的浮点数)：
  - `code_quality`: 代码质量（可读性、简洁性、最佳实践、错误处理）。
  - `maintainability`: 可维护性（代码的可扩展性、模块化、是否遵循现有架构）。
  - `security`: 安全性（是否存在潜在的安全漏洞，如注入、XSS、硬编码密钥等）。
  - `performance_optimization`: 性能优化（代码效率、资源使用）。
  - `documentation_completeness`: 文档完整性（代码注释、README、API文档等）。
  - `test_coverage`: 测试覆盖率（**附加分项**，见下文说明）。
- `suggestions`: 一个建议数组。每个建议对象需包含：
  - `file_path`: 文件路径 (string)。
  - `line_range`: 相关代码的行号范围，如 `[10, 15]` (array of int)。
  - `severity`: 严重程度 ('critical', 'major', 'minor', 'suggestion')。
  - `type`: 意见类型 ('positive', 'negative', 'question')。
  - `title`: 对该建议的简短概括 (string)。
  - `content`: 意见的具体内容，必须详细解释"为什么"这样修改会更好，并附上优化后的代码示例。

--- 评分和建议指南 ---
1.  **评分原则**: 评分必须严格且有区分度。9-10分是留给那些设计精良、堪称典范的代码。大部分良好的PR应在6-8分。有明显问题的代码则在5分或以下。
2.  **格式/内容类限制**: 如果该 PR 仅涉及格式调整、空格、注释、文档、无用内容删除等（即无实质功能/性能/架构/逻辑优化），请将 `pr_type` 设为 'format_only'，并且 `overall_score` 最高不得超过2分。务必在 `summary` 和至少一条 `suggestion` 中说明原因。
3.  **测试覆盖率**: 这是一个**附加分项**。如果 PR 包含了全面、有效的测试，请在此项上给予高分。如果**没有**测试，**此项得分为 0**，但这**不应**显著拉低 `overall_score`。
4.  **建议质量**: 建议是审查的核心。
    - **必须具体**: 指明具体的文件和行号。
    - **必须可执行**: 提供清晰的修改方案和代码示例。
    - **必须有深度**: 不仅是表面问题，更要关注潜在的bug、性能瓶颈、安全风险和架构坏味道。
    - **正面反馈**: 当你发现优秀的设计、巧妙的实现或值得称赞的代码时，请务必在 `suggestions` 中添加 `type: 'positive'` 的反馈，这对于激励开发者同样重要。

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
        raise ValueError(f"AI 分析 PR 失败: {e}")

async def perform_pr_analysis(pr: PullRequest) -> dict:
    """
    执行指定 PR 的 AI 分析，不触及数据库。
    """
    owner, repo_name = pr.repository.split('/')
    pr_number = pr.pr_number

    github_api_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}/files"

    diff_content = ""
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
        ai_analysis_result = analyze_pr_diff(diff_content)
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