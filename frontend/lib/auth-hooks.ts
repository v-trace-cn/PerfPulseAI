/**
 * 认证 React Query Hooks - 极简实现
 * 零 fetch，零 API 类，纯 React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api-client'
import { User } from '@/lib/types'

// ==================== 类型定义 ====================
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  success: boolean
  data: {
    userId: string
    user: User
  }
  message?: string
}

export interface ResetPasswordRequest {
  email: string
  password: string
}

// ==================== 查询键 ====================
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  profile: (userId: string) => [...authKeys.all, 'profile', userId] as const,
}

// ==================== 工具函数 ====================

/**
 * 获取当前用户ID
 */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * 设置认证token
 */
export function setAuthToken(userId: string, remember: boolean = true) {
  if (typeof window === 'undefined') return
  
  if (remember) {
    localStorage.setItem('token', userId)
    sessionStorage.removeItem('token')
  } else {
    sessionStorage.setItem('token', userId)
    localStorage.removeItem('token')
  }
}

/**
 * 清除认证token
 */
export function clearAuthToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

// ==================== 查询 Hooks ====================

/**
 * 获取当前用户信息
 */
export function useCurrentUser() {
  const userId = getCurrentUserId()

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      if (!userId) {
        return null // 返回 null 而不是抛出错误
      }
      return api.get(`/api/users/by-id/${userId}`)
    },
    enabled: !!userId, // 只有在有 userId 时才启用查询
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: (failureCount, error: any) => {
      // 如果是401错误，不重试
      if (error?.response?.status === 401) {
        clearAuthToken()
        return false
      }
      return failureCount < 2
    },
  })
}

/**
 * 检查用户是否已认证
 */
export function useIsAuthenticated() {
  const userId = getCurrentUserId()
  const { data: user, isLoading, error } = useCurrentUser()

  return {
    isAuthenticated: !!userId && !!user && !error,
    isLoading: !!userId && isLoading, // 只有在有 userId 时才显示加载状态
    user: user?.data || null,
  }
}

// ==================== 变更 Hooks ====================

/**
 * 用户登录
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ email, password, remember = true }: LoginRequest & { remember?: boolean }) => {
      const response = await api.post('/api/auth/login', { email, password })
      
      if (!response.success || !response.data?.userId) {
        throw new Error(response.message || '登录失败')
      }
      
      // 设置认证token
      setAuthToken(response.data.userId, remember)
      
      return response
    },
    onSuccess: (data) => {
      // 刷新用户数据
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
      toast({ title: "登录成功", description: "欢迎回来！" })
    },
    onError: (error: any) => {
      toast({ 
        title: "登录失败", 
        description: error.message || "请检查您的邮箱和密码", 
        variant: "destructive" 
      })
    }
  })
}

/**
 * 用户注册
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ email, password, name }: RegisterRequest) => {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        name: name || email.split('@')[0]
      })
      
      if (!response.success || !response.data?.userId) {
        throw new Error(response.message || '注册失败')
      }
      
      // 自动登录
      setAuthToken(response.data.userId, true)
      
      return response
    },
    onSuccess: () => {
      // 刷新用户数据
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
      toast({ title: "注册成功", description: "账号已创建，欢迎加入！" })
    },
    onError: (error: any) => {
      toast({ 
        title: "注册失败", 
        description: error.message || "请稍后再试", 
        variant: "destructive" 
      })
    }
  })
}

/**
 * 用户登出
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async () => {
      // 清除本地token
      clearAuthToken()
      return { success: true }
    },
    onSuccess: () => {
      // 清除所有缓存
      queryClient.clear()
      toast({ title: "已退出登录" })
    }
  })
}

/**
 * 重置密码
 */
export function useResetPassword() {
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ email, password }: ResetPasswordRequest) => {
      return api.post('/api/auth/reset-password', { email, password })
    },
    onSuccess: () => {
      toast({ title: "密码重置成功", description: "您的密码已成功重置。" })
    },
    onError: (error: any) => {
      toast({ 
        title: "密码重置失败", 
        description: error.message || "请稍后再试。", 
        variant: "destructive" 
      })
    }
  })
}

/**
 * 刷新用户数据
 */
export function useRefreshUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const userId = getCurrentUserId()
      if (!userId) throw new Error('未登录')
      
      return api.get(`/api/users/by-id/${userId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    }
  })
}

/**
 * 更新用户资料
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const userId = getCurrentUserId()
      if (!userId) throw new Error('未登录')
      
      return api.put(`/api/users/${userId}`, userData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
      toast({ title: "资料更新成功" })
    },
    onError: (error: any) => {
      toast({ 
        title: "更新失败", 
        description: error.message || "请稍后再试", 
        variant: "destructive" 
      })
    }
  })
}

// ==================== 组合 Hooks ====================

/**
 * 完整的认证状态和操作
 */
export function useAuth() {
  const { isAuthenticated, isLoading, user } = useIsAuthenticated()
  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const logoutMutation = useLogout()
  const refreshMutation = useRefreshUser()
  
  return {
    // 状态
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error?.message || registerMutation.error?.message || null,
    
    // 操作
    login: async (email: string, password: string, remember = true) => {
      try {
        await loginMutation.mutateAsync({ email, password, remember })
        return true
      } catch {
        return false
      }
    },
    
    register: async (email: string, password: string, name?: string) => {
      try {
        await registerMutation.mutateAsync({ email, password, name })
        return true
      } catch {
        return false
      }
    },
    
    logout: () => logoutMutation.mutate(),
    
    refreshUser: () => refreshMutation.mutate(),
    
    // 兼容旧API
    updateUser: (userData: Partial<User>) => {
      // 这个方法在新架构中通过 useUpdateProfile 实现
      console.warn('updateUser is deprecated, use useUpdateProfile hook instead')
    }
  }
}
