/**
 * Unified API service for communicating with the backend
 * This file consolidates all API calls and provides a consistent interface
 *
 * 注意：商城相关功能已迁移到新的API系统 (@/lib/api)
 * 其他功能继续使用此文件
 */

import { getBackendApiUrl } from "./config/api-config"

// Helper function to get current user ID from localStorage
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Base API response interface
export interface ApiResponse<T = any> {
  data: T
  message: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: {
    items?: T[]
    activities?: T[]
    rewards?: T[]
    total: number
    page: number
    perPage: number
  }
  message: string
  success: boolean
}

// API Error class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Core fetch function
export async function fetchUnifiedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${getBackendApiUrl()}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add user ID to headers if available
  const userId = getCurrentUserId();
  if (userId) {
    defaultHeaders['X-User-Id'] = userId;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}

// 用户相关API
const userApi = {
  getProfile: async (userId: string) => {
    return fetchUnifiedApi(`/api/users/${userId}`)
  },
  updateProfile: async (userId: string, data: any) => {
    return fetchUnifiedApi(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
}

// 认证相关API
export const authApi = {
  login: async (data: any) => {
    return fetchUnifiedApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  register: async (data: any) => {
    return fetchUnifiedApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  logout: async () => {
    return fetchUnifiedApi('/api/auth/logout', { method: 'POST' })
  },
  resetPassword: async (email: string, password: string) => {
    return fetchUnifiedApi('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }
}

// 公司相关API
const companyApi = {
  getAll: async (userId: string) => {
    return fetchUnifiedApi('/api/companies')
  },
  getById: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/companies/${id}`)
  },
  create: async (data: any, userId: string) => {
    return fetchUnifiedApi('/api/companies', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  update: async (id: string, data: any, userId: string) => {
    return fetchUnifiedApi(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/companies/${id}`, { method: 'DELETE' })
  },
  join: async (data: any, userId: string) => {
    return fetchUnifiedApi('/api/companies/join', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  leave: async (userId: string) => {
    return fetchUnifiedApi('/api/companies/leave', { method: 'POST' })
  },
  getMembers: async (companyId: string, userId: string) => {
    return fetchUnifiedApi(`/api/companies/${companyId}/members`)
  },
  getStats: async (companyId: string, userId: string) => {
    return fetchUnifiedApi(`/api/companies/${companyId}/stats`)
  }
}

// 部门相关API
const departmentApi = {
  getAll: async (userId: string) => {
    return fetchUnifiedApi('/api/departments')
  },
  getById: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/departments/${id}`)
  },
  create: async (data: any, userId: string) => {
    return fetchUnifiedApi('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  update: async (id: string, data: any, userId: string) => {
    return fetchUnifiedApi(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/departments/${id}`, { method: 'DELETE' })
  },
  join: async (data: any, userId: string) => {
    return fetchUnifiedApi('/api/departments/join', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  leave: async (userId: string) => {
    return fetchUnifiedApi('/api/departments/leave', { method: 'POST' })
  },
  getMembers: async (departmentId: string, userId: string) => {
    return fetchUnifiedApi(`/api/departments/${departmentId}/members`)
  }
}

// 用户管理API
const userManagementApi = {
  getAll: async (userId: string, params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return fetchUnifiedApi(`/api/users${queryString}`)
  },
  getById: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/users/${id}`)
  },
  create: async (data: any, userId: string) => {
    return fetchUnifiedApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  update: async (id: string, data: any, userId: string) => {
    return fetchUnifiedApi(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  delete: async (id: string, userId: string) => {
    return fetchUnifiedApi(`/api/users/${id}`, { method: 'DELETE' })
  }
}

// 活动相关API
const activityApi = {
  getAll: async (userId: string, params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return fetchUnifiedApi(`/api/activities${queryString}`)
  },

  getRecentActivities: async (userId: string, page: number = 1, perPage: number = 10) => {
    const params = new URLSearchParams({
      user_id: userId,
      page: page.toString(),
      per_page: perPage.toString()
    })
    return fetchUnifiedApi(`/api/activities/recent?${params.toString()}`)
  },

  getActivityByShowId: async (showId: string) => {
    return fetchUnifiedApi(`/api/activities/show/${showId}`)
  }
}

// PR相关API
const prApi = {
  getAll: async (userId: string, params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return fetchUnifiedApi(`/api/pr${queryString}`)
  }
}

// 评分相关API
const scoringApi = {
  getAll: async (userId: string, params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return fetchUnifiedApi(`/api/scoring${queryString}`)
  }
}

// 统一API对象
export const unifiedApi = {
  auth: authApi,
  user: userApi,
  company: companyApi,
  department: departmentApi,
  userManagement: userManagementApi,
  activity: activityApi,
  pr: prApi,
  scoring: scoringApi
}

// 默认导出
export default unifiedApi
