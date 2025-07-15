"""
Permission management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.permission import Permission
from app.models.user import User
from app.core.permissions import PermissionCheckers
from typing import List, Dict, Any

router = APIRouter(prefix="/api/permissions", tags=["permission"])


# 权限常量定义，供前端使用
PERMISSION_DEFINITIONS = {
    "user": {
        "name": "用户管理",
        "permissions": [
            {"name": "user.create", "displayName": "创建用户", "description": "创建新用户的权限"},
            {"name": "user.read", "displayName": "查看用户", "description": "查看用户信息的权限"},
            {"name": "user.update", "displayName": "更新用户", "description": "更新用户信息的权限"},
            {"name": "user.delete", "displayName": "删除用户", "description": "删除用户的权限"},
        ]
    },
    "company": {
        "name": "公司管理",
        "permissions": [
            {"name": "company.create", "displayName": "创建公司", "description": "创建新公司的权限"},
            {"name": "company.read", "displayName": "查看公司", "description": "查看公司信息的权限"},
            {"name": "company.update", "displayName": "更新公司", "description": "更新公司信息的权限"},
            {"name": "company.delete", "displayName": "删除公司", "description": "删除公司的权限"},
        ]
    },
    "department": {
        "name": "部门管理",
        "permissions": [
            {"name": "department.create", "displayName": "创建部门", "description": "创建新部门的权限"},
            {"name": "department.read", "displayName": "查看部门", "description": "查看部门信息的权限"},
            {"name": "department.update", "displayName": "更新部门", "description": "更新部门信息的权限"},
            {"name": "department.delete", "displayName": "删除部门", "description": "删除部门的权限"},
        ]
    },
    "organization": {
        "name": "组织管理",
        "permissions": [
            {"name": "organization.create", "displayName": "创建组织", "description": "创建新组织的权限"},
            {"name": "organization.read", "displayName": "查看组织", "description": "查看组织信息的权限"},
            {"name": "organization.update", "displayName": "更新组织", "description": "更新组织信息的权限"},
            {"name": "organization.delete", "displayName": "删除组织", "description": "删除组织的权限"},
        ]
    },
    "permission": {
        "name": "权限管理",
        "permissions": [
            {"name": "permission.read", "displayName": "查看权限", "description": "查看权限信息的权限"},
            {"name": "permission.assign", "displayName": "分配权限", "description": "分配权限给角色的权限"},
        ]
    },
    "activity": {
        "name": "活动管理",
        "permissions": [
            {"name": "activity.create", "displayName": "创建活动", "description": "创建新活动的权限"},
            {"name": "activity.read", "displayName": "查看活动", "description": "查看活动信息的权限"},
            {"name": "activity.update", "displayName": "更新活动", "description": "更新活动信息的权限"},
            {"name": "activity.delete", "displayName": "删除活动", "description": "删除活动的权限"},
        ]
    },
    "reward": {
        "name": "奖励管理",
        "permissions": [
            {"name": "reward.create", "displayName": "创建奖励", "description": "创建新奖励的权限"},
            {"name": "reward.read", "displayName": "查看奖励", "description": "查看奖励信息的权限"},
            {"name": "reward.update", "displayName": "更新奖励", "description": "更新奖励信息的权限"},
            {"name": "reward.delete", "displayName": "删除奖励", "description": "删除奖励的权限"},
        ]
    },
    "system": {
        "name": "系统管理",
        "permissions": [
            {"name": "system.admin", "displayName": "系统管理", "description": "系统管理员权限"},
        ]
    }
}


@router.get("/definitions")
async def get_permission_definitions():
    """获取权限定义（不需要认证）"""
    try:
        return {
            "success": True,
            "data": PERMISSION_DEFINITIONS,
            "message": "获取权限定义成功"
        }
    except Exception as e:
        return {
            "success": False,
            "data": {},
            "message": f"获取权限定义失败: {str(e)}"
        }


@router.get("/")
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.permission_read)
):
    """获取所有权限列表"""
    try:
        result = await db.execute(
            select(Permission).order_by(Permission.category, Permission.name)
        )
        permissions = result.scalars().all()
        
        # 按分类组织权限
        permissions_by_category = {}
        for permission in permissions:
            category = permission.category
            if category not in permissions_by_category:
                permissions_by_category[category] = []
            permissions_by_category[category].append(permission.to_dict())
        
        return {
            "success": True,
            "data": {
                "permissions": [perm.to_dict() for perm in permissions],
                "permissionsByCategory": permissions_by_category
            },
            "message": "获取权限列表成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取权限列表失败: {str(e)}")


@router.get("/categories")
async def get_permission_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.permission_read)
):
    """获取权限分类列表"""
    try:
        result = await db.execute(
            select(Permission.category).distinct().order_by(Permission.category)
        )
        categories = result.scalars().all()
        
        # 获取每个分类的权限数量
        category_stats = []
        for category in categories:
            count_result = await db.execute(
                select(Permission).filter(Permission.category == category)
            )
            permissions = count_result.scalars().all()
            
            category_stats.append({
                "name": category,
                "count": len(permissions),
                "permissions": [perm.to_dict() for perm in permissions]
            })
        
        return {
            "success": True,
            "data": category_stats,
            "message": "获取权限分类成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取权限分类失败: {str(e)}")


@router.get("/{permission_id}")
async def get_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.permission_read)
):
    """获取单个权限详情"""
    try:
        result = await db.execute(
            select(Permission).filter(Permission.id == permission_id)
        )
        permission = result.scalars().first()
        
        if not permission:
            raise HTTPException(status_code=404, detail="权限不存在")
        
        return {
            "success": True,
            "data": permission.to_dict(),
            "message": "获取权限详情成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取权限详情失败: {str(e)}")


@router.get("/user/{user_id}")
async def get_user_permissions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.permission_read)
):
    """获取用户的所有权限"""
    try:
        from sqlalchemy.orm import selectinload
        
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload('permissions'))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 收集用户的所有权限
        user_permissions = set()
        role_permissions = {}
        
        for role in user.roles:
            role_permissions[role.name] = []
            for permission in role.permissions:
                user_permissions.add(permission.name)
                role_permissions[role.name].append(permission.to_dict())
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "userName": user.name,
                "permissions": list(user_permissions),
                "rolePermissions": role_permissions,
                "roles": [{"id": role.id, "name": role.name} for role in user.roles]
            },
            "message": "获取用户权限成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取用户权限失败: {str(e)}")


@router.get("/check/{user_id}")
async def check_user_permissions(
    user_id: int,
    permissions: str,  # 逗号分隔的权限列表
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionCheckers.permission_read)
):
    """检查用户是否具有指定权限"""
    try:
        from sqlalchemy.orm import selectinload
        
        result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload('permissions'))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 解析权限列表
        permission_list = [p.strip() for p in permissions.split(',') if p.strip()]
        
        # 检查每个权限
        permission_results = {}
        for permission_name in permission_list:
            permission_results[permission_name] = user.has_permission(permission_name)
        
        # 检查是否拥有所有权限
        has_all_permissions = all(permission_results.values())
        
        return {
            "success": True,
            "data": {
                "userId": user_id,
                "userName": user.name,
                "permissionResults": permission_results,
                "hasAllPermissions": has_all_permissions,
                "checkedPermissions": permission_list
            },
            "message": "权限检查完成"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"权限检查失败: {str(e)}")



