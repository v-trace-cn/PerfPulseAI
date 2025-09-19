import { useAuth } from '@/lib/auth-context-rq';
// 迁移到新的纯 React Query 实现
import { useApiQuery, useApiMutation } from '@/lib/queries';

export interface BaseEntity {
  id: number | string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseFormData {
  name: string;
  description?: string;
}

export interface BaseAPIService<T extends BaseEntity, F extends BaseFormData> {
  getAll: (userId: string, ...args: any[]) => Promise<T[]>;
  getById: (id: number | string, userId: string) => Promise<T>;
  create: (data: F, userId: string) => Promise<T>;
  update: (id: number | string, data: F, userId: string) => Promise<T>;
  delete: (id: number | string, userId: string) => Promise<void>;
}

/**
 * 基础管理Hook类
 * 提供通用的CRUD操作hooks
 */
export class BaseManagementHooks<T extends BaseEntity, F extends BaseFormData> {
  private apiService: BaseAPIService<T, F>;
  private entityName: string;
  private queryKeys: {
    list: string;
    detail: string;
  };

  constructor(
    apiService: BaseAPIService<T, F>,
    entityName: string,
    queryKeys: { list: string; detail: string }
  ) {
    this.apiService = apiService;
    this.entityName = entityName;
    this.queryKeys = queryKeys;
  }

  /**
   * 获取列表的Hook
   */
  useList(...args: any[]) {
    const { user } = useAuth();
    
    return useApiQuery(
      [this.queryKeys.list, user?.id, ...args],
      () => this.apiService.getAll(user?.id || '', ...args),
      {
        enabled: !!user?.id,
        staleTime: 60000, // 1分钟缓存
      }
    );
  }

  /**
   * 获取单个实体的Hook
   */
  useDetail(id: number | string) {
    const { user } = useAuth();
    
    return useApiQuery(
      [this.queryKeys.detail, id, user?.id],
      () => this.apiService.getById(id, user?.id || ''),
      {
        enabled: !!id && !!user?.id,
        staleTime: 60000, // 1分钟缓存
      }
    );
  }

  /**
   * 创建实体的Hook
   */
  useCreate() {
    const { user } = useAuth();
    
    return useApiMutation(
      (data: F) => this.apiService.create(data, user?.id || ''),
      {
        successMessage: `${this.entityName}创建成功`,
        invalidateQueries: [this.queryKeys.list],
      }
    );
  }

  /**
   * 更新实体的Hook
   */
  useUpdate() {
    const { user } = useAuth();
    
    return useApiMutation(
      ({ id, data }: { id: number | string; data: F }) =>
        this.apiService.update(id, data, user?.id || ''),
      {
        successMessage: `${this.entityName}更新成功`,
        invalidateQueries: [this.queryKeys.list, this.queryKeys.detail],
      }
    );
  }

  /**
   * 删除实体的Hook
   */
  useDelete() {
    const { user } = useAuth();
    
    return useApiMutation(
      (id: number | string) => this.apiService.delete(id, user?.id || ''),
      {
        successMessage: `${this.entityName}删除成功`,
        invalidateQueries: [this.queryKeys.list],
      }
    );
  }
}

/**
 * 创建管理hooks的工厂函数
 */
export function createManagementHooks<T extends BaseEntity, F extends BaseFormData>(
  apiService: BaseAPIService<T, F>,
  entityName: string,
  queryKeys: { list: string; detail: string }
) {
  const hooks = new BaseManagementHooks(apiService, entityName, queryKeys);
  
  return {
    useList: hooks.useList.bind(hooks),
    useDetail: hooks.useDetail.bind(hooks),
    useCreate: hooks.useCreate.bind(hooks),
    useUpdate: hooks.useUpdate.bind(hooks),
    useDelete: hooks.useDelete.bind(hooks),
  };
}

/**
 * 基础搜索Hook
 */
export function useBaseSearch<T extends BaseEntity>(
  data: T[] | undefined,
  searchFields: (keyof T)[] = ['name' as keyof T]
) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!data || !searchTerm.trim()) return data;

    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    );
  }, [data, searchTerm, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
  };
}

/**
 * 基础分页Hook
 */
export function useBasePagination<T>(
  data: T[] | undefined,
  pageSize: number = 10
) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil((data?.length || 0) / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data?.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

/**
 * 基础排序Hook
 */
export function useBaseSorting<T>(
  data: T[] | undefined,
  defaultSortField?: keyof T,
  defaultSortDirection: 'asc' | 'desc' = 'asc'
) {
  const [sortField, setSortField] = React.useState<keyof T | undefined>(defaultSortField);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(defaultSortDirection);

  const sortedData = React.useMemo(() => {
    if (!data || !sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: keyof T) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return {
    sortedData,
    sortField,
    sortDirection,
    handleSort,
  };
}
