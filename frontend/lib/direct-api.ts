/**
 * Direct API service for communicating with the backend without Next.js API routes
 */

// Base URL for the backend API
const BACKEND_API_URL = 'http://localhost:5000';
// Base URL for our Next.js API routes (use backend URL to directly call API)
const NEXTJS_API_URL = BACKEND_API_URL;

// Generic fetch function with error handling and detailed logging
async function fetchDirectApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${NEXTJS_API_URL}${endpoint}`;
  console.log(`Making direct API request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    console.log(`Response status from ${endpoint}:`, response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API error from ${endpoint}:`, errorData);
      const errorMessage = errorData.message || errorData.error || `u670du52a1u5668u9519u8bef: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`Successful response from ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// RSA 加密辅助函数
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

async function fetchPublicKey(): Promise<string> {
  const res = await fetchDirectApi<{ data: { public_key: string } }>(`/api/auth/public_key`, { method: 'POST' });
  return res.data.public_key;
}

async function encryptPayload(payload: any): Promise<string | null> {
  // 若浏览器环境不支持 WebCrypto.subtle，则返回 null 表示无法加密
  if (typeof window === 'undefined' || !window.crypto?.subtle?.importKey) {
    console.warn('WebCrypto RSA-OAEP 不可用，注册/登录将使用明文传输（仅开发环境建议）');
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
    console.error('RSA 加密失败，降级为明文传输：', err);
    return null;
  }
}

// Auth API
export const directAuthApi = {
  login: async (email: string, password: string) => {
    const encrypted = await encryptPayload({ email, password });
    const body = encrypted ? { encrypted } : { email, password };
    return fetchDirectApi<{ success: boolean; message: string; data?: { userId: string; name: string; email: string } }>(
      `${NEXTJS_API_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  register: async (email: string, password: string, name: string) => {
    const encrypted = await encryptPayload({ email, password, name });
    const body = encrypted ? { encrypted } : { email, password, name };
    return fetchDirectApi<{ success: boolean; message: string; data?: { userId: string; name: string; email: string } }>(
      `${NEXTJS_API_URL}/api/auth/register`, {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  resetPassword: async (email: string, password: string) => {
    const encrypted = await encryptPayload({ email, password });
    const body = encrypted ? { encrypted } : { email, password };
    return fetchDirectApi<{ success: boolean; message: string }>(
      `${NEXTJS_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  checkHealth: () => 
    fetchDirectApi<{ status: string; code: number; message: string }>(`${NEXTJS_API_URL}/api/health`),
};

// User API
export const directUserApi = {
  getProfile: async (token: string) => {
    const res = await fetchDirectApi<{ data: any; message: string; success: boolean }>(
      `${NEXTJS_API_URL}/api/users/${token}`
    );
    return res.data;
  },
  updateProfile: (token: string, data: any) => 
    fetchDirectApi<any>(`${NEXTJS_API_URL}/api/users/${token}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  updateUserInfo: (userId: string, data: any) => 
    fetchDirectApi<any>(`${BACKEND_API_URL}/api/users/${userId}/updateInfo`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadAvatar: (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchDirectApi<any>(`${BACKEND_API_URL}/api/users/${userId}/upload_avatar`, {
      method: 'POST',
      body: formData, // 直接发送 FormData，不要 JSON.stringify
      headers: { // 移除 Content-Type，让浏览器自动设置 multipart/form-data
        'Accept': 'application/json',
      },
    });
  },
};

// Activity API
export const directActivityApi = {
  getActivities: (token: string) => 
    fetchDirectApi<any[]>('/activity/list', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  getRecentActivities: (userId: string) => 
    fetchDirectApi<{ data: any[]; message: string; success: boolean }>(`${BACKEND_API_URL}/api/activities/recent?user_id=${userId}`),
  getActivityByShowId: (showId: string) =>
    fetchDirectApi<{ data: any; message: string; success: boolean }>(
      `${BACKEND_API_URL}/api/activities/show/${showId}`
    ),
};

// Pull Request API
export const directPrApi = {
  analyzePr: (prNodeId: string) =>
    fetchDirectApi<{ message: string; analysis_result: any }>(`${BACKEND_API_URL}/api/pr/${prNodeId}/analyze`, {
      method: 'POST',
    }),
};

// Reward API
export const directRewardApi = {
  getRewards: (token: string) => 
    fetchDirectApi<any[]>('/reward/list', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Scoring API
export const directScoringApi = {
  submitScore: (token: string, data: any) => 
    fetchDirectApi<any>('/scoring/submit', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};
