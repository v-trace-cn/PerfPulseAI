import uuid

from app.core.database import get_db
from app.models.activity import Activity
from app.models.scoring import ScoreEntry, ScoringFactor
from app.models.user import User
from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/scoring", tags=["scoring"])

# Sample scoring criteria
scoring_criteria = [
    {
        "id": "1",
        "category": "代码提交",
        "description": "提交高质量的代码到仓库",
        "base_points": 10,
        "weight": 1.0
    },
    {
        "id": "2",
        "category": "代码审查",
        "description": "对他人代码进行有效审查",
        "base_points": 5,
        "weight": 0.8
    },
    {
        "id": "3",
        "category": "文档贡献",
        "description": "编写或更新项目文档",
        "base_points": 8,
        "weight": 0.7
    }
]

# Sample scoring factors
scoring_factors = [
    {
        "id": "1",
        "label": "代码质量",
        "description": "代码的质量和可维护性",
        "type": "select",
        "options": [
            {"label": "低", "value": "low"},
            {"label": "中", "value": "medium"},
            {"label": "高", "value": "high"}
        ]
    },
    {
        "id": "2",
        "label": "完成时间",
        "description": "任务完成所需的时间",
        "type": "number",
        "min": 1,
        "max": 100
    },
    {
        "id": "3",
        "label": "创新程度",
        "description": "解决方案的创新程度",
        "type": "select",
        "options": [
            {"label": "常规", "value": "standard"},
            {"label": "改进", "value": "improved"},
            {"label": "创新", "value": "innovative"}
        ]
    },
    {
        "id": "4",
        "label": "团队协作",
        "description": "是否促进了团队协作",
        "type": "checkbox"
    }
]

# 用于在前端显示维度的中文标签
DIMENSION_LABELS = {
    "code_quality": "代码质量",
    "maintainability": "可维护性",
    "security": "安全性",
    "performance_optimization": "性能优化",
    "innovation": "创新性",

    # bonus points dimensions
    "documentation_completeness": "文档完整性",
    "test_coverage": "测试覆盖率",
    "ci_cd_quality": "CI/CD 质量",
    "observability": "可观测性",
}

class ScoringResult(BaseModel):
    overall_score: float

@router.get("/dimensions")
async def get_scoring_dimensions():
    """返回评分维度的显示标签."""
    return {"data": DIMENSION_LABELS, "success": True}

@router.get("/criteria")
async def get_scoring_criteria(db: AsyncSession = Depends(get_db)):
    # 返回硬编码的评分标准，不使用数据库
    return {"data": scoring_criteria, "message": "查询成功", "success": True}

@router.get("/factors")
async def get_scoring_factors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScoringFactor))
    items = result.scalars().all()
    return {"data": [f.to_dict() for f in items], "message": "查询成功", "success": True}

@router.post("/calculate")
async def calculate_score(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    user_id = data.get("user_id")
    activity_id = data.get("activity_id")
    notes = data.get("notes", "")
    base_score = 50
    factor_values = {k: v for k, v in data.items() if k not in ["user_id", "activity_id", "notes"]}
    if factor_values.get("1") == "high":
        base_score += 20
    elif factor_values.get("1") == "medium":
        base_score += 10
    time_val = factor_values.get("2")
    if time_val:
        tv = int(time_val)
        base_score += 15 if tv < 30 else (5 if tv < 60 else 0)
    if factor_values.get("3") == "innovative":
        base_score += 25
    elif factor_values.get("3") == "improved":
        base_score += 10
    if factor_values.get("4"):
        base_score += 15

    breakdown = [
        {"category": "基础评分", "raw_score": 50, "weight": 1.0, "weighted_score": 50},
        {"category": "质量调整", "raw_score": 20 if factor_values.get("1") == "high" else (10 if factor_values.get("1") == "medium" else 0), "weight": 1.2, "weighted_score": 24 if factor_values.get("1") == "high" else (12 if factor_values.get("1") == "medium" else 0)},
        {"category": "时间效率", "raw_score": 15 if time_val and int(time_val) < 30 else (5 if time_val and int(time_val) < 60 else 0), "weight": 0.8, "weighted_score": 12 if time_val and int(time_val) < 30 else (4 if time_val and int(time_val) < 60 else 0)},
        {"category": "创新加分", "raw_score": 25 if factor_values.get("3") == "innovative" else (10 if factor_values.get("3") == "improved" else 0), "weight": 1.5, "weighted_score": 37.5 if factor_values.get("3") == "innovative" else (15 if factor_values.get("3") == "improved" else 0)},
        {"category": "团队协作", "raw_score": 15 if factor_values.get("4") else 0, "weight": 1.0, "weighted_score": 15 if factor_values.get("4") else 0},
    ]
    rounded_score = round(sum(item["weighted_score"] for item in breakdown))

    if user_id and activity_id:
        user_result = await db.execute(select(User).filter(User.id == user_id))
        user = user_result.scalars().first()
        activity_result = await db.execute(select(Activity).filter(Activity.id == activity_id))
        activity = activity_result.scalars().first()
        if user and activity:
            entry = ScoreEntry(id=str(uuid.uuid4()), user_id=user_id, activity_id=activity_id, score=rounded_score, factors=factor_values, notes=notes)
            user.points += rounded_score
            db.add(entry)
            await db.commit()

    return {"data": {"score": rounded_score, "breakdown": breakdown}, "message": "计算成功", "success": True}

@router.get("/entries")
async def get_score_entries(db: AsyncSession = Depends(get_db)):
    user_id_result = await db.execute(select(ScoreEntry.user_id))
    first_user_id = user_id_result.scalars().first()
    user_from_db_result = await db.execute(select(User).filter(User.id == first_user_id))
    user_from_db = user_from_db_result.scalars().first()

    activity_id_result = await db.execute(select(ScoreEntry.activity_id))
    first_activity_id = activity_id_result.scalars().first()
    activity_from_db_result = await db.execute(select(Activity).filter(Activity.id == first_activity_id))
    activity_from_db = activity_from_db_result.scalars().first()

    if user_from_db and activity_from_db:
        entries_result = await db.execute(select(ScoreEntry).filter(ScoreEntry.user_id == user_from_db.id, ScoreEntry.activity_id == activity_from_db.id))
        entries = entries_result.scalars().all()
    else:
        entries = []

    return {"data": [entry.to_dict() for entry in entries], "message": "查询成功", "success": True}

@router.get("/governance-metrics")
async def get_governance_metrics(db: AsyncSession = Depends(get_db)):
    # 返回硬编码的治理指标样本数据，不使用数据库
    sample_metrics = {
        "department": {
            "labels": ['代码质量', '文档完整性', '安全合规', '性能效率', '可维护性', '可扩展性'],
            "values": [85, 92, 88, 76, 90, 82],
            "governance_index": 89.5
        },
        "global": {
            "labels": ['代码质量', '文档完整性', '安全合规', '性能效率', '可维护性', '可扩展性'],
            "values": [80, 85, 92, 88, 78, 86],
            "governance_index": 86.3
        }
    }
    return {"data": sample_metrics, "message": "查询成功", "success": True}

@router.post("/governance-metrics")
async def create_governance_metric(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    # 治理指标创建接口已禁用 - 使用硬编码数据
    return {"data": None, "message": "治理指标功能已简化，使用预设数据", "success": True}
