import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataLoaderProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

/**
 * 数据加载状态管理组件
 */
export function DataLoader<T>({
  data,
  isLoading,
  error,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
}: DataLoaderProps<T>) {
  // 加载中状态
  if (isLoading) {
    return (
      <>
        {loadingComponent || (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </>
    );
  }
  
  // 错误状态
  if (error) {
    return (
      <>
        {errorComponent || (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || '加载数据时出错，请稍后重试'}
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  }
  
  // 空数据状态
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <>
        {emptyComponent || (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">暂无数据</p>
          </div>
        )}
      </>
    );
  }
  
  // 正常数据渲染
  return <>{children(data)}</>;
}

/**
 * 简化的加载状态组件
 */
export function LoadingSpinner({ size = 'default', text }: { size?: 'small' | 'default' | 'large'; text?: string }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon = AlertCircle, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * 错误显示组件
 */
export function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: Error | { message: string }; 
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || '发生错误，请稍后重试'}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm underline hover:no-underline"
          >
            重试
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}