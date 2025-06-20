import { useState, useCallback } from 'react';

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

type ApiResponse<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
};

/**
 * Custom hook for making API calls with loading and error states
 * @param apiFunction The API function to call
 * @returns Object containing data, loading state, error state, and execute function
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  timeout: number = 10000 // Default timeout of 10 seconds
): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState({ data: null, isLoading: true, error: null });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new TimeoutError('请求超时，请稍后再试')), timeout)
        );

        const data = await Promise.race([apiFunction(...args), timeoutPromise]);
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (error: any) {
        let errorMessage: string;
        if (error instanceof TimeoutError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = '发生未知错误，请稍后再试';
        }
        
        if (!errorMessage || errorMessage.includes('Failed to fetch') || errorMessage.includes('TypeError')) {
             errorMessage = '请求活动数据失败，请检查网络或联系管理员';
        }

        setState({ data: null, isLoading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction, timeout]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
