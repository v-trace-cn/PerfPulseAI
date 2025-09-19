/**
 * 角色权限相关API服务
 * 使用统一的API客户端进行HTTP请求
 */
import { api } from '../api-client'

export interface Permission {
  id: string
  name: string
  description?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Permission[]
}

export interface UserRole {
  userId: string
  roleId: string
  companyId?: string
  assignedAt: string
}

export interface RolePermissionCheck {
  hasPermission: boolean
  permission: string
  userId?: string
  companyId?: string
}

export interface AdminMenuPermissionCheck {
  success: boolean
  data: {
    canView: boolean
    canOrg: boolean
    canMall: boolean
    canRedemption: boolean
    reason: string
  }
  message: string
}

/**
 * 角色权限API服务类
 */
export class RoleApi {
  /**
   * 获取所有角色
   */
  static async getRoles(): Promise<Role[]> {
    return api.get('/api/roles')
  }

  /**
   * 获取指定角色详情
   */
  static async getRole(roleId: string): Promise<Role> {
    return api.get(`/api/roles/${roleId}`)
  }

  /**
   * 创建新角色
   */
  static async createRole(data: Omit<Role, 'id'>): Promise<Role> {
    return api.post('/api/roles', data)
  }

  /**
   * 更新角色
   */
  static async updateRole(roleId: string, data: Partial<Role>): Promise<Role> {
    return api.put(`/api/roles/${roleId}`, data)
  }

  /**
   * 删除角色
   */
  static async deleteRole(roleId: string): Promise<{ message: string }> {
    return api.delete(`/api/roles/${roleId}`)
  }

  /**
   * 批量操作角色（暂时不支持，后端没有此接口）
   */
  static async batchRoles(data: {
    action: 'create' | 'update' | 'delete'
    roles: Role[]
  }): Promise<{ message: string; results: Role[] }> {
    console.warn('后端暂时没有 /api/roles/batch 接口')
    throw new Error('批量操作角色功能暂时不支持')
  }

  /**
   * 检查用户权限
   */
  static async checkPermission(params: {
    permission: string
    companyId?: string
    userId?: string
  }): Promise<RolePermissionCheck> {
    const searchParams = new URLSearchParams()
    searchParams.append('permission', params.permission)
    if (params.companyId) searchParams.append('companyId', params.companyId)
    if (params.userId) searchParams.append('userId', params.userId)
    
    return api.get(`/api/roles/permissions/check?${searchParams.toString()}`)
  }

  /**
   * 检查是否可以查看管理菜单
   */
  static async canViewAdminMenus(companyId?: string): Promise<AdminMenuPermissionCheck> {
    const searchParams = new URLSearchParams()
    if (companyId) searchParams.append('companyId', companyId)

    return api.get(`/api/roles/permissions/can_view_admin_menus?${searchParams.toString()}`)
  }

  /**
   * 获取用户角色
   */
  static async getUserRoles(userId: string, companyId?: string): Promise<{ success: boolean; data: { roles: UserRole[]; roleCount: number }; message: string }> {
    return api.get(`/api/roles/users/${userId}/roles`)
  }

  /**
   * 更新用户角色（替代分配和移除角色）
   */
  static async updateUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean; data: { roles: UserRole[]; roleCount: number }; message: string }> {
    return api.put(`/api/roles/users/${userId}/roles`, { roleIds: roleIds.map(id => parseInt(id)) })
  }

  /**
   * 分配角色给用户（兼容性方法，内部调用 updateUserRoles）
   */
  static async assignRole(data: {
    userId: string
    roleId: string
    companyId?: string
  }): Promise<UserRole> {
    // 先获取用户当前角色
    const currentRoles = await this.getUserRoles(data.userId, data.companyId)
    const currentRoleIds = currentRoles.data?.roles?.map(r => r.roleId) || []

    // 添加新角色
    const newRoleIds = [...currentRoleIds, data.roleId]
    const result = await this.updateUserRoles(data.userId, newRoleIds)

    // 返回兼容格式
    return {
      userId: data.userId,
      roleId: data.roleId,
      companyId: data.companyId,
      assignedAt: new Date().toISOString()
    }
  }

  /**
   * 移除用户角色（兼容性方法，内部调用 updateUserRoles）
   */
  static async removeRole(data: {
    userId: string
    roleId: string
    companyId?: string
  }): Promise<{ message: string }> {
    // 先获取用户当前角色
    const currentRoles = await this.getUserRoles(data.userId, data.companyId)
    const currentRoleIds = currentRoles.data?.roles?.map(r => r.roleId) || []

    // 移除指定角色
    const newRoleIds = currentRoleIds.filter(id => id !== data.roleId)
    await this.updateUserRoles(data.userId, newRoleIds)

    return { message: '角色移除成功' }
  }

  /**
   * 获取所有权限（暂时返回空数组，因为后端没有此接口）
   */
  static async getPermissions(): Promise<Permission[]> {
    // 后端暂时没有权限列表接口，返回空数组
    console.warn('后端暂时没有 /api/roles/permissions 接口')
    return []
  }
}

// 导出默认实例
export const roleApi = RoleApi
