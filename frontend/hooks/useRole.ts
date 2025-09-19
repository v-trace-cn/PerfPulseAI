/**
 * 角色权限相关的 hooks - 使用统一的API客户端
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context-rq'
// 迁移到新的纯 React Query 实现
// 角色相关功能已集成到用户查询中

// 查询键常量
export const ROLE_QUERY_KEYS = {
  roles: () => ['roles'],
  role: (roleId: string) => ['role', roleId],
  permissions: () => ['permissions'],
  userRoles: (userId: string, companyId?: string) => ['user-roles', userId, companyId],
  permissionCheck: (permission: string, companyId?: string, userId?: string) => 
    ['permission-check', permission, companyId, userId],
  adminMenus: (companyId?: string) => ['admin-menus', companyId],
}

/**
 * 获取所有角色
 */
export function useRoles() {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.roles(),
    queryFn: () => api.get('/api/roles'),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取指定角色详情
 */
export function useRole(roleId: string) {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.role(roleId),
    queryFn: () => api.get(`/api/roles/${roleId}`),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

/**
 * 获取所有权限
 */
export function usePermissions() {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.permissions(),
    queryFn: () => api.get('/api/permissions'),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

/**
 * 获取用户角色
 */
export function useUserRoles(userId?: string, companyId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: ROLE_QUERY_KEYS.userRoles(String(targetUserId), companyId),
    queryFn: () => roleApi.getUserRoles(String(targetUserId), companyId),
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 检查用户权限
 */
export function usePermissionCheck(permission: string, companyId?: string, userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id

  return useQuery({
    queryKey: ROLE_QUERY_KEYS.permissionCheck(permission, companyId, targetUserId),
    queryFn: () => roleApi.checkPermission({ permission, companyId, userId: targetUserId }),
    enabled: !!permission && !!targetUserId,
    staleTime: 60 * 1000, // 1分钟缓存
  })
}

/**
 * 检查是否可以查看管理菜单
 */
export function useCanViewAdminMenus(companyId?: string) {
  return useQuery({
    queryKey: ROLE_QUERY_KEYS.adminMenus(companyId),
    queryFn: () => roleApi.canViewAdminMenus(companyId),
    staleTime: 2 * 60 * 1000, // 2分钟缓存
  })
}

/**
 * 创建角色
 */
export function useCreateRole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleApi.createRole,
    onSuccess: (data) => {
      toast({
        title: "创建成功",
        description: `角色 "${data.name}" 已创建`,
      })
      
      // 刷新角色列表
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.roles() })
    },
    onError: (error: Error) => {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 更新角色
 */
export function useUpdateRole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: any }) => 
      roleApi.updateRole(roleId, data),
    onSuccess: (data, { roleId }) => {
      toast({
        title: "更新成功",
        description: `角色 "${data.name}" 已更新`,
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.roles() })
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.role(roleId) })
    },
    onError: (error: Error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 删除角色
 */
export function useDeleteRole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleApi.deleteRole,
    onSuccess: (data, roleId) => {
      toast({
        title: "删除成功",
        description: "角色已删除",
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.roles() })
      queryClient.removeQueries({ queryKey: ROLE_QUERY_KEYS.role(roleId) })
    },
    onError: (error: Error) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 分配角色
 */
export function useAssignRole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleApi.assignRole,
    onSuccess: (data, { userId, companyId }) => {
      toast({
        title: "分配成功",
        description: "角色已分配给用户",
      })
      
      // 刷新用户角色查询
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.userRoles(userId, companyId) })
      // 刷新权限检查缓存
      queryClient.invalidateQueries({ queryKey: ['permission-check'] })
    },
    onError: (error: Error) => {
      toast({
        title: "分配失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 移除角色
 */
export function useRemoveRole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleApi.removeRole,
    onSuccess: (data, { userId, companyId }) => {
      toast({
        title: "移除成功",
        description: "用户角色已移除",
      })
      
      // 刷新用户角色查询
      queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.userRoles(userId, companyId) })
      // 刷新权限检查缓存
      queryClient.invalidateQueries({ queryKey: ['permission-check'] })
    },
    onError: (error: Error) => {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
