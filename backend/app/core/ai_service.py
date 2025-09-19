import asyncio
import json
import re
import time
from functools import wraps

import httpx
from app.core.config import Settings
from app.core.logging_config import logger
from app.models.pull_request import PullRequest

DOUBAO_MODEL=Settings.DOUBAO_MODEL
DOUBAO_API_KEY=Settings.DOUBAO_API_KEY
DOUBAO_URLS=Settings.DOUBAO_URLS

_httpx_client = None
_openai_client = None

async def get_httpx_client():
    """获取或创建全局 httpx AsyncClient 实例."""
    global _httpx_client
    if _httpx_client is None:
        _httpx_client = httpx.AsyncClient(verify=False)
    return _httpx_client

def get_openai_client():
    """获取或创建全局 AsyncOpenAI 客户端实例."""
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI
        _openai_client = AsyncOpenAI(api_key=DOUBAO_API_KEY, base_url=DOUBAO_URLS)
    return _openai_client

def timeit(func):
    if asyncio.iscoroutinefunction(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            result = await func(*args, **kwargs)
            elapsed = time.time() - start
            logger.info(f"{func.__name__} executed in {elapsed:.2f}s")
            return result
        return wrapper
    else:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            logger.info(f"{func.__name__} executed in {elapsed:.2f}s")
            return result
        return wrapper

def parse_unified_diff(patch_text: str):
    """将 unified diff 文本解析为结构化数据。
    返回: List[dict]，每个 dict 包含:
      - file_path: 文件相对路径
      - added_lines: List[List[int]]   每个 hunk 的新增行号列表
      - added_code: List[str]          每个 hunk 的新增代码（多行字符串）
      - deleted_lines: List[List[int]] 每个 hunk 的删除行号列表
      - deleted_code: List[str]        每个 hunk 的删除代码（多行字符串）.
    """
    result = []
    current_file_entry = None
    added_lines: list[int] = []
    added_code: list[str] = []
    deleted_lines: list[int] = []
    deleted_code: list[str] = []

    # 更宽松的文件路径正则，兼容 `+++ b/path`、`+++ /dev/null` 等
    file_path_re = re.compile(r'^\+\+\+\s*(?:b/)?(.+)$')
    hunk_header_re = re.compile(r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@')

    old_line_no = new_line_no = 0

    def flush_hunk():
        nonlocal added_lines, added_code, deleted_lines, deleted_code
        if current_file_entry and (added_code or deleted_code):
            current_file_entry["added_lines"].append(added_lines)
            current_file_entry["added_code"].append("\n".join(added_code))
            current_file_entry["deleted_lines"].append(deleted_lines)
            current_file_entry["deleted_code"].append("\n".join(deleted_code))
        # 重置
        added_lines, added_code, deleted_lines, deleted_code = [], [], [], []

    lines = patch_text.splitlines()
    for line in lines:
        if line.startswith("diff --git"):
            # 保存前一个文件
            flush_hunk()
            if current_file_entry:
                result.append(current_file_entry)
            current_file_entry = None
            continue
        if line.startswith("+++ "):
            m = file_path_re.match(line)
            if m:
                flush_hunk()
                if current_file_entry:
                    result.append(current_file_entry)
                current_file_entry = {
                    "file_path": m.group(1),
                    "added_lines": [],
                    "added_code": [],
                    "deleted_lines": [],
                    "deleted_code": [],
                }
            continue
        if line.startswith("@@"):
            flush_hunk()
            m = hunk_header_re.match(line)
            if m:
                old_line_no = int(m.group(1))
                new_line_no = int(m.group(2))
            continue
        if line.startswith("+"):
            if current_file_entry is not None:
                added_lines.append(new_line_no)
                added_code.append(line[1:])
                new_line_no += 1
            continue
        if line.startswith("-"):
            if current_file_entry is not None:
                deleted_lines.append(old_line_no)
                deleted_code.append(line[1:])
                old_line_no += 1
            continue
        # 上下文行
        if current_file_entry is not None:
            old_line_no += 1
            new_line_no += 1

    # 处理最后一个文件/ hunk
    flush_hunk()
    if current_file_entry:
        result.append(current_file_entry)

    return result

def compress_diff(structured_diff, max_lines: int = 50):
    """对结构化 diff 进行摘要，限制每个 hunk 的代码行数."""
    compressed = []
    for entry in structured_diff:
        new_entry = entry.copy()
        new_entry['added_code'] = []
        new_entry['deleted_code'] = []
        for code in entry.get('added_code', []):
            lines = code.split('\n')
            if len(lines) > max_lines:
                half = max_lines // 2
                lines = lines[:half] + ['...省略...'] + lines[-half:]
            new_entry['added_code'].append('\n'.join(lines))
        for code in entry.get('deleted_code', []):
            lines = code.split('\n')
            if len(lines) > max_lines:
                half = max_lines // 2
                lines = lines[:half] + ['...省略...'] + lines[-half:]
            new_entry['deleted_code'].append('\n'.join(lines))
        compressed.append(new_entry)
    return compressed

@timeit
async def pr_score_agent(structured_diff, pr_info) -> dict:
    """评分agent：全方面分析结构化diff和PR信息，输出各维度评分和理由。."""
    prompt = f"""
你是经验丰富、专业、严谨的代码评审评分专家， 能够给出最公正，诚实，客观的评分。
请根据以下结构化diff和PR信息，从代码质量、可维护性、安全性、性能优化、创新性、可观测性六个维度，给出0-10之间的整数分数，并输出JSON：
{{
  "dimensions": {{
    "code_quality": 0-10,
    "maintainability": 0-10,
    "security": 0-10,
    "performance_optimization": 0-10,
    "innovation": 0-10,
    "observability": 0-10,
  }},
  "overall_score": 0-100,
  "summary": "(在此填写一句不超过300字的清晰总结， 包含但不局限于合仓建议， 不推荐合仓要给出理由)"
}}
注意，
1. 对创新性维度请充分评估功能的新颖性、独特性或交互体验，新颖性不足时也请给出1-2分的合理低分，而非直接0分。
2. 对于无实效的修改（例如仅改变代码格式、代码文件更名、添加无意义的注释、修改非关键的变量名等），总分小于 20 分。

结构化 diff:
{json.dumps(structured_diff, ensure_ascii=False)}

PR 信息:
{json.dumps(pr_info, ensure_ascii=False)}
"""
    client = get_openai_client()
    completion = await client.chat.completions.create(
        model=DOUBAO_MODEL,
        messages=[
            {"role": "system", "content": "你是一个专业的代码评分助手。"},
            {"role": "user", "content": prompt}
        ],
    )
    content = completion.choices[0].message.content

    # 尝试提取完整的JSON对象
    json_match = re.search(r'(?s)\{.*\}', content)
    if json_match:
        json_string = json_match.group(0)
    else:
        json_string = content # Fallback, though likely to fail

    try:
        result = json.loads(json_string)
    except json.JSONDecodeError as e:
        logger.error(f"[pr_score_agent] Error decoding JSON from AI: {e}. Content: {content[:500]}...")
        # 返回一个包含错误信息的默认结构
        return {
            "overall_score": 0,
            "dimensions": {},
            "summary": f"AI response format error: {e}",
            "recommendation": "decline"
        }

    # 分数使用整数和综合评价
    overall_score_value = 0
    overall_summary = result.get("summary", "")

    if "overall_score" in result:
        raw_overall_score = result["overall_score"]
        if isinstance(raw_overall_score, dict):
            try:
                overall_score_value = int(raw_overall_score.get("score", 0))
                if not overall_summary:
                    overall_summary = raw_overall_score.get("reason", "") or overall_summary
            except (ValueError, TypeError):
                logger.warning(f"[pr_score_agent] Warning: overall_score dict contains invalid score: {raw_overall_score}. Setting to 0.")
                overall_score_value = 0
        else:
            try:
                overall_score_value = int(raw_overall_score)
            except (ValueError, TypeError):
                logger.warning(f"[pr_score_agent] Warning: overall_score '{raw_overall_score}' is not an integer. Setting to 0.")
                overall_score_value = 0

    result["overall_score"] = overall_score_value
    result["summary"] = overall_summary

    innovation_score_value = 0
    if "dimensions" in result and isinstance(result["dimensions"], dict):
        processed_dimensions = {}
        for dim_key, dim_val in result["dimensions"].items():
            score_to_set = 0
            if isinstance(dim_val, dict):
                if "score" in dim_val:
                    try:
                        score_to_set = int(dim_val["score"])
                    except (ValueError, TypeError):
                        logger.warning(f"[pr_score_agent] Warning: dimension '{dim_key}' score dict contains invalid score: {dim_val}. Setting to 0.")
            elif isinstance(dim_val, (int, float)):
                try:
                    score_to_set = int(dim_val)
                except (ValueError, TypeError):
                    logger.warning(f"[pr_score_agent] Warning: dimension '{dim_key}' value '{dim_val}' is not an integer. Setting to 0.")
            else:
                logger.warning(f"[pr_score_agent] Warning: dimension '{dim_key}' has unexpected type: {type(dim_val)}. Setting to 0.")

            # 存储所有维度分数，包括 innovation
            processed_dimensions[dim_key] = {"score": score_to_set}
            # 单独记录创新性分数
            if dim_key == 'innovation':
                innovation_score_value = score_to_set

        result["dimensions"] = processed_dimensions

    result["innovation_score"] = innovation_score_value
    return result

@timeit
async def pr_suggestion_agent(structured_diff, pr_info) -> list:
    """建议agent：针对所有结构化diff片段，进行单次AI调用，给出综合建议列表。."""
    combined_diff_content = ""
    for idx, diff_item in enumerate(structured_diff):
        combined_diff_content += f"""
--- 代码片段 {idx + 1} ---
文件: {diff_item['file_path']}
新增代码:
```
{diff_item['added_code']}
```
删除代码:
```
{diff_item['deleted_code']}
```
"""

    # 使用统一的提示词进行单次 AI 调用
    prompt = f"""
你是专业的代码优化建议专家。这些建议要像是一位经验丰富、善于分享的超级优秀的老程序员给出的，通俗易懂且能切实帮助我提升个人能力。
每个维度要给出 1-10 条建议。
请针对以下所有代码变更片段，从代码质量、可维护性、安全性、性能优化、创新性、可观测性六个维度，全面分析，指出优点和不足，给出具体可执行的重要建议。
每条建议必须是一个JSON对象，包含以下字段：
- "主要维度": 建议所属的主要维度（例如 "代码质量"）。
- "类型": 建议的类型（"positive", "negative", "question"）。
- "简要标题": 建议的简要标题。
- "详细内容": 建议的详细内容。
- "file_path": 该建议所针对的代码片段的文件路径。

将所有建议合并为一个JSON数组返回。

PR信息:
{json.dumps(pr_info, ensure_ascii=False)}

以下是所有代码变更片段：
{combined_diff_content}
"""

    client = get_openai_client()
    completion = await client.chat.completions.create(
        model=DOUBAO_MODEL,
        messages=[
            {"role": "system", "content": "你是一个专业的代码优化建议专家。请严格按照要求返回JSON数组，确保每条建议包含指定字段，尤其是'file_path'。"},
            {"role": "user", "content": prompt}
        ],
    )
    content = completion.choices[0].message.content

    # 尝试提取完整的JSON数组
    json_match = re.search(r'(?s)\[.*\]', content)
    if json_match:
        json_string = json_match.group(0)
    else:
        json_string = content # Fallback, though likely to fail

    try:
        suggestions = json.loads(json_string)
        if not isinstance(suggestions, list):
            suggestions = [suggestions] # Wrap single object in a list if necessary
    except json.JSONDecodeError as e:
        logger.error(f"[pr_suggestion_agent] Error decoding JSON from AI: {e}. Content: {content[:500]}...")
        suggestions = []
    except Exception as e:
        logger.error(f"[pr_suggestion_agent] Unexpected error during suggestion parsing: {e}. Content: {content[:500]}...")
        suggestions = []

    final_suggestions = []
    for s in suggestions:
        if isinstance(s, dict) and 'file_path' in s:
            final_suggestions.append(s)
        else:
            logger.warning(f"[pr_suggestion_agent] Warning: Malformed suggestion received: {s}. Skipping.")

    return final_suggestions

@timeit
async def perform_pr_analysis(pr: PullRequest) -> dict:
    """执行指定 PR 的 AI 分析，不触及数据库。."""
    logger.info(f"[perform_pr_analysis] 开始执行 PR 分析 for PR {pr.pr_node_id}")
    owner, repo_name = pr.repository.split('/')
    pr_number = pr.pr_number

    github_api_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}/files"
    github_pr_url = f"https://api.github.com/repos/{owner}/{repo_name}/pulls/{pr_number}"

    diff_content = ""
    additions = None
    deletions = None
    try:
        headers = {
            "User-Agent": "PerfPulseAI-Bot/1.0 (https://github.com/v-trace-cn/PerfPulseAI)",
            "Accept": "application/vnd.github.v3+json"
        }
        github_pat = Settings.GITHUB_PAT
        if github_pat:
            headers["Authorization"] = f"token {github_pat}"
        logger.debug(f"[perform_pr_analysis] 尝试并行获取 GitHub diff 和 PR 信息。API URLs: {github_api_url}, {github_pr_url}")
        client = await get_httpx_client()
        files_task = client.get(github_api_url, headers=headers, follow_redirects=True)
        pr_task = client.get(github_pr_url, headers=headers, follow_redirects=True)
        files_response, pr_response = await asyncio.gather(files_task, pr_task)

        files_response.raise_for_status()
        pr_response.raise_for_status()

        files_data = json.loads(files_response.text)
        if not isinstance(files_data, list):
            raise ValueError("GitHub API did not return a list of files.")
        logger.debug(f"[perform_pr_analysis] 从 GitHub 获取到 {len(files_data)} 个文件数据。")
        for file in files_data:
            if isinstance(file, dict) and 'patch' in file and file['patch']:
                filename = file.get('filename') or file.get('previous_filename') or 'unknown_file'
                diff_content += f"+++ b/{filename}\n"
                diff_content += file['patch'] + "\n"
        logger.debug(f"[perform_pr_analysis] diff_content 构造完成，长度: {len(diff_content)}。")

        pr_data = json.loads(pr_response.text)
        additions = pr_data.get("additions")
        deletions = pr_data.get("deletions")
        logger.debug(f"[perform_pr_analysis] PR 信息获取完成。Additions: {additions}, Deletions: {deletions}")

    except Exception as e:
        logger.error(f"[perform_pr_analysis] 从 GitHub API 获取 diff 或 PR 信息时发生错误: {e}")
        import traceback
        traceback.print_exc()
        raise ValueError(f"An unexpected error occurred while fetching diff from GitHub API: {e}")

    if not diff_content:
        logger.warning(f"[perform_pr_analysis] No diff content for PR {pr.pr_node_id}, skipping analysis.")
        return {
            "overall_score": 0,
            "dimensions": {},
            "suggestions": [],
            "points": {"total_points": 0, "detailed_points": {}},
            "additions": 0,
            "deletions": 0,
            "summary": "No diff content found for this Pull Request."
        }

    # 结构化diff
    structured_diff = parse_unified_diff(diff_content)
    logger.debug(f"[perform_pr_analysis] 结构化 diff 完成。文件数量: {len(structured_diff)}。")

    # 智能摘要 diff
    compressed_diff = compress_diff(structured_diff)
    logger.debug(f"[perform_pr_analysis] diff 已压缩，文件数: {len(compressed_diff)}")

    pr_info = {
        "title": pr.title,
        "description": pr.commit_message,
        "repository": pr.repository,
        "pr_number": pr.pr_number,
        "diff_url": pr.diff_url,
        "additions": additions,
        "deletions": deletions,
    }

    # 并行调用两个 Agent
    try:
        ai_start = time.time()
        score_task = pr_score_agent(compressed_diff, pr_info)
        suggestion_task = pr_suggestion_agent(compressed_diff, pr_info)
        score_result, suggestions = await asyncio.gather(score_task, suggestion_task)
        ai_elapsed = time.time() - ai_start
        logger.info(f"[perform_pr_analysis] AI agent calls completed in {ai_elapsed:.2f}s")


        overall_score = score_result.get("overall_score", 0)
        dimensions = score_result.get("dimensions", {})
        summary = score_result.get("summary", "No summary provided.")
        innovation_score = score_result.get("innovation_score", 0)

        # 只保留最重要的建议
        top_suggestions = _select_top_suggestions(suggestions, max_count=15)

        # 根据整体评分给出是否推荐合并
        merge_recommendation = "approve" if overall_score >= 60 else "decline"

        analysis_result = {
            "overall_score": overall_score,
            "dimensions": dimensions,
            "suggestions": top_suggestions,
            "additions": additions,
            "deletions": deletions,
            "summary": summary,
            "recommendation": merge_recommendation,
            "innovation_score": innovation_score,
        }

        # 调用积分计算 Agent，并将结果加入 analysis_result
        points_data = await calculate_points_from_analysis(analysis_result)
        analysis_result["points"] = {
            "total_points": points_data.get("total_points", 0),
            "detailed_points": points_data.get("detailed_points", {})
        }
        analysis_result["innovation_bonus"] = points_data.get("innovation_bonus", 0)

        logger.info("[perform_pr_analysis] AI 评价结果已生成")
        return analysis_result

    except Exception as e:
        logger.error(f"[perform_pr_analysis] AI 分析过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        # 如果 AI 分析失败，返回一个默认的空结果
        return {
            "overall_score": 0,
            "dimensions": {},
            "suggestions": [],
            "points": {"total_points": 0, "detailed_points": {}}, # 保持与无 diff 时一致
            "additions": additions or 0,
            "deletions": deletions or 0,
            "summary": f"AI analysis failed: {e}"
        }

@timeit
async def calculate_points_from_analysis(analysis_score_result: dict) -> dict:
    """根据 AI 评分结果来进行计算积分。.

    注意：这里计算的积分是前端展示格式，会在后续的积分服务中自动转换为后端存储格式。
    """
    # 导入积分转换器

    overall_score = analysis_score_result.get("overall_score", 0)
    innovation_score = analysis_score_result.get("innovation_score", 0)
    bonus_display = overall_score * 0.1
    innovation_bonus_display = innovation_score * 1.0

    total_points_display = bonus_display + innovation_bonus_display

    detailed_points = [
        {"bonus": round(bonus_display, 1), "text": "基础积分"},
        {"innovation_bonus": round(innovation_bonus_display, 1), "text": "创新加分"},
    ]

    # 日志最多两位小数，避免浮点尾差
    logger.info(
        f"[calculate_points_from_analysis] 积分计算完成 - 总分: {overall_score:.2f}, 创新分: {innovation_score:.2f}, 基础积分: {round(bonus_display, 2):.2f}, 创新加分: {round(innovation_bonus_display, 2):.2f}, 总积分: {round(total_points_display, 2):.2f}"
    )

    return {
        "total_points": round(total_points_display, 1),  # 前端展示格式，保留1位小数
        "detailed_points": detailed_points,
        "innovation_bonus": round(innovation_bonus_display, 1)  # 前端展示格式
    }

def _select_top_suggestions(suggestions: list[dict], max_count: int = 15) -> list[dict]:
    """根据类型优先级挑选最重要的前 max_count 条建议。."""
    def priority(s: dict):
        t = (s.get("type") or s.get("类型") or "positive").lower()
        if t in {"negative", "建议"}:  # 最高优先
            return 0
        if t == "question":
            return 1
        return 2  # positive

    sorted_sugs = sorted(suggestions, key=priority)
    # 保持维度多样性：按优先级后，去重 (维度+文件) 以避免重复
    seen_keys = set()
    filtered = []
    for s in sorted_sugs:
        key = f"{s.get('dimension') or s.get('主要维度') or s.get('维度')}_{s.get('file_path')}"
        if key not in seen_keys:
            seen_keys.add(key)
            filtered.append(s)
        if len(filtered) >= max_count:
            break
    return filtered
