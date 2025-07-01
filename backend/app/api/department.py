from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.department import Department
from app.models.user import User

router = APIRouter(prefix="/api/departments", tags=["department"])

class DepartmentCreate(BaseModel):
    name: str

@router.post("/", response_model=dict)
async def create_department(department: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    # 检查部门名称是否已存在
    existing_department = await db.execute(select(Department).filter(Department.name == department.name))
    if existing_department.scalars().first():
        raise HTTPException(status_code=400, detail="部门名称已存在")

    new_department = Department(name=department.name)
    db.add(new_department)
    await db.commit()
    await db.refresh(new_department)
    return {"data": new_department.to_dict(), "message": "部门创建成功", "success": True}

@router.get("/", response_model=dict)
async def get_departments(db: AsyncSession = Depends(get_db)):
    departments = await db.execute(select(Department))
    departments_list = []
    for dept in departments.scalars().all():
        dept_dict = dept.to_dict()
        # 获取该部门的所有用户
        users_in_department = await db.execute(select(User).filter(User.department_id == dept.id))
        all_users = users_in_department.scalars().all()
        
        # 计算活跃员工数量 (完成任务数 > 0)
        active_members_count = sum(1 for user in all_users if user.completed_tasks and user.completed_tasks > 0)
        
        dept_dict["activeMembersCount"] = active_members_count
        dept_dict["memberCount"] = len(all_users) # 部门总人数
        departments_list.append(dept_dict)
    return {"data": departments_list, "message": "部门列表获取成功", "success": True}

@router.delete("/{department_id}", response_model=dict)
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)):
    # 查找要删除的部门
    result = await db.execute(select(Department).filter(Department.id == department_id))
    department_to_delete = result.scalars().first()

    if not department_to_delete:
        raise HTTPException(status_code=404, detail="部门未找到")

    # 删除部门
    await db.delete(department_to_delete)
    await db.commit()

    return {"message": "部门删除成功", "success": True}

@router.get("/{department_id}/members", response_model=dict)
async def get_department_members(department_id: int, db: AsyncSession = Depends(get_db)):
    """
    获取指定部门的所有成员
    """
    department_exists = await db.execute(select(Department).filter(Department.id == department_id))
    if not department_exists.scalars().first():
        raise HTTPException(status_code=404, detail="部门未找到")

    users = await db.execute(select(User).filter(User.department_id == department_id))
    members_list = []
    for user in users.scalars().all():
        # Mapping User model fields to DetailedMember interface
        members_list.append({
            "id": str(user.id),
            "name": user.name,
            "avatar": user.avatar_url or "/placeholder-user.jpg",
            "initials": user.name[0].upper() if user.name else "UN", # Derive initials
            "title": user.position,
            "joinDate": user.join_date.isoformat() if user.join_date else None,
            "performanceScore": user.points,
            "kpis": {
                "codeCommits": user.completed_tasks * 2, # Example derivation
                "leadTasks": (user.completed_tasks or 0) + (user.pending_tasks or 0), # Sum of tasks
                "bugsFixed": user.completed_tasks // 5, # Example derivation
                "newFeatures": user.completed_tasks // 3, # Example derivation
            },
            "skills": ["Python", "SQL", "FastAPI"] if user.position == "后端工程师" else ["React", "TypeScript", "Node.js"], # Placeholder skills based on role
            "recentWork": [
                {"id": "rw1", "title": "项目A开发", "status": "进行中", "date": "2024-03-10"},
                {"id": "rw2", "title": "代码审查", "status": "已完成", "date": "2024-03-05"},
            ], # Placeholder recent work
            "overallPerformance": user.points,
        })
    return {"data": members_list, "message": "部门成员列表获取成功", "success": True} 