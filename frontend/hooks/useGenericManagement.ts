/**
 * 通用管理 Hook 工厂 - 封装重复的 CRUD 操作模式
 * 零重复代码，纯 React Query 实现
 */

import { useAuth } from '@/lib/auth-context-rq'
import { useApiMutation, useApiQuery, type MutationConfig, type QueryConfig } from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'

// 通用的 CRUD 操作配置
export interface CrudConfig<TEntity, TCreateData, TUpdateData> {
  entityName: string // 实体名称，用于生成消息
  queryKeys: string[] // 需要失效的查询键
  endpoints: {
    create?: string
    update?: string
    delete?: string
    list?: string
    detail?: string
  }
}

// 通用的创建 Hook 工厂
export function useGenericCreate<TEntity, TCreateData>(
  config: CrudConfig<TEntity, TCreateData, any>
) {
  const { user } = useAuth()
  
  return useApiMutation<TEntity, TCreateData>({
    url: config.endpoints.create!,
    method: 'POST',
    successMessage: `${config.entityName}创建成功`,
    invalidateQueries: config.queryKeys,
  })
}

// 通用的更新 Hook 工厂
export function useGenericUpdate<TEntity, TUpdateData>(
  config: CrudConfig<TEntity, any, TUpdateData>
) {
  return useApiMutation<TEntity, { id: string } & TUpdateData>({
    url: config.endpoints.update!,
    method: 'PUT',
    successMessage: `${config.entityName}更新成功`,
    invalidateQueries: config.queryKeys,
  })
}

// 通用的删除 Hook 工厂
export function useGenericDelete<TEntity>(
  config: CrudConfig<TEntity, any, any>
) {
  return useApiMutation<void, string>({
    url: config.endpoints.delete!,
    method: 'DELETE',
    successMessage: `${config.entityName}删除成功`,
    invalidateQueries: config.queryKeys,
  })
}

// 通用的列表查询 Hook 工厂
export function useGenericList<TEntity>(
  config: CrudConfig<TEntity, any, any>,
  queryConfig?: Partial<QueryConfig<TEntity[]>>
) {
  const { user } = useAuth()
  
  return useApiQuery<TEntity[]>({
    queryKey: [config.entityName, 'list', user?.id],
    url: config.endpoints.list!,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    ...queryConfig,
  })
}

// 通用的详情查询 Hook 工厂
export function useGenericDetail<TEntity>(
  config: CrudConfig<TEntity, any, any>,
  id: string,
  queryConfig?: Partial<QueryConfig<TEntity>>
) {
  return useApiQuery<TEntity>({
    queryKey: [config.entityName, 'detail', id],
    url: `${config.endpoints.detail!}/${id}`,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...queryConfig,
  })
}

// 通用的加入操作 Hook 工厂
export function useGenericJoin<TJoinData>(
  entityName: string,
  endpoint: string,
  invalidateQueries: string[]
) {
  const { user, refreshUser } = useAuth()
  
  return useApiMutation<any, TJoinData>({
    url: endpoint,
    method: 'POST',
    successMessage: `成功加入${entityName}`,
    invalidateQueries,
    onSuccess: async () => {
      if (refreshUser) {
        await refreshUser()
      }
    },
  })
}

// 通用的离开操作 Hook 工厂
export function useGenericLeave(
  entityName: string,
  endpoint: string,
  invalidateQueries: string[]
) {
  const { user, refreshUser } = useAuth()
  
  return useApiMutation<any, void>({
    url: endpoint,
    method: 'POST',
    successMessage: `成功离开${entityName}`,
    invalidateQueries,
    onSuccess: async () => {
      if (refreshUser) {
        await refreshUser()
      }
    },
  })
}

// 通用的批量操作 Hook 工厂
export function useGenericBatchOperation<TBatchData>(
  operationName: string,
  endpoint: string,
  invalidateQueries: string[]
) {
  return useApiMutation<any, TBatchData>({
    url: endpoint,
    method: 'POST',
    successMessage: `${operationName}操作成功`,
    invalidateQueries,
  })
}

// 通用的文件上传 Hook 工厂
export function useGenericFileUpload(
  entityName: string,
  endpoint: string,
  invalidateQueries: string[]
) {
  return useApiMutation<{ url: string }, FormData>({
    url: endpoint,
    method: 'POST',
    successMessage: `${entityName}上传成功`,
    invalidateQueries,
  })
}

// 预定义的常用配置
export const COMMON_CONFIGS = {
  company: {
    entityName: '公司',
    queryKeys: ['companies', 'user-companies', 'current-company'],
    endpoints: {
      create: '/api/companies',
      update: '/api/companies',
      delete: '/api/companies',
      list: '/api/companies',
      detail: '/api/companies',
    },
  },
  department: {
    entityName: '部门',
    queryKeys: ['departments', 'company-departments', 'department-hierarchy'],
    endpoints: {
      create: '/api/departments',
      update: '/api/departments',
      delete: '/api/departments',
      list: '/api/departments',
      detail: '/api/departments',
    },
  },
  user: {
    entityName: '用户',
    queryKeys: ['users', 'user-profile', 'user-activities'],
    endpoints: {
      create: '/api/users',
      update: '/api/users',
      delete: '/api/users',
      list: '/api/users',
      detail: '/api/users',
    },
  },
  activity: {
    entityName: '活动',
    queryKeys: ['activities', 'recent-activities', 'user-activities'],
    endpoints: {
      create: '/api/activities',
      update: '/api/activities',
      delete: '/api/activities',
      list: '/api/activities',
      detail: '/api/activities',
    },
  },
} as const

// 便捷的 Hook 生成器
export function createCrudHooks<TEntity, TCreateData, TUpdateData>(
  config: CrudConfig<TEntity, TCreateData, TUpdateData>
) {
  return {
    useCreate: () => useGenericCreate(config),
    useUpdate: () => useGenericUpdate(config),
    useDelete: () => useGenericDelete(config),
    useList: (queryConfig?: Partial<QueryConfig<TEntity[]>>) => 
      useGenericList(config, queryConfig),
    useDetail: (id: string, queryConfig?: Partial<QueryConfig<TEntity>>) => 
      useGenericDetail(config, id, queryConfig),
  }
}

// 使用示例：
// export const companyHooks = createCrudHooks(COMMON_CONFIGS.company)
// export const useCreateCompany = companyHooks.useCreate
// export const useUpdateCompany = companyHooks.useUpdate
// export const useDeleteCompany = companyHooks.useDelete
