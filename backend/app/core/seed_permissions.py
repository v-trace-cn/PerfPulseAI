"""
初始化系统权限和默认角色的脚本
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.permission import Permission, SYSTEM_PERMISSIONS
from app.models.role import Role
from app.models.company import Company


async def init_system_permissions(db: AsyncSession):
    """初始化系统权限"""
    for perm_name, display_name, category, description in SYSTEM_PERMISSIONS:
        # 检查权限是否已存在
        result = await db.execute(select(Permission).filter(Permission.name == perm_name))
        existing_permission = result.scalars().first()
        
        if not existing_permission:
            permission = Permission(
                name=perm_name,
                display_name=display_name,
                category=category,
                description=description,
                is_system_permission=True
            )
            db.add(permission)
    
    await db.commit()


async def create_default_roles_for_company(db: AsyncSession, company_id: int):
    """为公司创建默认角色"""
    
    # 获取所有权限
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
    
    # 创建部门管理员角色
    dept_admin_permissions = [p for p in all_permissions if p.name in [
        'user.read', 'user.update', 'department.read', 'department.update',
        'activity.read', 'activity.create', 'activity.update', 'reward.read'
    ]]
    dept_admin_role = Role(
        name="部门管理员",
        company_id=company_id,
        description="部门管理员角色，可以管理部门用户和活动",
        is_system_role=True
    )
    dept_admin_role.permissions = dept_admin_permissions
    db.add(dept_admin_role)
    
    await db.commit()
    return admin_role, user_role, dept_admin_role


async def create_default_company_and_roles(db: AsyncSession):
    """创建默认公司和角色"""
    # 检查是否已有默认公司
    result = await db.execute(select(Company).filter(Company.name == "默认公司"))
    default_company = result.scalars().first()
    
    if not default_company:
        default_company = Company(
            name="默认公司",
            description="系统默认公司",
            domain="default"
        )
        db.add(default_company)
        await db.commit()
        await db.refresh(default_company)
        
        # 为默认公司创建角色
        await create_default_roles_for_company(db, default_company.id)
    
    return default_company


async def seed_permissions_and_roles():
    """初始化权限和角色数据"""
    async for db in get_db():
        try:
            # 初始化系统权限
            await init_system_permissions(db)
            
            # 创建默认公司和角色
            await create_default_company_and_roles(db)
            
            print("权限和角色数据初始化完成")
            
        except Exception as e:
            print(f"初始化权限和角色数据时出错: {e}")
            await db.rollback()
        finally:
            break


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_permissions_and_roles())
