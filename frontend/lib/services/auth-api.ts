/**
 * 认证API服务 - 使用统一的API客户端
 */
import { api } from '@/lib/api-client'

// 类型定义
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  confirmPassword?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    avatar?: string
  }
  token: string
  message: string
}

export interface ResetPasswordRequest {
  email: string
}

// 认证API服务类
export class AuthApiService {
  /**
   * 用户登录
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post('/api/auth/login', data)
  }

  /**
   * 用户注册
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    return api.post('/api/auth/register', data)
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<{ message: string }> {
    return api.post('/api/auth/logout')
  }

  /**
   * 重置密码
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return api.post('/api/auth/reset-password', data)
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<AuthResponse['user']> {
    return api.get('/api/auth/me')
  }

  /**
   * 刷新token
   */
  static async refreshToken(): Promise<{ token: string }> {
    return api.post('/api/auth/refresh')
  }

  /**
   * 验证token
   */
  static async verifyToken(token: string): Promise<{ valid: boolean }> {
    return api.post('/api/auth/verify', { token })
  }
}

// 导出便捷方法
export const authApi = AuthApiService
