"""
Company management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User
from app.models.department import Department
from app.models.role import Role
from app.models.permission import Permission, SYSTEM_PERMISSIONS
from app.core.permissions import PermissionCheckers, company_creator_required, get_current_user, simple_user_required
from typing import List, Optional
from datetime import datetime
import asyncio

router = APIRouter(prefix="/api/companies", tags=["company"])


@router.get("/")
async def get_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取用户创建的公司列表"""
    try:
        # 获取用户创建的公司
        result = await db.execute(
            select(Company)
            .filter(Company.creator_user_id == current_user.id)
            .order_by(Company.created_at.desc())
        )
        companies = result.scalars().all()

        companies_data = []
        for company in companies:
            # 手动构建公司数据，避免调用 to_dict() 中的关系访问
            user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company.id))
            dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company.id))

            company_dict = {
                "id": company.id,
                "name": company.name,
                "description": company.description,
                "domain": company.domain,
                "inviteCode": company.invite_code,
                "isActive": company.is_active,
                "createdAt": company.created_at.isoformat() if company.created_at else None,
                "updatedAt": company.updated_at.isoformat() if company.updated_at else None,
                "creatorUserId": company.creator_user_id,
                "userCount": user_count or 0,
                "departmentCount": dept_count or 0,
                "organizationCount": 0  # 暂时设为0，如果需要可以后续添加查询
            }
            companies_data.append(company_dict)

        return {
            "success": True,
            "data": companies_data,
            "message": "获取公司列表成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取公司列表失败: {str(e)}")


@router.get("/available")
async def get_available_companies(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取所有可用的公司列表（供新用户加入）"""
    try:
        # 构建查询条件
        query = select(Company).filter(Company.is_active == True)

        # 如果有搜索关键词，添加搜索条件
        if search and search.strip():
            search_term = f"%{search.strip()}%"
            query = query.filter(
                Company.name.ilike(search_term) |
                Company.description.ilike(search_term) |
                Company.domain.ilike(search_term)
            )

        query = query.order_by(Company.created_at.desc())
        result = await db.execute(query)
        companies = result.scalars().all()

        companies_data = []
        for company in companies:
            # 手动构建公司数据
            user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company.id))
            dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company.id))

            company_dict = {
                "id": company.id,
                "name": company.name,
                "description": company.description,
                "domain": company.domain,
                "inviteCode": company.invite_code,
                "isActive": company.is_active,
                "createdAt": company.created_at.isoformat() if company.created_at else None,
                "updatedAt": company.updated_at.isoformat() if company.updated_at else None,
                "creatorUserId": company.creator_user_id,
                "userCount": user_count or 0,
                "departmentCount": dept_count or 0,
                "organizationCount": 0  # 暂时设为0，如果需要可以后续添加查询
            }
            companies_data.append(company_dict)

        return {
            "success": True,
            "data": companies_data,
            "message": "获取可用公司列表成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取可用公司列表失败: {str(e)}")


@router.get("/{company_id}")
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """获取单个公司详情"""
    try:
        result = await db.execute(
            select(Company)
            .filter(Company.id == company_id)
        )
        company = result.scalars().first()

        if not company:
            raise HTTPException(status_code=404, detail="公司不存在")

        # 手动获取统计信息
        user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company.id))
        dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company.id))

        company_data = {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "domain": company.domain,
            "inviteCode": company.invite_code,
            "isActive": company.is_active,
            "createdAt": company.created_at.isoformat() if company.created_at else None,
            "updatedAt": company.updated_at.isoformat() if company.updated_at else None,
            "userCount": user_count or 0,
            "departmentCount": dept_count or 0,
            "organizationCount": 0  # 暂时设为0，如果需要可以后续添加查询
        }

        return {
            "success": True,
            "data": company_data,
            "message": "获取公司详情成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取公司详情失败: {str(e)}")


@router.post("/")
async def create_company(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.company_create)
):
    """创建新公司"""
    try:
        name = data.get("name")
        description = data.get("description", "")
        domain = data.get("domain")
        # 将空字符串转换为 None 以避免 UNIQUE 约束冲突
        if domain and not domain.strip():
            domain = None
        creator_user_id = data.get("creatorUserId")  # 创建者用户ID
        
        if not name:
            raise HTTPException(status_code=400, detail="公司名称不能为空")
        
        if not creator_user_id:
            raise HTTPException(status_code=400, detail="创建者用户ID不能为空")
        
        # 检查公司名称是否已存在
        result = await db.execute(select(Company).filter(Company.name == name))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="公司名称已存在")
        
        # 检查域名是否已存在
        if domain:
            result = await db.execute(select(Company).filter(Company.domain == domain))
            if result.scalars().first():
                raise HTTPException(status_code=400, detail="公司域名已存在")
        
        # 检查创建者用户是否存在
        result = await db.execute(select(User).filter(User.id == creator_user_id))
        creator_user = result.scalars().first()
        if not creator_user:
            raise HTTPException(status_code=404, detail="创建者用户不存在")
        
        # 创建公司
        company = Company(
            name=name,
            creator_user_id=creator_user_id,
            description=description,
            domain=domain
        )
        db.add(company)
        await db.commit()
        await db.refresh(company)
        
        # 为公司初始化权限和角色
        await init_company_permissions_and_roles(db, company.id)
        
        # 将创建者设置为公司的超级管理员
        await assign_creator_as_admin(db, creator_user_id, company.id)
        
        # 手动构建返回数据
        company_data = {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "domain": company.domain,
            "inviteCode": company.invite_code,
            "isActive": company.is_active,
            "createdAt": company.created_at.isoformat() if company.created_at else None,
            "updatedAt": company.updated_at.isoformat() if company.updated_at else None,
            "userCount": 0,  # 创建者不再自动加入，所以初始用户数为0
            "departmentCount": 0,
            "organizationCount": 0
        }

        return {
            "success": True,
            "data": company_data,
            "message": "创建公司成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"创建公司失败: {str(e)}")


@router.put("/{company_id}")
async def update_company(
    company_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(company_creator_required)
):
    """更新公司信息"""
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        company = result.scalars().first()
        
        if not company:
            raise HTTPException(status_code=404, detail="公司不存在")
        
        # 更新字段
        if "name" in data:
            # 检查新名称是否已被其他公司使用
            if data["name"] != company.name:
                result = await db.execute(select(Company).filter(Company.name == data["name"]))
                if result.scalars().first():
                    raise HTTPException(status_code=400, detail="公司名称已存在")
            company.name = data["name"]
        
        if "description" in data:
            company.description = data["description"]
        
        if "domain" in data:
            # 将空字符串转换为 None 以避免 UNIQUE 约束冲突
            new_domain = data["domain"]
            if new_domain and not new_domain.strip():
                new_domain = None

            # 检查新域名是否已被其他公司使用
            if new_domain != company.domain:
                if new_domain:  # 只有当新域名不为空时才检查重复
                    result = await db.execute(select(Company).filter(Company.domain == new_domain))
                    if result.scalars().first():
                        raise HTTPException(status_code=400, detail="公司域名已存在")
            company.domain = new_domain
        
        if "isActive" in data:
            company.is_active = data["isActive"]
        
        company.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(company)

        # 手动获取统计信息
        user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company.id))
        dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company.id))

        company_data = {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "domain": company.domain,
            "inviteCode": company.invite_code,
            "isActive": company.is_active,
            "createdAt": company.created_at.isoformat() if company.created_at else None,
            "updatedAt": company.updated_at.isoformat() if company.updated_at else None,
            "userCount": user_count or 0,
            "departmentCount": dept_count or 0,
            "organizationCount": 0
        }

        return {
            "success": True,
            "data": company_data,
            "message": "更新公司信息成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新公司信息失败: {str(e)}")


@router.delete("/{company_id}")
async def delete_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(company_creator_required)
):
    """删除公司"""
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        company = result.scalars().first()
        
        if not company:
            raise HTTPException(status_code=404, detail="公司不存在")
        
        # 检查是否有关联的用户或部门
        user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company_id))
        dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company_id))

        if user_count > 0 or dept_count > 0:
            raise HTTPException(status_code=400, detail="无法删除有用户或部门的公司")

        # 删除公司相关的角色和权限记录
        from app.models.role import user_roles
        from sqlalchemy import delete

        # 1. 删除用户角色关联（通过角色的公司ID）
        roles_result = await db.execute(select(Role).filter(Role.company_id == company_id))
        company_roles = roles_result.scalars().all()

        for role in company_roles:
            # 删除用户角色关联
            await db.execute(delete(user_roles).where(user_roles.c.role_id == role.id))
            # 删除角色
            await db.delete(role)

        # 2. 删除公司
        await db.delete(company)
        await db.commit()
        
        return {
            "success": True,
            "data": {},
            "message": "删除公司成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"删除公司失败: {str(e)}")


async def init_company_permissions_and_roles(db: AsyncSession, company_id: int):
    """为新公司初始化权限和角色"""
    # 获取所有系统权限
    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()
    
    # 如果没有权限，先创建系统权限
    if not all_permissions:
        for perm_name, display_name, category, description in SYSTEM_PERMISSIONS:
            permission = Permission(
                name=perm_name,
                display_name=display_name,
                category=category,
                description=description,
                is_system_permission=True
            )
            db.add(permission)
        await db.commit()
        
        # 重新获取权限
        result = await db.execute(select(Permission))
        all_permissions = result.scalars().all()
    
    # 创建超级管理员角色（拥有所有权限）
    admin_role = Role(
        name="超级管理员",
        company_id=company_id,
        description="拥有所有权限的超级管理员角色",
        is_system_role=True
    )
    admin_role.permissions = all_permissions
    db.add(admin_role)
    
    # 创建普通用户角色（基础权限）
    user_permissions = [p for p in all_permissions if p.name in [
        'user.read', 'department.read', 'activity.read', 'reward.read'
    ]]
    user_role = Role(
        name="普通用户",
        company_id=company_id,
        description="普通用户角色，具有基础查看权限",
        is_system_role=True
    )
    user_role.permissions = user_permissions
    db.add(user_role)
    
    await db.commit()


async def assign_creator_as_admin(db: AsyncSession, user_id: int, company_id: int):
    """为创建者分配公司的超级管理员角色（但不自动加入公司）"""
    from app.models.role import user_roles
    from sqlalchemy import insert

    # 获取用户
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()

    # 获取超级管理员角色
    result = await db.execute(
        select(Role).filter(Role.company_id == company_id, Role.name == "超级管理员")
    )
    admin_role = result.scalars().first()

    if user and admin_role:
        # 注意：不再自动设置用户的公司ID，让用户手动选择是否加入
        # user.company_id = company_id  # 移除这行代码

        # 使用直接的SQL插入来分配角色，避免关系操作的异步问题
        await db.execute(
            insert(user_roles).values(user_id=user_id, role_id=admin_role.id)
        )
        await db.commit()


@router.post("/join")
async def join_company_by_invite_code(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """用户通过邀请码加入公司"""
    try:
        invite_code = data.get("inviteCode")
        user_id = data.get("userId") or current_user.id

        # 确保用户ID是整数类型
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="无效的用户ID")

        if not invite_code:
            raise HTTPException(status_code=400, detail="邀请码不能为空")

        # 查找公司
        result = await db.execute(select(Company).filter(Company.invite_code == invite_code))
        company = result.scalars().first()

        if not company:
            raise HTTPException(status_code=404, detail="无效的邀请码")

        if not company.is_active:
            raise HTTPException(status_code=400, detail="该公司已停用")

        # 获取用户
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 检查是否强制加入
        force_join = data.get("forceJoin", False)

        # 检查用户是否已经属于其他公司
        if user.company_id and user.company_id != company.id:
            if not force_join:
                # 获取当前公司信息
                current_company_result = await db.execute(select(Company).filter(Company.id == user.company_id))
                current_company = current_company_result.scalars().first()
                current_company_name = current_company.name if current_company else "未知公司"

                raise HTTPException(
                    status_code=409,  # 使用409 Conflict状态码表示冲突
                    detail={
                        "message": "用户已属于其他公司",
                        "currentCompany": current_company_name,
                        "newCompany": company.name,
                        "requireConfirmation": True
                    }
                )
            else:
                # 强制加入，需要清理用户在原公司的所有关联
                # 清理用户角色
                from app.models.role import user_roles
                await db.execute(
                    user_roles.delete().where(user_roles.c.user_id == user_id)
                )

                # 清理部门关联
                user.department_id = None

        if user.company_id == company.id:
            raise HTTPException(status_code=400, detail="用户已经是该公司成员")

        # 加入公司
        user.company_id = company.id

        # 为用户分配默认角色（普通用户）
        result = await db.execute(
            select(Role).filter(Role.company_id == company.id, Role.name == "普通用户")
        )
        default_role = result.scalars().first()

        if default_role:
            # 使用直接的SQL插入来分配角色，避免关系操作的异步问题
            from app.models.role import user_roles
            from sqlalchemy import insert

            # 检查用户是否已经有这个角色
            existing_role = await db.execute(
                select(user_roles).filter(
                    user_roles.c.user_id == user_id,
                    user_roles.c.role_id == default_role.id
                )
            )
            if not existing_role.first():
                await db.execute(
                    insert(user_roles).values(user_id=user_id, role_id=default_role.id)
                )

        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "data": {
                "userId": user.id,
                "companyId": company.id,
                "companyName": company.name
            },
            "message": f"成功加入公司 {company.name}"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"加入公司失败详细错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"加入公司失败: {str(e)}")


@router.post("/leave")
async def leave_company(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required)
):
    """用户退出公司"""
    try:
        user_id = data.get("userId") or current_user.id

        # 确保用户ID是整数类型
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="无效的用户ID")

        # 获取用户
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        if not user.company_id:
            raise HTTPException(status_code=400, detail="用户未加入任何公司")

        # 获取当前公司信息
        result = await db.execute(select(Company).filter(Company.id == user.company_id))
        company = result.scalars().first()
        company_name = company.name if company else "未知公司"

        # 清理用户在公司的所有关联
        # 清理用户角色
        from app.models.role import user_roles
        await db.execute(
            user_roles.delete().where(user_roles.c.user_id == user_id)
        )

        # 清理部门关联
        user.department_id = None

        # 清理公司关联
        user.company_id = None

        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "data": {
                "userId": user.id,
                "leftCompany": company_name
            },
            "message": f"成功退出公司 {company_name}"
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"退出公司失败详细错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"退出公司失败: {str(e)}")


@router.get("/{company_id}/stats")
async def get_company_stats(company_id: int, db: AsyncSession = Depends(get_db)):
    """获取公司统计信息"""
    try:
        result = await db.execute(select(Company).filter(Company.id == company_id))
        company = result.scalars().first()

        if not company:
            raise HTTPException(status_code=404, detail="公司不存在")

        # 获取统计数据
        user_count = await db.scalar(select(func.count(User.id)).filter(User.company_id == company_id))
        dept_count = await db.scalar(select(func.count(Department.id)).filter(Department.company_id == company_id))
        role_count = await db.scalar(select(func.count(Role.id)).filter(Role.company_id == company_id))

        # 计算平均员工数（这里简化为总用户数）
        avg_employees = user_count or 0

        stats = {
            "companyCount": 1,  # 当前公司
            "employeeCount": user_count or 0,
            "activeCompanies": 1 if company.is_active else 0,
            "avgEmployees": avg_employees,
            "departmentCount": dept_count or 0,
            "roleCount": role_count or 0
        }

        return {
            "success": True,
            "data": stats,
            "message": "获取公司统计信息成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取公司统计信息失败: {str(e)}")


@router.get("/invite-code/{invite_code}")
async def get_company_by_invite_code(
    invite_code: str,
    db: AsyncSession = Depends(get_db)
):
    """通过邀请码获取公司信息"""
    try:
        result = await db.execute(select(Company).filter(Company.invite_code == invite_code))
        company = result.scalars().first()

        if not company:
            raise HTTPException(status_code=404, detail="无效的邀请码")

        return {
            "success": True,
            "data": {
                "id": company.id,
                "name": company.name,
                "description": company.description,
                "isActive": company.is_active
            },
            "message": "获取公司信息成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取公司信息失败: {str(e)}")
