# API 集成文档

## API 架构概述

PerfPulseAI 前端采用多层 API 架构，包括前端 API 路由、统一 API 客户端和后端服务集成。

## API 层次结构

```
Frontend Components
        ↓
   Custom Hooks (SWR)
        ↓
   Unified API Client
        ↓
   Frontend API Routes
        ↓
   Backend Services
```

## 统一 API 客户端

### 1. 核心配置 (`lib/unified-api.ts`)

```typescript
// 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 统一请求函数
export async function fetchUnifiedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

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
```

### 2. API 模块化组织

```typescript
export const unifiedApi = {
  // 认证相关
  auth: {
    login: (credentials: LoginCredentials) => 
      fetchUnifiedApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    
    logout: () => 
      fetchUnifiedApi('/api/auth/logout', { method: 'POST' }),
    
    refreshToken: () => 
      fetchUnifiedApi('/api/auth/refresh', { method: 'POST' })
  },

  // 用户相关
  user: {
    getProfile: (userId: string) => 
      fetchUnifiedApi(`/api/users/${userId}`),
    
    updateProfile: (userId: string, data: UserUpdateData) => 
      fetchUnifiedApi(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // 积分相关
  points: {
    getBalance: (userId: string) => 
      fetchUnifiedApi('/api/points/balance', {
        headers: { 'X-User-Id': userId }
      }),
    
    getTransactions: (userId: string, params?: TransactionParams) => 
      fetchUnifiedApi(`/api/points/transactions?${new URLSearchParams(params)}`, {
        headers: { 'X-User-Id': userId }
      })
  },

  // 公司相关
  company: {
    getAll: (userId: string) => 
      fetchUnifiedApi('/api/companies/', {
        headers: { 'X-User-ID': userId }
      }),
    
    create: (data: CompanyCreateData) => 
      fetchUnifiedApi('/api/companies/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'X-User-ID': data.creatorUserId }
      })
  }
};
```

## 前端 API 路由

### 1. 认证路由 (`app/api/auth/`)

#### 登录路由
```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // RSA 加密处理
    const encryptedData = await encryptCredentials(body);
    
    // 调用后端 API
    const response = await fetch(`${getBackendApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encryptedData),
    });

    if (!response.ok) {
      throw new Error('登录失败');
    }

    const data = await response.json();
    
    // 设置 Cookie
    const responseHeaders = new Headers();
    responseHeaders.set('Set-Cookie', `auth-token=${data.token}; HttpOnly; Path=/`);
    
    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: '登录失败' },
      { status: 401 }
    );
  }
}
```

### 2. 积分路由 (`app/api/points/`)

#### 积分余额查询
```typescript
// app/api/points/balance/route.ts
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  
  if (!userId) {
    return NextResponse.json(
      { error: '未提供用户ID' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${getBackendApiUrl()}/api/points/balance`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '获取积分余额失败' },
      { status: 500 }
    );
  }
}
```

### 3. 商城路由 (`app/api/mall/`)

#### 公司级别购买记录
```typescript
// app/api/mall/purchases/company/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('page_size') || '20';
  const status = searchParams.get('status') || '';

  const userId = request.headers.get('X-User-Id');

  if (!userId) {
    return NextResponse.json(
      { error: '未提供用户ID，请先登录' },
      { status: 401 }
    );
  }

  try {
    let url = `${getBackendApiUrl()}/api/mall/purchases/company?limit=${pageSize}&offset=${(parseInt(page) - 1) * parseInt(pageSize)}`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-User-Id': userId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

## 数据获取 Hooks

### 1. SWR 集成

```typescript
// lib/hooks/use-points.ts
import useSWR from 'swr';
import { unifiedApi } from '@/lib/unified-api';

export function usePoints(userId: string) {
  const { data, error, mutate } = useSWR(
    userId ? ['points-balance', userId] : null,
    () => unifiedApi.points.getBalance(userId),
    {
      refreshInterval: 30000, // 30秒刷新一次
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    points: data?.points || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}
```

### 2. 通知数据获取

```typescript
// hooks/useNotifications.ts
export function useNotifications(type?: NotificationType) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications${type ? `?type=${type}` : ''}`, {
        headers: { 'X-User-Id': String(user.id) },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, type]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    refetch: fetchNotifications,
    markAsRead: async (id: string) => {
      // 标记已读逻辑
    },
    deleteNotification: async (id: string) => {
      // 删除通知逻辑
    }
  };
}
```

## 错误处理

### 1. API 错误类型

```typescript
// lib/types/api.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}
```

### 2. 全局错误处理

```typescript
// lib/api-error-handler.ts
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return '请重新登录';
      case 403:
        return '权限不足';
      case 404:
        return '资源不存在';
      case 500:
        return '服务器错误，请稍后重试';
      default:
        return error.message || '请求失败';
    }
  }
  
  return '网络错误，请检查网络连接';
}
```

## 缓存策略

### 1. SWR 缓存配置

```typescript
// lib/swr-config.ts
export const swrConfig = {
  refreshInterval: 0, // 默认不自动刷新
  revalidateOnFocus: false, // 焦点时不重新验证
  revalidateOnReconnect: true, // 重连时重新验证
  shouldRetryOnError: true, // 错误时重试
  errorRetryCount: 3, // 最大重试次数
  errorRetryInterval: 5000, // 重试间隔
  dedupingInterval: 2000, // 去重间隔
};
```

### 2. 本地存储缓存

```typescript
// lib/cache.ts
export class LocalCache {
  private static instance: LocalCache;
  
  static getInstance(): LocalCache {
    if (!LocalCache.instance) {
      LocalCache.instance = new LocalCache();
    }
    return LocalCache.instance;
  }

  set(key: string, value: any, ttl?: number): void {
    const item = {
      value,
      timestamp: Date.now(),
      ttl: ttl || 0,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  get(key: string): any {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  }
}
```

## 请求拦截器

### 1. 认证拦截器

```typescript
// lib/interceptors.ts
export function withAuth(request: RequestInit): RequestInit {
  const token = getAuthToken();
  
  return {
    ...request,
    headers: {
      ...request.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
}
```

### 2. 错误重试拦截器

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries) break;
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  
  throw lastError!;
}
```

## 类型安全

### 1. API 响应类型

```typescript
// lib/types/api-responses.ts
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  level: number;
}

export interface PointsBalanceResponse {
  balance: number;
  level: number;
  nextLevelPoints: number;
}

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}
```

### 2. 请求参数类型

```typescript
// lib/types/api-requests.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CompanyCreateData {
  name: string;
  description?: string;
  domain?: string;
  creatorUserId: string;
}

export interface TransactionParams {
  page?: string;
  limit?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}
```
