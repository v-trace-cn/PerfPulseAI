/**
 * 基于 React Query 的认证 Context - 极简实现
 * 零 fetch，零 API 类，纯 React Query
 */
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthState } from '@/lib/auth-hooks';

// 导出认证相关的类型和hooks
export {
  useCurrentUser,
  useIsAuthenticated,
  useLogin,
  useRegister,
  useLogout,
  useResetPassword,
  useRefreshUser,
  useUpdateProfile,
  getCurrentUserId,
  setAuthToken,
  clearAuthToken,
  authKeys,
  useAuth as useAuthState
} from '@/lib/auth-hooks';

// 兼容旧的 AuthContext 接口
type AuthContextType = ReturnType<typeof useAuthState>;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 基于 React Query 的认证提供者
 * 
 * 这个组件只是为了保持向后兼容性
 * 实际的认证逻辑都在 React Query hooks 中
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证状态的 Hook
 * 
 * 这个 hook 提供了与旧版本完全兼容的接口
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * 认证守卫组件
 * 
 * 用于保护需要登录的页面
 */
export function AuthGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">需要登录</h2>
          <p className="text-muted-foreground">请先登录以访问此页面</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 权限守卫组件
 * 
 * 用于保护需要特定权限的组件
 */
export function PermissionGuard({
  children,
  permission,
  fallback
}: {
  children: ReactNode;
  permission: string | string[];
  fallback?: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // TODO: 实现权限检查逻辑
  // const hasPermission = checkUserPermission(user, permission);
  // if (!hasPermission) {
  //   return fallback || null;
  // }

  return <>{children}</>;
}

/**
 * 用户头像组件
 * 
 * 显示当前用户的头像和基本信息
 */
export function UserAvatar({ 
  size = 'md',
  showName = false 
}: { 
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center`}>
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name || user.email} 
            className={`${sizeClasses[size]} rounded-full object-cover`}
          />
        ) : (
          <span className="text-primary font-medium">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium">
          {user.name || user.email}
        </span>
      )}
    </div>
  );
}

/**
 * 登录状态指示器
 * 
 * 显示当前的登录状态
 */
export function LoginStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
        检查登录状态...
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        已登录为 {user.name || user.email}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-2 w-2 rounded-full bg-gray-400"></div>
      未登录
    </div>
  );
}

/**
 * 快速登录表单组件
 * 
 * 一个简单的登录表单，使用 React Query hooks
 */
export function QuickLoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          邮箱
        </label>
        <input
          type="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          密码
        </label>
        <input
          type="password"
          name="password"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
      >
        登录
      </button>
    </form>
  );
}
