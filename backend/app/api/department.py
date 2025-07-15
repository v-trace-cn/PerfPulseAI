"""
Department management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.department import Department
from app.models.user import User
from app.models.company import Company
from app.core.permissions import simple_user_required
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/departments", tags=["department"])

@router.get("/")
async def get_departments(
    company_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织列表"""
    try:
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

        return {
            "success": True,
            "data": departments_data,
            "message": "获取组织列表成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取组织列表失败: {str(e)}")


@router.post("/")
async def create_department(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """创建新组织"""
    try:
        name = data.get("name")
        description = data.get("description", "")
        company_id = data.get("companyId") or current_user.company_id

        if not name:
            raise HTTPException(status_code=400, detail="组织名称不能为空")

        if not company_id:
            raise HTTPException(status_code=400, detail="必须指定公司")

        result = await db.execute(select(Company).filter(Company.id == company_id))
        company = result.scalars().first()
        if not company:
            raise HTTPException(status_code=404, detail="公司不存在")

        result = await db.execute(
            select(Department).filter(
                Department.name == name,
                Department.company_id == company_id
            )
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="组织名称已存在")

        # 创建组织
        department = Department(
            name=name,
            company_id=company_id
        )
        db.add(department)
        await db.commit()
        await db.refresh(department)

        # 转换为组织格式返回
        dept_dict = department.to_dict()
        dept_dict['description'] = ""  # departments表没有description字段
        dept_dict['isActive'] = True   # departments表没有isActive字段
        dept_dict['memberCount'] = 0   # 新创建的组织成员数为0
        dept_dict['activeMembersCount'] = 0  # 新创建的组织活跃成员数为0

        return {
            "success": True,
            "data": dept_dict,
            "message": "创建组织"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"创建组织失败: {str(e)}")

@router.get("/{department_id}")
async def get_department_detail(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织详情"""
    try:
        result = await db.execute(
            select(Department)
            .options(selectinload(Department.company))
            .filter(Department.id == department_id)
        )
        department = result.scalars().first()

        if not department:
            raise HTTPException(status_code=404, detail="组织不存在")

        # 计算成员数量
        users_result = await db.execute(select(User).filter(User.department_id == department_id))
        all_users = users_result.scalars().all()
        active_members_count = sum(1 for user in all_users if user.completed_tasks and user.completed_tasks > 0)

        dept_dict = department.to_dict()
        dept_dict['description'] = ""
        dept_dict['isActive'] = True
        dept_dict['memberCount'] = len(all_users)
        dept_dict['activeMembersCount'] = active_members_count

        return {
            "success": True,
            "data": dept_dict,
            "message": "获取组织详情成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取组织详情失败: {str(e)}")


@router.put("/{department_id}")
async def update_department(
    department_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """更新组织信息"""
    try:
        result = await db.execute(select(Department).filter(Department.id == department_id))
        department = result.scalars().first()

        if not department:
            raise HTTPException(status_code=404, detail="组织不存在")

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
                    raise HTTPException(status_code=400, detail="组织名称已存在")
            department.name = data["name"]

        # departments表没有description和isActive字段，忽略这些更新

        if "companyId" in data:
            department.company_id = data["companyId"]

        department.updated_at = datetime.utcnow().replace(microsecond=0)

        await db.commit()
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

        return {
            "success": True,
            "data": dept_dict,
            "message": "更新组织信息成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新组织信息失败: {str(e)}")

@router.delete("/{department_id}")
async def delete_department(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """删除组织"""
    try:
        result = await db.execute(select(Department).filter(Department.id == department_id))
        department = result.scalars().first()

        if not department:
            raise HTTPException(status_code=404, detail="组织不存在")

        # 检查是否有用户属于这个组织
        users_result = await db.execute(select(User).filter(User.department_id == department_id))
        users = users_result.scalars().all()

        if users:
            raise HTTPException(status_code=400, detail=f"无法删除组织，还有 {len(users)} 个用户属于该组织")

        await db.delete(department)
        await db.commit()

        return {
            "success": True,
            "message": "删除组织成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"删除组织失败: {str(e)}")

@router.get("/{department_id}/members")
async def get_department_members(
    department_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取组织成员列表"""
    try:
        # 检查组织是否存在
        result = await db.execute(select(Department).filter(Department.id == department_id))
        department = result.scalars().first()

        if not department:
            raise HTTPException(status_code=404, detail="组织不存在")

        # 获取组织成员
        users_result = await db.execute(select(User).filter(User.department_id == department_id))
        users = users_result.scalars().all()

        members_list = []
        for user in users:
            members_list.append({
                "id": str(user.id),
                "name": user.name,
                "avatar": user.avatar_url or "/placeholder-user.jpg",
                "initials": user.name[0].upper() if user.name else "UN",
                "title": user.position,
                "joinDate": user.join_date.isoformat() if user.join_date else None,
                "performanceScore": user.points,
                "kpis": {
                    "codeCommits": user.completed_tasks * 2,
                    "leadTasks": (user.completed_tasks or 0) + (user.pending_tasks or 0),
                    "bugsFixed": user.completed_tasks // 5,
                    "newFeatures": user.completed_tasks // 3,
                },
                "skills": ["Python", "SQL", "FastAPI"] if user.position == "后端工程师" else ["React", "TypeScript", "Node.js"],
                "recentWork": [
                    {"id": "rw1", "title": "项目A开发", "status": "进行中", "date": "2024-03-10"},
                    {"id": "rw2", "title": "代码审查", "status": "已完成", "date": "2024-03-05"},
                ],
                "overallPerformance": user.points,
            })

        return {
            "success": True,
            "data": members_list,
            "message": "获取组织成员列表成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取组织成员列表失败: {str(e)}")