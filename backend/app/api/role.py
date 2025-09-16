"""
角色管理API - 基于角色的权限判断
"""
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.role import Role, user_roles
from app.models.user import User

from app.core.permissions import simple_user_required, ensure_company_creator_or_super_admin, check_company_creator_permission

router = APIRouter(prefix="/api/roles", tags=["role"])


@router.get("/")
async def list_roles(
    companyId: int = Query(..., description="公司ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """按公司列出角色（包含用户数）。
    允许公司创建者或超级管理员跨公司查看；否则必须属于该公司。
    """
    try:
        if current_user.company_id != companyId:
            await ensure_company_creator_or_super_admin(current_user.id, int(companyId), db)

        result = await db.execute(
            select(Role).options(selectinload(Role.users)).filter(Role.company_id == companyId)
        )
        roles = result.scalars().all()
        data = []
        for r in roles:
            item = r.to_dict(include_relations=False)  # 不包含关联数据
            try:
                item["userCount"] = len(r.users) if r.users is not None else 0
            except Exception:
                item["userCount"] = 0
            data.append(item)
        return {"success": True, "data": data, "message": "获取角色列表成功"}
    except HTTPException:
        raise
    except Exception as e:
        if "no such table" in str(e).lower() or "relation \"roles\" does not exist" in str(e):
            return {"success": True, "data": [], "message": "角色表不存在，已返回空列表"}
        raise HTTPException(status_code=500, detail=f"获取角色列表失败: {str(e)}")


@router.post("/")
async def create_role(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """创建角色。仅公司创建者可创建。
    请求体: { companyId: number, name: string, description?: string }
    """
    company_id = data.get("companyId")
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not company_id or not name:
        raise HTTPException(status_code=422, detail="缺少必填字段 companyId/name")

    # 权限：公司创建者或超级管理员
    await ensure_company_creator_or_super_admin(current_user.id, int(company_id), db)

    # 重名检查（公司内）
    result = await db.execute(select(Role).filter(Role.company_id == company_id, Role.name == name))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="该公司下角色名称已存在")

    role = Role(name=name, company_id=company_id, description=description)
    db.add(role)
    await db.flush()
    await db.refresh(role)

    await db.commit()
    return {"success": True, "data": role.to_dict(include_relations=False), "message": "创建角色成功"}


@router.put("/{role_id}")
async def update_role(
    role_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    更新角色信息（名称/描述）
    请求体: { name?: string, description?: string, isActive?: boolean }
    """
    try:
        # 获取角色
        result = await db.execute(select(Role).filter(Role.id == role_id))
        role = result.scalars().first()
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")

        # 权限校验：公司创建者或超级管理员
        await ensure_company_creator_or_super_admin(current_user.id, int(role.company_id), db)

        name = data.get("name")
        if name is not None:
            name = (name or "").strip()
            if not name:
                raise HTTPException(status_code=400, detail="角色名称不能为空")
            if name != role.name:
                # 同公司内重名检查
                dup_q = await db.execute(
                    select(Role).filter(
                        Role.company_id == role.company_id, 
                        Role.name == name,
                        Role.id != role_id
                    )
                )
                if dup_q.scalars().first():
                    raise HTTPException(status_code=400, detail="该公司下角色名称已存在")
                role.name = name

        description = data.get("description")
        if description is not None:
            role.description = (description or "").strip() or None

        is_active = data.get("isActive")
        if is_active is not None:
            role.is_active = bool(is_active)

        await db.commit()
        await db.refresh(role)
        return {"success": True, "data": role.to_dict(include_relations=False), "message": "更新角色成功"}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        msg = str(e)
        if "no such table" in msg.lower():
            raise HTTPException(status_code=400, detail=f"数据库未初始化，请先执行迁移：{msg}")
        raise HTTPException(status_code=500, detail=f"更新角色失败: {msg}")


@router.delete("/{role_id}")
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    删除角色。仅公司创建者可删除。
    将清理角色与用户的关联后再删除角色本身。
    """
    try:
        # 获取角色
        result = await db.execute(select(Role).filter(Role.id == role_id))
        role = result.scalars().first()
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")

        # 权限校验：公司创建者或超级管理员
        await ensure_company_creator_or_super_admin(current_user.id, int(role.company_id), db)

        # 清空用户关联 - 使用SQL直接删除关联记录
        from app.models.role import user_roles
        from sqlalchemy import delete

        # 删除用户角色关联
        await db.execute(
            delete(user_roles).where(user_roles.c.role_id == role_id)
        )
        await db.flush()

        # 删除角色
        await db.delete(role)
        await db.commit()
        return {"success": True, "data": True, "message": "删除角色成功"}

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        msg = str(e)
        if "no such table" in msg.lower():
            raise HTTPException(status_code=400, detail=f"数据库未初始化，请先执行迁移：{msg}")
        raise HTTPException(status_code=500, detail=f"删除角色失败: {msg}")


@router.get("/{role_id}/members")
async def get_role_members(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    获取角色成员列表。仅公司创建者或超级管理员可获取。
    返回 items: [{id,name,email}]。
    """
    try:
        result = await db.execute(select(Role).filter(Role.id == role_id))
        role = result.scalars().first()
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")

        await ensure_company_creator_or_super_admin(current_user.id, int(role.company_id), db)

        items = []
        try:
            for u in (role.users or []):
                items.append({"id": u.id, "name": u.name, "email": u.email})
        except Exception:
            items = []
        return {"success": True, "data": {"items": items}, "message": "获取成功"}
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "no such table" in msg.lower():
            raise HTTPException(status_code=400, detail=f"数据库未初始化，请先执行迁移：{msg}")
        raise HTTPException(status_code=500, detail=f"获取角色成员失败: {msg}")


@router.put("/{role_id}/users")
async def update_role_users(
    role_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    更新角色的用户分配。
    请求体: { userIds: number[] }
    """
    try:
        # 获取角色
        result = await db.execute(
            select(Role).options(selectinload(Role.users)).filter(Role.id == role_id)
        )
        role = result.scalars().first()
        if not role:
            raise HTTPException(status_code=404, detail="角色不存在")

        # 权限验证
        await ensure_company_creator_or_super_admin(current_user.id, int(role.company_id), db)

        user_ids = data.get("userIds", [])
        if not isinstance(user_ids, list):
            raise HTTPException(status_code=400, detail="userIds 必须为数组")

        if len(user_ids) == 0:
            role.users = []
        else:
            # 验证用户是否属于同一公司
            users_result = await db.execute(
                select(User).filter(
                    User.id.in_(user_ids), 
                    User.company_id == role.company_id
                )
            )
            users = users_result.scalars().all()
            
            found_user_ids = {u.id for u in users}
            missing_user_ids = [uid for uid in user_ids if uid not in found_user_ids]
            if missing_user_ids:
                raise HTTPException(
                    status_code=400, 
                    detail=f"用户ID不存在或不属于当前公司: {missing_user_ids}"
                )
            
            role.users = users

        await db.commit()
        await db.refresh(role)

        # 返回更新后的用户列表
        user_list = [{"id": u.id, "name": u.name, "email": u.email} for u in (role.users or [])]
        return {
            "success": True, 
            "data": {"users": user_list, "userCount": len(user_list)}, 
            "message": "用户分配更新成功"
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        error_msg = str(e)
        if "no such table" in error_msg.lower():
            raise HTTPException(
                status_code=400, 
                detail=f"数据库未初始化，请先执行迁移：{error_msg}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"更新用户分配失败: {error_msg}"
        )


@router.put("/users/{user_id}/roles")
async def update_user_roles(
    user_id: int,
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    更新用户的角色分配
    请求体: { roleIds: number[] }
    """
    try:
        role_ids = data.get("roleIds", [])

        if not isinstance(role_ids, list):
            raise HTTPException(status_code=400, detail="roleIds 必须为数组")

        # 获取用户信息
        user_result = await db.execute(
            select(User).options(selectinload(User.roles)).filter(User.id == user_id)
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 权限验证：只有公司创建者或超级管理员可以分配角色
        await ensure_company_creator_or_super_admin(current_user.id, int(user.company_id), db)

        if len(role_ids) == 0:
            # 清空用户的所有角色
            user.roles = []
        else:
            # 验证角色是否属于同一公司
            roles_result = await db.execute(
                select(Role).filter(
                    Role.id.in_(role_ids),
                    Role.company_id == user.company_id
                )
            )
            roles = roles_result.scalars().all()

            found_role_ids = {r.id for r in roles}
            missing_role_ids = [rid for rid in role_ids if rid not in found_role_ids]
            if missing_role_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"角色ID不存在或不属于当前公司: {missing_role_ids}"
                )

            # 更新用户的角色
            user.roles = roles

        await db.commit()
        await db.refresh(user)

        # 返回更新后的角色列表
        role_list = [{"id": r.id, "name": r.name, "description": r.description} for r in (user.roles or [])]
        return {
            "success": True,
            "data": {"roles": role_list, "roleCount": len(role_list)},
            "message": "用户角色更新成功"
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "no such table" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"数据库未初始化，请先执行迁移：{error_msg}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"更新用户角色失败: {error_msg}"
        )


@router.put("/{role_id}/state")
async def update_user_roles_legacy(
    role_id: int,  # 实际上是 user_id
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    更新用户角色的兼容接口
    请求体: { userIds: number[] } - 实际上是 roleIds
    """
    # 转换参数格式并调用新接口
    role_ids = data.get("userIds", [])
    new_data = {"roleIds": role_ids}

    return await update_user_roles(role_id, new_data, db, current_user)


@router.get("/users/{user_id}/roles")
async def get_user_roles(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    获取用户的角色列表
    """
    try:
        # 获取用户信息
        user_result = await db.execute(
            select(User).options(selectinload(User.roles)).filter(User.id == user_id)
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        # 权限验证：只有公司创建者或超级管理员可以查看角色
        await ensure_company_creator_or_super_admin(current_user.id, int(user.company_id), db)

        # 返回用户的角色列表
        role_list = [{"id": r.id, "name": r.name, "description": r.description} for r in (user.roles or [])]
        return {
            "success": True,
            "data": {"roles": role_list, "roleCount": len(role_list)},
            "message": "获取用户角色成功"
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "no such table" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"数据库未初始化，请先执行迁移：{error_msg}"
            )
        raise HTTPException(
            status_code=500,
            detail=f"获取用户角色失败: {error_msg}"
        )


# ============ 权限判断接口 ============

@router.get("/permissions/can_view_admin_menus")
async def can_view_admin_menus(
    companyId: int = Query(..., description="公司ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(simple_user_required),
):
    """
    判断用户是否可以查看管理员菜单（权限管理/商城管理/兑奖管理）

    权限判断逻辑（基于 user_roles 关联表）：
    1. 超级管理员：可以查看所有公司的管理菜单
    2. 公司创建者：可以查看自己公司的管理菜单
    """
    res_data ={
        "canView": True,
        "canOrg": True,
        "canMall": True,
        "canRedemption": True,
        "reason": "超级管理员"
    }
    try:
        # 检查是否为超级管理员
        if current_user.is_super_admin:
            res_data['reason'] = "超级管理员"
            return {
                "success": True,
                "data": res_data,
                "message": "权限检查成功"
            }

        # 检查是否为公司创建者
        is_company_creator = await check_company_creator_permission(current_user.id, companyId, db)
        if is_company_creator:
            res_data['reason'] = "公司创建者"
            return {
                "success": True,
                "data": res_data,
                "message": "权限检查成功"
            }

        # 检查用户是否属于该公司
        if current_user.company_id != companyId:
            return {
                "success": True,
                "data": {
                    "canView": False,
                    "canOrg": False,
                    "canMall": False,
                    "canRedemption": False,
                    "reason": "不属于该公司"
                },
                "message": "权限检查成功"
            }

        # 基于 user_roles 关联表检查用户角色权限
        result = await db.execute(
            select(Role.name)
            .join(user_roles, Role.id == user_roles.c.role_id)
            .filter(
                user_roles.c.user_id == current_user.id,
                Role.company_id == companyId
            )
        )
        user_role_names = result.scalars().all()

        # 定义管理员角色
        admin_roles = {'超级管理员', '公司管理员', '超级管理员 - 分身'}
        mall_roles = {'商城管理员'}
        redemption_roles = {'兑奖管理员'}

        # 检查用户是否有管理权限
        has_admin_role = bool(set(user_role_names) & admin_roles)
        has_mall_role = bool(set(user_role_names) & mall_roles)
        has_redemption_role = bool(set(user_role_names) & redemption_roles)

        if has_admin_role or has_mall_role or has_redemption_role:
            return {
                "success": True,
                "data": {
                    "canView": True,
                    "canOrg": has_admin_role,
                    "canMall": has_mall_role,
                    "canRedemption": has_redemption_role,
                    "reason": f"拥有角色: {', '.join(user_role_names)}"
                },
                "message": "权限检查成功"
            }

        # 普通用户没有管理权限
        return {
            "success": True,
            "data": {
                "canView": False,
                "canOrg": False,
                "canMall": False,
                "canRedemption": False,
                "reason": "普通用户无管理权限"
            },
            "message": "权限检查成功"
        }

    except Exception as e:
        error_msg = str(e)
        if "no such table" in error_msg.lower():
            # 如果权限表不存在，默认只有超级管理员和公司创建者有权限
            is_company_creator = await check_company_creator_permission(current_user.id, companyId, db)
            has_permission = current_user.is_super_admin or is_company_creator

            return {
                "success": True,
                "data": {
                    "canView": has_permission,
                    "canOrg": has_permission,
                    "canMall": has_permission,
                    "canRedemption": has_permission,
                    "reason": "权限表不存在，使用默认权限判断"
                },
                "message": "权限检查成功（使用默认逻辑）"
            }

        raise HTTPException(
            status_code=500,
            detail=f"权限检查失败: {error_msg}"
        )
