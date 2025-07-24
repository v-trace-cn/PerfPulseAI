"""
Department management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.base_api import BaseAPIRouter
from app.core.decorators import handle_api_errors, transaction
from app.models.department import Department
from app.models.user import User
from app.models.company import Company
from app.core.permissions import simple_user_required
from typing import List, Optional
from datetime import datetime

# Initialize router using base class
base_router = BaseAPIRouter(prefix="/api/departments", tags=["department"])
router = base_router.router

@router.get("/")
@handle_api_errors
async def get_departments(
    company_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织列表"""
    query = select(Department).options(
        selectinload(Department.company)
    )

    if company_id:
        query = query.filter(Department.company_id == company_id)
    elif current_user.company_id:
        query = query.filter(Department.company_id == current_user.company_id)

    result = await db.execute(query.order_by(Department.created_at.desc()))
    departments = result.scalars().all()

    # 转换为组织格式，包含成员数量
    departments_data = []
    for dept in departments:
        dept_dict = dept.to_dict()

        # 计算该组织的成员数量
        users_result = await db.execute(select(User).filter(User.department_id == dept.id))
        all_users = users_result.scalars().all()

        # 计算活跃成员数量 (完成任务数 > 0)
        active_members_count = sum(1 for user in all_users if user.completed_tasks and user.completed_tasks > 0)

        # 添加组织相关的字段
        dept_dict['description'] = ""  # departments表没有description字段
        dept_dict['isActive'] = True   # departments表没有isActive字段
        dept_dict['memberCount'] = len(all_users)  # 总成员数
        dept_dict['activeMembersCount'] = active_members_count  # 活跃成员数

        departments_data.append(dept_dict)

    return base_router.success_response(departments_data, "获取组织列表成功")


@router.post("/")
@handle_api_errors
@transaction
async def create_department(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """创建新组织"""
    name = data.get("name")
    description = data.get("description", "")
    company_id = data.get("companyId") or current_user.company_id

    if not name:
        base_router.error_response("组织名称不能为空", 400)

    if not company_id:
        base_router.error_response("必须指定公司", 400)

    result = await db.execute(select(Company).filter(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        base_router.error_response("公司不存在", 404)

    result = await db.execute(
        select(Department).filter(
            Department.name == name,
            Department.company_id == company_id
        )
    )
    if result.scalars().first():
        base_router.error_response("组织名称已存在", 400)

    # 创建组织
    department = Department(
        name=name,
        company_id=company_id
    )
    db.add(department)
    await db.flush()
    await db.refresh(department)

    # 转换为组织格式返回
    dept_dict = department.to_dict()
    dept_dict['description'] = ""  # departments表没有description字段
    dept_dict['isActive'] = True   # departments表没有isActive字段
    dept_dict['memberCount'] = 0   # 新创建的组织成员数为0
    dept_dict['activeMembersCount'] = 0  # 新创建的组织活跃成员数为0

    return base_router.success_response(dept_dict, "创建组织")

@router.get("/{department_id}")
@handle_api_errors
async def get_department_detail(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织详情"""
    result = await db.execute(
        select(Department)
        .options(selectinload(Department.company))
        .filter(Department.id == department_id)
    )
    department = result.scalars().first()

    if not department:
        base_router.error_response("组织不存在", 404)

    # 计算成员数量
    users_result = await db.execute(select(User).filter(User.department_id == department_id))
    all_users = users_result.scalars().all()
    active_members_count = sum(1 for user in all_users if user.completed_tasks and user.completed_tasks > 0)

    dept_dict = department.to_dict()
    dept_dict['description'] = ""
    dept_dict['isActive'] = True
    dept_dict['memberCount'] = len(all_users)
    dept_dict['activeMembersCount'] = active_members_count

    return base_router.success_response(dept_dict, "获取组织详情成功")


@router.put("/{department_id}")
@handle_api_errors
@transaction
async def update_department(
    department_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """更新组织信息"""
    result = await db.execute(select(Department).filter(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        base_router.error_response("组织不存在", 404)

    # 更新组织名称
    if "name" in data and data["name"]:
        if data["name"] != department.name:
            result = await db.execute(
                select(Department).filter(
                    Department.name == data["name"],
                    Department.company_id == department.company_id,
                    Department.id != department_id
                )
            )
            if result.scalars().first():
                base_router.error_response("组织名称已存在", 400)
        department.name = data["name"]

    # departments表没有description和isActive字段，忽略这些更新

    if "companyId" in data:
        department.company_id = data["companyId"]

    department.updated_at = datetime.utcnow().replace(microsecond=0)

    await db.flush()
    await db.refresh(department)

    # 计算成员数量
    users_result = await db.execute(select(User).filter(User.department_id == department_id))
    all_users = users_result.scalars().all()
    active_members_count = sum(1 for user in all_users if user.completed_tasks and user.completed_tasks > 0)

    # 转换为组织格式返回
    dept_dict = department.to_dict()
    dept_dict['description'] = ""
    dept_dict['isActive'] = True
    dept_dict['memberCount'] = len(all_users)
    dept_dict['activeMembersCount'] = active_members_count

    return base_router.success_response(dept_dict, "更新组织信息成功")

@router.delete("/{department_id}")
@handle_api_errors
@transaction
async def delete_department(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """删除组织"""
    result = await db.execute(select(Department).filter(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        base_router.error_response("组织不存在", 404)

    # 检查是否有用户属于这个组织
    users_result = await db.execute(select(User).filter(User.department_id == department_id))
    users = users_result.scalars().all()

    if users:
        base_router.error_response(f"无法删除组织，还有 {len(users)} 个用户属于该组织", 400)

    await db.delete(department)
    await db.flush()

    return base_router.success_response(None, "删除组织成功")

@router.get("/{department_id}/members")
@handle_api_errors
async def get_department_members(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织成员列表"""
    # 检查组织是否存在
    result = await db.execute(select(Department).filter(Department.id == department_id))
    department = result.scalars().first()

    if not department:
        base_router.error_response("组织不存在", 404)

    # 获取组织成员
    users_result = await db.execute(select(User).filter(User.department_id == department_id))
    users = users_result.scalars().all()

    members_list = []
    for user in users:
        members_list.append({
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.email or user.name}",
            "initials": user.name[0].upper() if user.name else "UN",
            "title": user.position or "开发工程师",
            "joinDate": user.join_date.isoformat() if user.join_date else user.created_at.date().isoformat(),
            "performanceScore": user.points or 0,
            "kpis": {
                "codeCommits": (user.completed_tasks or 0) * 2,
                "leadTasks": (user.completed_tasks or 0) + (user.pending_tasks or 0),
                "bugsFixed": max(1, (user.completed_tasks or 0) // 5),
                "newFeatures": max(1, (user.completed_tasks or 0) // 3),
            },
            "skills": ["Python", "SQL", "FastAPI"] if user.position == "后端工程师" else ["React", "TypeScript", "Node.js"],
            "recentWork": [
                {"id": "rw1", "title": "项目A开发", "status": "进行中", "date": "2024-03-10"},
                {"id": "rw2", "title": "代码审查", "status": "已完成", "date": "2024-03-05"},
            ],
            "overallPerformance": user.points or 0,
        })

    return base_router.success_response(members_list, "获取组织成员列表成功")