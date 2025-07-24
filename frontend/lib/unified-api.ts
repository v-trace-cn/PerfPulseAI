/**
 * Unified API service for communicating with the backend
 * This file consolidates all API calls and provides a consistent interface
 */

import { getApiUrl } from "./config/api-config";

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> {
  data: {
    items?: T[];
    activities?: T[];
    rewards?: T[];
    total: number;
    page: number;
    perPage: number;
  };
  message: string;
  success: boolean;
}

// User types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  githubUrl?: string;
  avatar?: string;
  department?: string;
  departmentId?: number;
  position?: string;
  phone?: string;
  joinDate?: string;
  points: number;
  total_points: number;
  level: number;
  completed_activities_count?: number;
  pendingTasks?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Activity types
export interface Activity {
  id: string;
  showId: string;
  title: string;
  description?: string;
  status: string;
  points?: number;
  userId: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  activityType?: string;
  diffUrl?: string;
  user?: any;
  aiAnalysis?: string;
  aiAnalysisStartedAt?: string;
  aiAnalysisCompletedAt?: string;
  pointsCalculatedAt?: string;
}

// Department types
export interface Department {
  id: number;
  name: string;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

// Generic fetch function with comprehensive error handling
async function fetchUnifiedApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(endpoint);
  
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const errorMessage = errorData.message || errorData.error || errorData.detail || `服务器错误: ${response.status}`;

      // 创建一个包含更多信息的错误对象
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.detail = errorData.detail;
      error.response = errorData;
      throw error;
    }

    const data = await response.json();

    return data;
  } catch (error) {

    throw error;
  }
}

// RSA encryption utilities (moved from direct-api.ts)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

async function fetchPublicKey(): Promise<string> {
  const res = await fetchUnifiedApi<{ data: { public_key: string } }>(`/api/auth/public_key`, { method: 'POST' });
  return res.data.public_key;
}

async function encryptPayload(payload: any): Promise<string | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle?.importKey) {
    // WebCrypto警告日志已移除
    return null;
  }

  try {
    const pem = (await fetchPublicKey())
      .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
    const binaryDer = window.atob(pem);
    const binaryDerArr = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) binaryDerArr[i] = binaryDer.charCodeAt(i);
    const key = await window.crypto.subtle.importKey(
      'spki', binaryDerArr.buffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false, ['encrypt']
    );
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' }, key, encoded
    );
    return arrayBufferToBase64(encrypted);
  } catch (err) {

    return null;
  }
}

// Unified API service
export const unifiedApi = {
  // Auth API
  auth: {
    login: async (email: string, password: string): Promise<ApiResponse<{ userId: string; name: string; email: string }>> => {
      const encrypted = await encryptPayload({ email, password });
      const body = encrypted ? { encrypted } : { email, password };
      return fetchUnifiedApi(`/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    register: async (email: string, password: string, name: string): Promise<ApiResponse<{ userId: string; name: string; email: string }>> => {
      const encrypted = await encryptPayload({ email, password, name });
      const body = encrypted ? { encrypted } : { email, password, name };
      return fetchUnifiedApi(`/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    resetPassword: async (email: string, password: string): Promise<ApiResponse> => {
      const encrypted = await encryptPayload({ email, password });
      const body = encrypted ? { encrypted } : { email, password };
      return fetchUnifiedApi(`/api/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },

    verifyInviteCode: async (inviteCode: string): Promise<ApiResponse<{ valid: boolean }>> => {
      return fetchUnifiedApi(`/api/auth/verify-invite-code`, {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });
    },

    checkHealth: (): Promise<{ status: string; code: number; message: string }> => 
      fetchUnifiedApi(`/api/health`),
  },

  // User API
  user: {
    getProfile: async (userId: string): Promise<UserProfile> => {
      const res = await fetchUnifiedApi<ApiResponse<UserProfile>>(`/api/users/${userId}`);
      return res.data;
    },

    updateProfile: (userId: string, data: Partial<UserProfile>): Promise<ApiResponse> => 
      fetchUnifiedApi(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateUserInfo: (userId: string, data: Partial<UserProfile>): Promise<ApiResponse> => 
      fetchUnifiedApi(`/api/users/${userId}/updateInfo`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    uploadAvatar: (userId: string, file: File): Promise<ApiResponse<{ avatar: string }>> => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchUnifiedApi(`/api/users/${userId}/upload_avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
    },
  },

  // Activity API
  activity: {
    getRecentActivities: (
      userId: string,
      page: number = 1,
      perPage: number = 10
    ): Promise<PaginatedResponse<Activity>> =>
      fetchUnifiedApi(`/api/activities/recent?user_id=${userId}&page=${page}&per_page=${perPage}`),

    getActivityByShowId: (showId: string): Promise<ApiResponse<Activity>> =>
      fetchUnifiedApi(`/api/activities/show/${showId}`),

    resetActivityPoints: (activityId: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/activities/${activityId}/reset-points`, {
        method: 'POST',
        headers: {
          'X-User-ID': getCurrentUserId()?.toString() || '',
        }
      }),
  },

  // Pull Request API
  pr: {
    analyzePr: (prNodeId: string): Promise<{ message: string; analysis_result: any }> =>
      fetchUnifiedApi(`/api/pr/${prNodeId}/analyze`, { method: 'POST' }),

    calculatePrPoints: (activityShowId: string): Promise<{ message: string; points_awarded: number }> =>
      fetchUnifiedApi(`/api/pr/${activityShowId}/calculate-points`, { method: 'POST' }),

    getPullRequestDetails: (prNodeId: string): Promise<any> =>
      fetchUnifiedApi(`/api/pr/${prNodeId}`),
  },

  // Department API
  department: {
    create: (data: any, userId?: string): Promise<ApiResponse<Department>> =>
      fetchUnifiedApi(`/api/departments/`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    getAll: (userId?: string, companyId?: number): Promise<ApiResponse<Department[]>> =>
      fetchUnifiedApi(`/api/departments/${companyId ? `?company_id=${companyId}` : ''}`, {
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    getById: (id: number, userId?: string): Promise<ApiResponse<Department>> =>
      fetchUnifiedApi(`/api/departments/${id}`, {
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    update: (id: number, data: any, userId?: string): Promise<ApiResponse<Department>> =>
      fetchUnifiedApi(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    delete: (id: number, userId?: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    getMembers: (departmentId: number, userId?: string): Promise<ApiResponse<any[]>> =>
      fetchUnifiedApi(`/api/departments/${departmentId}/members`, {
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    join: (departmentId: number, userId?: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/departments/${departmentId}/join`, {
        method: 'POST',
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    leave: (userId?: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/departments/leave`, {
        method: 'POST',
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    associateToCompany: (companyId: number, userId?: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/departments/associate-company`, {
        method: 'POST',
        body: JSON.stringify({ companyId }),
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    getStats: (departmentId: number, userId?: string, timeRange?: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/departments/${departmentId}/stats${timeRange ? `?timeRange=${timeRange}` : ''}`, {
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    exportData: (departmentId: number, format: 'csv' | 'excel', userId?: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/departments/${departmentId}/export?format=${format}`, {
        headers: {
          'X-User-ID': userId || '',
        },
      }),
  },

  // Scoring API
  scoring: {
    getDimensions: (): Promise<ApiResponse<{ [key: string]: string }>> =>
      fetchUnifiedApi(`/api/scoring/dimensions`),
  },

  // Company API
  company: {
    getAll: (userId: string): Promise<ApiResponse<any[]>> =>
      fetchUnifiedApi(`/api/companies/`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    getAvailable: (userId: string, search?: string): Promise<ApiResponse<any[]>> =>
      fetchUnifiedApi(`/api/companies/available${search ? `?search=${encodeURIComponent(search)}` : ''}`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    getById: (id: number, userId: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/${id}`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    create: (data: any): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'X-User-ID': data.creatorUserId,
        },
      }),

    update: (id: number, data: any): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'X-User-ID': data.userId,
        },
      }),

    delete: (id: number, userId: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/companies/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userId,
        },
      }),

    getStats: (id: number, userId: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/${id}/stats`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    joinByInviteCode: (inviteCode: string, userId?: string, forceJoin?: boolean): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/join`, {
        method: 'POST',
        body: JSON.stringify({ inviteCode, userId, forceJoin }),
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    leaveCompany: (userId?: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/leave`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: {
          'X-User-ID': userId || '',
        },
      }),

    getByInviteCode: (inviteCode: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/companies/invite-code/${inviteCode}`),
  },





  // Permission API
  permission: {
    getAll: (userId: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/permissions/`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    getCategories: (userId: string): Promise<ApiResponse<any[]>> =>
      fetchUnifiedApi(`/api/permissions/categories`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    getUserPermissions: (targetUserId: number, userId: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/permissions/user/${targetUserId}`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    checkUserPermissions: (targetUserId: number, permissions: string, userId: string): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/permissions/check/${targetUserId}?permissions=${encodeURIComponent(permissions)}`, {
        headers: {
          'X-User-ID': userId,
        },
      }),

    getDefinitions: (): Promise<ApiResponse<any>> =>
      fetchUnifiedApi(`/api/permissions/definitions`),
  },
};

// Export individual APIs for backward compatibility
export const {
  auth: authApi,
  user: userApi,
  activity: activityApi,
  pr: prApi,
  department: departmentApi,
  scoring: scoringApi,
  company: companyApi,
  permission: permissionApi
} = unifiedApi;

// Default export
export default unifiedApi;
