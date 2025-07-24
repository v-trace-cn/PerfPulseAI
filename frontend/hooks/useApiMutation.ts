import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { ApiResponse, ApiError } from './useApiQuery';

export interface UseApiMutationOptions<TData, TVariables> extends Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  'mutationFn'
> {
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[];
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * 统一的API变更Hook
 * @param mutationFn - 执行变更的函数
 * @param options - 配置选项
 */
export function useApiMutation<TData = any, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    successMessage = "操作成功",
    errorMessage = "操作失败",
    invalidateQueries = [],
    showSuccessToast = true,
    showErrorToast = true,
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};
  
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables);
        
        if (!response.success) {
          throw new Error(response.message || errorMessage);
        }
        
        return response.data;
      } catch (error: any) {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || errorMessage,
          status_code: error.response?.status || 500
        };
        throw apiError;
      }
    },
    onSuccess: (data, variables, context) => {
      // 显示成功提示
      if (showSuccessToast) {
        toast({
          title: successMessage,
          variant: "default",
        });
      }
      
      // 使相关查询失效
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
      
      // 调用自定义成功处理
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // 显示错误提示
      if (showErrorToast) {
        toast({
          title: errorMessage,
          description: error.message,
          variant: "destructive",
        });
      }
      
      // 调用自定义错误处理
      onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * 预定义的成功消息
 */
export const SUCCESS_MESSAGES = {
  CREATE: "创建成功",
  UPDATE: "更新成功",
  DELETE: "删除成功",
  SAVE: "保存成功",
  SUBMIT: "提交成功",
  UPLOAD: "上传成功",
  SEND: "发送成功",
} as const;

/**
 * 预定义的错误消息
 */
export const ERROR_MESSAGES = {
  CREATE: "创建失败",
  UPDATE: "更新失败",
  DELETE: "删除失败",
  SAVE: "保存失败",
  SUBMIT: "提交失败",
  UPLOAD: "上传失败",
  SEND: "发送失败",
  NETWORK: "网络错误，请稍后重试",
} as const;