/**
 * 认证相关查询 - 纯 React Query 实现
 */

import { useApiMutation } from '@/lib/query-client'

// ==================== 类型定义 ====================

export interface VerifyInviteCodeRequest {
  inviteCode: string
}

export interface VerifyInviteCodeResponse {
  success: boolean
  data: {
    valid: boolean
    message?: string
  }
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  inviteCode?: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: any
    token: string
  }
  message: string
}

// ==================== 变更 Hooks ====================

/**
 * 验证邀请码
 */
export function useVerifyInviteCode() {
  return useApiMutation<VerifyInviteCodeResponse, VerifyInviteCodeRequest>({
    url: '/api/auth/verify-invite-code',
    method: 'POST',
  })
}

/**
 * 用户登录
 */
export function useLogin() {
  return useApiMutation<AuthResponse, LoginRequest>({
    url: '/api/auth/login',
    method: 'POST',
    successMessage: '登录成功',
  })
}

/**
 * 用户注册
 */
export function useRegister() {
  return useApiMutation<AuthResponse, RegisterRequest>({
    url: '/api/auth/register',
    method: 'POST',
    successMessage: '注册成功',
  })
}

/**
 * 重置密码
 */
export function useResetPassword() {
  return useApiMutation<any, ResetPasswordRequest>({
    url: '/api/auth/reset-password',
    method: 'POST',
    successMessage: '重置密码邮件已发送',
  })
}
