/**
 * 角色权限相关的 hooks - 纯 React Query 实现
 * 注意：角色权限功能暂未实现，相关函数已移除
 */

export const ROLE_QUERY_KEYS = {
  roles: () => ['roles'],
  role: (roleId: string) => ['role', roleId],
  permissions: () => ['permissions'],
  userRoles: (userId: string, companyId?: string) => ['user-roles', userId, companyId],
  permissionCheck: (permission: string, companyId?: string, userId?: string) =>
    ['permission-check', permission, companyId, userId],
  adminMenus: (companyId?: string) => ['admin-menus', companyId],
};



