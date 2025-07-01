from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.department import Department

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
    departments_list = [dept.to_dict() for dept in departments.scalars().all()]
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