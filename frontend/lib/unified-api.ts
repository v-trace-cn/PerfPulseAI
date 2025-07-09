/**
 * Unified API service for communicating with the backend
 * This file consolidates all API calls and provides a consistent interface
 */

import { getApiUrl, getBackendApiUrl } from "./config/api-config";

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
    per_page: number;
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
  show_id: string;
  title: string;
  description?: string;
  status: string;
  points?: number;
  user_id: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

// Department types
export interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Generic fetch function with comprehensive error handling
async function fetchUnifiedApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(endpoint);

  console.log(`[UnifiedAPI] ${options.method || 'GET'} ${url}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': getBackendApiUrl(),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[UnifiedAPI] Error from ${endpoint}:`, errorData);
      const errorMessage = errorData.message || errorData.error || errorData.detail || `服务器错误: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[UnifiedAPI] Success from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[UnifiedAPI] Request to ${endpoint} failed:`, error);
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
    console.warn('[UnifiedAPI] WebCrypto RSA-OAEP not available, using plaintext transmission');
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
    console.error('[UnifiedAPI] RSA encryption failed, falling back to plaintext:', err);
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
      fetchUnifiedApi(`/api/activities/${activityId}/reset-points`, { method: 'POST' }),
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
    create: (name: string): Promise<ApiResponse<Department>> =>
      fetchUnifiedApi(`/api/departments/`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    getAll: (): Promise<ApiResponse<Department[]>> =>
      fetchUnifiedApi(`/api/departments/`),

    delete: (id: string): Promise<ApiResponse> =>
      fetchUnifiedApi(`/api/departments/${id}`, { method: 'DELETE' }),

    getMembers: (departmentId: string): Promise<ApiResponse<any[]>> =>
      fetchUnifiedApi(`/api/departments/${departmentId}/members`),
  },

  // Scoring API
  scoring: {
    getDimensions: (): Promise<ApiResponse<{ [key: string]: string }>> =>
      fetchUnifiedApi(`/api/scoring/dimensions`),
  },
};

// Export individual APIs for backward compatibility
export const { auth: authApi, user: userApi, activity: activityApi, pr: prApi, department: departmentApi, scoring: scoringApi } = unifiedApi;

// Default export
export default unifiedApi;
