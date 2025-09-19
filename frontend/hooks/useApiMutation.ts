/**
 * 临时兼容层 - useApiMutation Hook
 * 为了快速修复导入错误而创建的兼容版本
 * 
 * TODO: 逐步迁移到新的API系统
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { ApiError } from './useApiQuery'

// 成功消息常量
export const SUCCESS_MESSAGES = {
  CREATE: '创建成功',
  UPDATE: '更新成功',
  DELETE: '删除成功',
  SAVE: '保存成功',
  SUBMIT: '提交成功',
}

// Mutation选项接口
interface ApiMutationOptions<TData = any, TVariables = any> {
  successMessage?: string
  errorMessage?: string
  invalidateQueries?: string[]
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: ApiError, variables: TVariables) => void
}

/**
 * 兼容版本的useApiMutation Hook
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: ApiMutationOptions<TData, TVariables> = {}
) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const {
    successMessage,
    errorMessage,
    invalidateQueries = [],
    onSuccess,
    onError,
  } = options

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      try {
        const response = await mutationFn(variables)
        
        // 如果响应有success字段且为false，抛出错误
        if (response?.success === false) {
          throw new Error(response.message || '操作失败')
        }
        
        return response?.data || response
      } catch (error) {
        // 转换错误格式
        const apiError: ApiError = {
          message: error?.message || error?.response?.data?.message || '操作失败',
          status_code: error?.response?.status || 500,
          details: error?.response?.data || error,
        }
        throw apiError
      }
    },
    onSuccess: (data, variables) => {
      // 显示成功消息
      if (successMessage) {
        toast({
          title: "操作成功",
          description: successMessage,
          variant: "default",
        })
      }
      
      // 刷新相关查询
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      })
      
      // 调用自定义成功回调
      onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      // 显示错误消息
      const message = errorMessage || error.message || '操作失败'
      toast({
        title: "操作失败",
        description: message,
        variant: "destructive",
      })
      
      // 调用自定义错误回调
      onError?.(error, variables)
    },
  })
}

/**
 * 创建操作的Hook
 */
export function useCreateMutation<TData = any, TVariables = any>(
  createFn: (variables: TVariables) => Promise<TData>,
  options: Omit<ApiMutationOptions<TData, TVariables>, 'successMessage'> & { 
    entityName?: string 
  } = {}
) {
  const { entityName = '项目', ...restOptions } = options
  
  return useApiMutation(createFn, {
    successMessage: `${entityName}${SUCCESS_MESSAGES.CREATE}`,
    ...restOptions,
  })
}

/**
 * 更新操作的Hook
 */
export function useUpdateMutation<TData = any, TVariables = any>(
  updateFn: (variables: TVariables) => Promise<TData>,
  options: Omit<ApiMutationOptions<TData, TVariables>, 'successMessage'> & { 
    entityName?: string 
  } = {}
) {
  const { entityName = '项目', ...restOptions } = options
  
  return useApiMutation(updateFn, {
    successMessage: `${entityName}${SUCCESS_MESSAGES.UPDATE}`,
    ...restOptions,
  })
}

/**
 * 删除操作的Hook
 */
export function useDeleteMutation<TData = any, TVariables = any>(
  deleteFn: (variables: TVariables) => Promise<TData>,
  options: Omit<ApiMutationOptions<TData, TVariables>, 'successMessage'> & { 
    entityName?: string 
  } = {}
) {
  const { entityName = '项目', ...restOptions } = options
  
  return useApiMutation(deleteFn, {
    successMessage: `${entityName}${SUCCESS_MESSAGES.DELETE}`,
    ...restOptions,
  })
}
