/**
 * API service for communicating with the backend
 */

import { getApiUrl } from "./config/api-config"; // Changed import path

// Generic fetch function with error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      credentials: 'include', // Include cookies for cross-origin requests
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) => 
    fetchApi<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  checkHealth: () => 
    fetchApi<{ status: string; code: number; message: string }>('/health', {
      // Skip authentication for health check
      headers: {}
    }),
};

// User API
export const userApi = {
  getProfile: () => 
    fetchApi<any>('/user/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  updateProfile: (data: any) => 
    fetchApi<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};

// Activity API
export const activityApi = {
  getActivities: () => 
    fetchApi<any[]>('/activity/list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  getActivityById: (id: number) => 
    fetchApi<any>(`/activity/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};

// Reward API
export const rewardApi = {
  getRewards: () => 
    fetchApi<any[]>('/reward/list', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  claimReward: (id: number) => 
    fetchApi<any>(`/reward/claim/${id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};

// Scoring API
export const scoringApi = {
  getScores: () => 
    fetchApi<any>('/scoring/summary', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),

  getScoreHistory: () => 
    fetchApi<any[]>('/scoring/history', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }),
};
